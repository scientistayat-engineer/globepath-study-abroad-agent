"""Optional LLM call that polishes the agent's summary.

Providers (first one with a key wins): Groq, then Anthropic.
Any failure returns None, so the agent silently falls back to its rule-based text.
"""
import json
import urllib.request

from ..config import Config
from .tracing import traceable

SYSTEM = ("You are a study abroad advisor. Rewrite the draft summary in 3 to 4 clear, friendly "
          "sentences for a student. Use only the facts provided. Do not invent numbers, "
          "universities or scholarships. Reply with the summary text only.")


def _prompt(facts, draft):
    return "Facts:\n" + json.dumps(facts) + "\n\nDraft:\n" + draft


def _post(url, headers, body):
    headers = {"content-type": "application/json", "user-agent": "globepath/1.0", **headers}
    request = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers=headers)
    with urllib.request.urlopen(request, timeout=Config.LLM_TIMEOUT) as response:
        return json.load(response)


def _groq(facts, draft):
    data = _post(Config.GROQ_API_URL, {"authorization": f"Bearer {Config.GROQ_API_KEY}"}, {
        "model": Config.GROQ_MODEL,
        "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": _prompt(facts, draft)}],
        "temperature": 0.4,
        "max_completion_tokens": 1200,
        "reasoning_effort": "low",
    })
    return (data["choices"][0]["message"].get("content") or "").strip()


def _anthropic(facts, draft):
    data = _post(Config.ANTHROPIC_API_URL,
                 {"x-api-key": Config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"}, {
                     "model": Config.ANTHROPIC_MODEL, "max_tokens": 400, "system": SYSTEM,
                     "messages": [{"role": "user", "content": _prompt(facts, draft)}]})
    return "".join(block.get("text", "") for block in data.get("content", [])).strip()


@traceable(name="llm_summary_polish", run_type="chain", tags=["globepath", "llm"])
def polish_summary(plan_facts, draft):
    try:
        if Config.GROQ_API_KEY:
            return _groq(plan_facts, draft) or None
        if Config.ANTHROPIC_API_KEY:
            return _anthropic(plan_facts, draft) or None
    except Exception:
        return None
    return None
