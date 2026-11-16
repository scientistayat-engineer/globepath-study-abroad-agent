"""Step 2 - Build the ranked university list under the user's budget."""
from statistics import median

from ..config import MAX_UNIVERSITIES
from . import knowledge_base as kb
from .cost_estimator import estimate

TIER_SCORE = {1: 100, 2: 75, 3: 55}


def _budget_fit(cost, budget):
    """100 with 10% headroom, 70 at the limit, falling to 0 at 25% over budget."""
    headroom = (budget - cost) / budget
    if headroom >= 0.10:
        return 100
    if headroom >= 0:
        return 70 + 30 * (headroom / 0.10)
    return max(0, 70 + headroom * (70 / 0.25))


def candidates(profile):
    result = []
    for uni in kb.universities():
        if uni["country"] != profile.country or profile.field_code not in uni["fields"]:
            continue
        costs = estimate(uni, profile.degree, profile.accommodation)
        fit = _budget_fit(costs["first_year"], profile.budget)
        score = round(0.5 * TIER_SCORE[uni["tier"]] + 0.5 * fit)
        within = costs["first_year"] <= profile.budget
        result.append({**uni, "costs": costs, "within_budget": within,
                       "over_by": 0 if within else costs["first_year"] - round(profile.budget),
                       "match_score": score})
    return result


def budget_level(profile, pool):
    if not pool:
        return "unknown"
    costs = [u["costs"]["first_year"] for u in pool]
    if profile.budget < min(costs):
        return "too low"
    mid = median(costs)
    if profile.budget < mid:
        return "tight"
    return "moderate" if profile.budget < 1.3 * mid else "comfortable"


def shortlist(profile, limit=MAX_UNIVERSITIES):
    """Within-budget universities first (best match first), then the closest stretch options."""
    pool = candidates(profile)
    within = sorted((u for u in pool if u["within_budget"]),
                    key=lambda u: (-u["match_score"], u["costs"]["first_year"]))
    over = sorted((u for u in pool if not u["within_budget"]),
                  key=lambda u: (u["costs"]["first_year"], -u["match_score"]))
    chosen = within[:limit]
    if len(chosen) < 3:
        chosen += over[: min(3, limit) - len(chosen) + (2 if not within else 0)]
    chosen = chosen[:limit]
    for index, uni in enumerate(chosen, start=1):
        uni["rank"] = index
    return chosen, pool
