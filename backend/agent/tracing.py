"""Optional LangSmith tracing.

If the `langsmith` package is installed and tracing is switched on with environment
variables, every agent run is recorded as a trace with one child span per step.
Otherwise `traceable` is a harmless no-op, so the app never depends on LangSmith.

Environment variables (read by the LangSmith SDK):
    LANGSMITH_TRACING=true
    LANGSMITH_API_KEY=...
    LANGSMITH_PROJECT=globepath-study-abroad
    LANGSMITH_TRACING_BACKGROUND=false   # recommended on Vercel (serverless)
"""
import os

try:
    from langsmith import traceable
    AVAILABLE = True
except Exception:  # package missing or incompatible
    AVAILABLE = False

    def traceable(*args, **kwargs):
        if len(args) == 1 and callable(args[0]) and not kwargs:
            return args[0]
        return lambda fn: fn


def tracing_enabled():
    flag = (os.getenv("LANGSMITH_TRACING") or os.getenv("LANGCHAIN_TRACING_V2") or "").lower() == "true"
    key = os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY")
    return AVAILABLE and flag and bool(key)
