"""Loads the JSON knowledge base (universities, scholarships, costs, fields)."""
import json
from functools import lru_cache

from ..config import DATA_DIR


@lru_cache(maxsize=None)
def _load(name):
    with open(DATA_DIR / name, encoding="utf-8") as fh:
        return json.load(fh)


def universities():
    return _load("universities.json")


def scholarships():
    return _load("scholarships.json")


def countries():
    return _load("countries.json")


def fields():
    return _load("fields.json")


def activities():
    return _load("activities.json")
