"""Point the frontend at a remote API (needed for Firebase Hosting).

    python scripts/set_api_base.py https://your-app.vercel.app    # set
    python scripts/set_api_base.py --reset                        # same-origin again
"""
import sys
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "frontend" / "assets" / "js" / "config.js"
TEMPLATE = '''// Base URL of the API. Leave empty when the frontend and API share one origin
// (local run, Vercel). For Firebase Hosting, set it to your Vercel URL with
// scripts/set_api_base.py, for example "https://my-app.vercel.app".
export const API_BASE = "%s";
'''

if len(sys.argv) != 2:
    sys.exit(__doc__)
value = "" if sys.argv[1] == "--reset" else sys.argv[1].rstrip("/")
if value and not value.startswith(("http://", "https://")):
    sys.exit("The URL must start with https:// (or http:// for local testing).")
CONFIG.write_text(TEMPLATE % value, encoding="utf-8")
print("API_BASE is now", repr(value))
