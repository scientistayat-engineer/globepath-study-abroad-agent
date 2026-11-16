"""Step 1 - Analyze the user's input and turn it into a clean Profile."""
import re
from dataclasses import dataclass, field, asdict

from ..config import MIN_BUDGET, MAX_BUDGET
from . import knowledge_base as kb

COUNTRY_ALIASES = {
    "uk": "uk", "united kingdom": "uk", "england": "uk", "britain": "uk",
    "great britain": "uk", "scotland": "uk",
    "usa": "usa", "us": "usa", "u.s.": "usa", "united states": "usa",
    "united states of america": "usa", "america": "usa",
    "canada": "canada", "germany": "germany", "deutschland": "germany",
    "australia": "australia", "netherlands": "netherlands",
    "the netherlands": "netherlands", "holland": "netherlands",
}

DEGREE_ALIASES = {
    "bachelor": ["bachelor", "bachelors", "bs", "bsc", "ba", "undergraduate", "undergrad"],
    "master": ["master", "masters", "ms", "msc", "ma", "mba", "postgraduate", "graduate"],
    "phd": ["phd", "ph.d", "doctorate", "doctoral"],
}

ACCOMMODATION_TYPES = ["dorm", "shared", "private"]


class ValidationError(Exception):
    def __init__(self, details):
        super().__init__("Invalid input")
        self.details = details


@dataclass
class Profile:
    country: str
    country_name: str
    degree: str
    field_code: str
    field_label: str
    field_input: str
    program_hint: str
    budget: float
    accommodation: str
    notes: list = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


def _clean(text):
    return re.sub(r"\s+", " ", str(text or "").replace("'", "").replace("\u2019", "")).strip().lower()


def normalize_country(text):
    return COUNTRY_ALIASES.get(_clean(text))


def normalize_degree(text):
    t = _clean(text)
    for key, aliases in DEGREE_ALIASES.items():
        if t in aliases:
            return key
    return None


def parse_budget(value):
    try:
        number = float(re.sub(r"[^0-9.]", "", str(value)))
    except ValueError:
        return None
    return number if number > 0 else None


def match_field(text):
    """Return (field_code, program_hint) for free text, or (None, '')."""
    t = _clean(text)
    if not t:
        return None, ""
    data = kb.fields()
    tokens = set(re.findall(r"[a-z0-9.]+", t))

    best_code, best_score = None, 0
    for code, words in data["keywords"].items():
        score = 0
        for word in words:
            if len(word) <= 3:
                score += 1 if word in tokens else 0
            elif word in t:
                score += 1
        if score > best_score:
            best_code, best_score = code, score

    hint = ""
    for code, programs in data["programs"].items():
        for name in programs:
            low = name.lower()
            if low == t or (len(t) >= 4 and (t in low or low in t)):
                return code, name
    return best_code, hint


def field_suggestions():
    data = kb.fields()
    names = []
    for programs in data["programs"].values():
        names.extend(programs)
    return sorted(set(names))


def analyze(payload):
    """Validate the payload and build a Profile. Raises ValidationError."""
    payload = payload or {}
    errors, notes = {}, []

    country = normalize_country(payload.get("country"))
    if not country:
        supported = ", ".join(c["name"] for c in kb.countries().values())
        errors["country"] = f"Choose one of the supported countries: {supported}."

    degree = normalize_degree(payload.get("degree"))
    if not degree:
        errors["degree"] = "Choose Bachelor's, Master's or PhD."

    field_input = str(payload.get("field") or "").strip()
    code, hint = match_field(field_input)
    if not field_input:
        errors["field"] = "Enter your field of study, for example Computer Science."
    elif not code:
        errors["field"] = ("We could not match that field. Try something like Computer Science, "
                           "Data Science, Engineering, Business, Health Sciences, Design, "
                           "Natural Sciences or Social Sciences.")

    budget = parse_budget(payload.get("budget"))
    if budget is None:
        errors["budget"] = "Enter your yearly budget in US dollars, for example 15000."
    elif budget < MIN_BUDGET or budget > MAX_BUDGET:
        errors["budget"] = f"Budget must be between ${MIN_BUDGET:,} and ${MAX_BUDGET:,} per year."

    accommodation = _clean(payload.get("accommodation") or "shared")
    if accommodation not in ACCOMMODATION_TYPES:
        errors["accommodation"] = "Accommodation must be dorm, shared or private."

    if errors:
        raise ValidationError(errors)

    label = kb.fields()["labels"][code]
    if hint:
        notes.append(f"Matched your field to the program '{hint}' in {label}.")
    elif _clean(field_input) != _clean(label):
        notes.append(f"Matched '{field_input}' to {label}.")

    return Profile(
        country=country,
        country_name=kb.countries()[country]["name"],
        degree=degree,
        field_code=code,
        field_label=label,
        field_input=field_input,
        program_hint=hint,
        budget=budget,
        accommodation=accommodation,
        notes=notes,
    )
