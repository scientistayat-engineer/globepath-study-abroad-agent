"""Estimates tuition, accommodation, living and travel costs (USD, approximate)."""
from . import knowledge_base as kb


def estimate(university, degree, accommodation="shared"):
    country = kb.countries()[university["country"]]
    factor = university["city_factor"]

    tuition = university["tuition_usd"][degree]
    rent_month = country["acc"][accommodation] * factor
    food_month = country["food"] * (1 + (factor - 1) / 2)
    transport_month = country["transport"]
    misc_month = country["misc"]

    accommodation_year = rent_month * 12
    food_year = food_month * 12
    transport_year = transport_month * 12
    misc_year = misc_month * 12
    insurance = country["insurance"]

    living = accommodation_year + food_year + transport_year + misc_year + insurance
    annual = tuition + living
    one_time = country["visa"] + country["flights"]

    return {
        "tuition": round(tuition),
        "accommodation": round(accommodation_year),
        "food": round(food_year),
        "transport": round(transport_year),
        "insurance": round(insurance),
        "misc": round(misc_year),
        "living": round(living),
        "annual": round(annual),
        "visa": round(country["visa"]),
        "flights": round(country["flights"]),
        "first_year": round(annual + one_time),
        "monthly_living": round(rent_month + food_month + transport_month + misc_month + insurance / 12),
    }


def accommodation_options(country_key):
    country = kb.countries()[country_key]
    return [
        {"type": kind, "monthly": monthly, "annual": monthly * 12}
        for kind, monthly in country["acc"].items()
    ]
