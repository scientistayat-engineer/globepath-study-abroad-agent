"""Central configuration. Values can be overridden with environment variables."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR.parent / "frontend"


class Config:
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "5000"))
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    # Optional: lets the agent polish its written summary with an LLM.
    # Without any key the agent works fully offline with rule-based text.
    # Groq is checked first, then Anthropic.
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
    ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
    LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "8"))

    # Browser origins allowed to call /api from another site (for example Firebase Hosting).
    # Comma separated, for example: https://my-app.web.app,https://my-app.firebaseapp.com
    ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]


# Approximate rates (1 USD = x). Update these before relying on them.
CURRENCY_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.78,
    "CAD": 1.37,
    "AUD": 1.52,
    "PKR": 280.0,
    "INR": 88.0,
}

MIN_BUDGET = 1000
MAX_BUDGET = 200000
MAX_UNIVERSITIES = 6
