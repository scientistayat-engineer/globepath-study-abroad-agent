"""Builds the application timeline and the document checklist."""
from . import knowledge_base as kb


def build_timeline(country_key, degree):
    country = kb.countries()[country_key]
    first = ("Research supervisors and reach out to them" if degree == "phd"
             else "Research programs and shortlist universities")
    return [
        {"months_before": 12, "title": first,
         "detail": "Compare programs, entry requirements and costs."},
        {"months_before": 10, "title": "Prepare tests and documents",
         "detail": f"Language tests: {country['tests']}."},
        {"months_before": 8, "title": "Submit applications and scholarships",
         "detail": "Apply early. Many scholarship deadlines are before admission deadlines."},
        {"months_before": 6, "title": "Compare offers and accept one",
         "detail": "Confirm tuition, deposits and deadlines in writing."},
        {"months_before": 4, "title": "Arrange funds and apply for your visa",
         "detail": country["visa_notes"]},
        {"months_before": 3, "title": "Book accommodation",
         "detail": country["tips"][1] if len(country["tips"]) > 1 else "Apply for student housing early."},
        {"months_before": 1, "title": "Book flights and insurance",
         "detail": "Book your flights once your visa is approved."},
        {"months_before": 0, "title": "Arrive and register",
         "detail": "Complete university registration and any local registration."},
    ]


def checklist(country_key):
    return list(kb.countries()[country_key]["docs"])
