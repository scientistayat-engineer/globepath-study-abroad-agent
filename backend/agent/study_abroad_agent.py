"""The Study Abroad Plan agent: a single agent that performs a single task.

Task: take (country, degree, budget, field) and produce a complete study abroad plan.
Pipeline: analyze -> match universities -> recommend -> estimate costs -> build plan.

Each step is a LangSmith span when tracing is enabled (see tracing.py).
"""
import time
from datetime import datetime, timezone

from . import knowledge_base as kb
from .analyzer import analyze
from .cost_estimator import accommodation_options
from .llm import polish_summary
from .recommender import (activities_for, potential_savings, programs_for,
                          recommended_programs, scholarships_for)
from .timeline import build_timeline, checklist
from .tracing import traceable
from .university_matcher import budget_level, shortlist

analyze_profile = traceable(name="analyze_profile", run_type="chain")(analyze)
match_universities = traceable(name="match_universities", run_type="chain")(shortlist)


def _money(value):
    return f"${round(value):,}"


def _degree_label(degree):
    return {"bachelor": "Bachelor's", "master": "Master's", "phd": "PhD"}[degree]


@traceable(name="recommend_programs_scholarships_activities", run_type="chain")
def recommend(profile, universities):
    for uni in universities:
        uni["programs"] = programs_for(uni, profile)
    eligible = scholarships_for(profile.country, profile.degree, profile.field_code)
    return eligible, activities_for(profile)


@traceable(name="estimate_fees_accommodation_travel", run_type="chain")
def estimate_guide(profile, universities, eligible):
    country = kb.countries()[profile.country]
    guide = {
        "name": country["name"], "flag": country["flag"], "currency": country["currency"],
        "visa": {"fee": country["visa"], "notes": country["visa_notes"], "documents": country["docs"]},
        "work": country["work"], "language_tests": country["tests"],
        "intakes": country["intakes"], "tips": country["tips"],
        "accommodation": accommodation_options(profile.country),
        "flights": country["flights"],
    }
    reference = universities[0]["costs"]["first_year"] if universities else 0
    return guide, potential_savings(eligible, reference)


def _summary(profile, universities, within, level):
    label = _degree_label(profile.degree)
    if not universities:
        return (f"We found no {profile.field_label} programs in {profile.country_name} in our data. "
                "Try a different country or field.")
    if within:
        best, cheapest = within[0], min(within, key=lambda u: u["costs"]["first_year"])
        text = (f"For a {label} in {profile.field_label} in {profile.country_name} with a budget of "
                f"{_money(profile.budget)} per year, {len(within)} universities fit your budget. "
                f"{best['name']} is the best match, at about {_money(best['costs']['first_year'])} "
                f"for the first year. ")
        if cheapest["id"] != best["id"]:
            text += (f"The most affordable option is {cheapest['name']} at about "
                     f"{_money(cheapest['costs']['first_year'])}. ")
        return text + f"Your budget level for this country is {level}."
    closest = universities[0]
    return (f"No university in our data fits {_money(profile.budget)} per year for a {label} in "
            f"{profile.field_label} in {profile.country_name}. The closest option is {closest['name']} "
            f"at about {_money(closest['costs']['first_year'])} for the first year, "
            f"{_money(closest['over_by'])} over budget.")


def _warnings(profile, universities, within, level):
    notes = list(profile.notes)
    if not within and universities:
        notes.append("No universities fit your budget. Showing the closest options. Consider a "
                     "higher budget, shared or dorm accommodation, or scholarships.")
    if profile.accommodation == "private" and level in ("tight", "too low"):
        notes.append("Private rent is the most expensive option. Switching to shared or dorm housing lowers costs.")
    if profile.degree == "phd":
        notes.append("PhD positions are often funded with a stipend. Tuition shown is an upper estimate; check each program.")
    notes.append("All costs are approximate estimates in US dollars. Confirm fees on each university website.")
    return notes


@traceable(name="study_abroad_plan", run_type="chain", tags=["globepath", "single-agent"])
def _run_pipeline(payload):
    trace = []

    def step(name, started, detail):
        trace.append({"step": name, "detail": detail,
                      "ms": round((time.perf_counter() - started) * 1000, 2)})

    t = time.perf_counter()
    profile = analyze_profile(payload)
    step("Analyze your profile", t,
         f"{profile.country_name}, {profile.degree}, {profile.field_label}, "
         f"budget {_money(profile.budget)} per year")

    t = time.perf_counter()
    universities, pool = match_universities(profile)
    level = budget_level(profile, pool)
    within = [u for u in universities if u["within_budget"]]
    step("Find universities under budget", t,
         f"{len(pool)} universities offer {profile.field_label}; {len(within)} fit the budget")

    t = time.perf_counter()
    eligible, activities = recommend(profile, universities)
    step("Suggest programs, scholarships and activities", t,
         f"{len(eligible)} scholarships and {len(activities['field']) + len(activities['country'])} activities")

    t = time.perf_counter()
    guide, savings = estimate_guide(profile, universities, eligible)
    step("Estimate fees, accommodation and travel", t,
         "Costs include tuition, rent, food, transport, insurance, visa and flights")

    warnings = _warnings(profile, universities, within, level)
    summary_text = _summary(profile, universities, within, level)
    enhanced = polish_summary(
        {"country": profile.country_name, "degree": profile.degree, "field": profile.field_label,
         "budget": profile.budget, "universities": [u["name"] for u in universities[:3]],
         "within_budget": len(within)}, summary_text)

    return {
        "profile": profile.to_dict(),
        "summary": {
            "headline": f"{_degree_label(profile.degree)} in {profile.field_label}, {profile.country_name}",
            "text": enhanced or summary_text,
            "ai_enhanced": bool(enhanced),
            "warnings": warnings,
        },
        "stats": {"within_budget": len(within), "available": len(pool), "budget_level": level,
                  "cheapest_first_year": min((u["costs"]["first_year"] for u in pool), default=None)},
        "universities": universities,
        "programs": recommended_programs(profile),
        "scholarships": eligible,
        "potential_savings": savings,
        "activities": activities,
        "country_guide": guide,
        "timeline": build_timeline(profile.country, profile.degree),
        "checklist": checklist(profile.country),
        "agent_trace": trace,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


class StudyAbroadAgent:
    """Single agent, single task: turn a student's details into a study abroad plan."""

    def run(self, payload):
        return _run_pipeline(payload)
