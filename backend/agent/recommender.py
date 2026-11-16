"""Step 3 - Suggest degree programs, scholarships and activities."""
from . import knowledge_base as kb

DEGREE_PREFIX = {"bachelor": "BSc ", "master": "MSc ", "phd": "PhD in "}


def programs_for(university, profile, count=3):
    names = list(kb.fields()["programs"][profile.field_code])
    start = sum(ord(ch) for ch in university["id"]) % len(names)
    names = names[start:] + names[:start]
    if profile.program_hint in names:
        names.remove(profile.program_hint)
        names.insert(0, profile.program_hint)
    return [DEGREE_PREFIX[profile.degree] + name for name in names[:count]]


def recommended_programs(profile):
    names = list(kb.fields()["programs"][profile.field_code])
    if profile.program_hint in names:
        names.remove(profile.program_hint)
        names.insert(0, profile.program_hint)
    return [DEGREE_PREFIX[profile.degree] + name for name in names]


def scholarships_for(country, degree, field_code=None):
    items = []
    for sch in kb.scholarships():
        if country and country != "all" and sch["country"] != country:
            continue
        if degree and degree not in sch["degrees"]:
            continue
        if field_code and "all" not in sch["fields"] and field_code not in sch["fields"]:
            continue
        items.append(sch)
    return sorted(items, key=lambda s: -s["amount_usd"])


def activities_for(profile):
    data = kb.activities()
    return {
        "field": data["fields"][profile.field_code],
        "country": data["countries"][profile.country],
    }


def potential_savings(scholarship_list, total_cost):
    """The single largest eligible award, capped at the total cost."""
    if not scholarship_list:
        return None
    best = scholarship_list[0]
    return {"name": best["name"], "amount": min(best["amount_usd"], total_cost),
            "coverage": best["coverage"]}
