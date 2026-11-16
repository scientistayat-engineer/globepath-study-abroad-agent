"""Flask application: serves the frontend and exposes the JSON API."""
from flask import Flask, jsonify, request

from .agent import StudyAbroadAgent, ValidationError
from .agent import knowledge_base as kb
from .agent.tracing import tracing_enabled
from .agent.analyzer import ACCOMMODATION_TYPES, field_suggestions, match_field, normalize_country, normalize_degree
from .agent.recommender import scholarships_for
from .config import CURRENCY_RATES, FRONTEND_DIR, MAX_BUDGET, MIN_BUDGET, Config


def create_app():
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    agent = StudyAbroadAgent()

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "ai_enhanced_summaries": bool(Config.GROQ_API_KEY or Config.ANTHROPIC_API_KEY),
                        "langsmith_tracing": tracing_enabled()})

    @app.get("/api/meta")
    def meta():
        fields = kb.fields()
        return jsonify({
            "countries": [{"key": k, "name": v["name"], "currency": v["currency"], "flag": v["flag"]}
                          for k, v in kb.countries().items()],
            "degrees": [{"key": "bachelor", "label": "Bachelor's"}, {"key": "master", "label": "Master's"},
                        {"key": "phd", "label": "PhD"}],
            "fields": [{"code": c, "label": l} for c, l in fields["labels"].items()],
            "field_suggestions": field_suggestions(),
            "accommodation": ACCOMMODATION_TYPES,
            "rates": CURRENCY_RATES,
            "budget_limits": {"min": MIN_BUDGET, "max": MAX_BUDGET},
        })

    @app.post("/api/plan")
    def plan():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Send a JSON body with country, degree, field and budget."}), 400
        return jsonify(agent.run(payload))

    @app.get("/api/scholarships")
    def scholarships():
        country = normalize_country(request.args.get("country")) if request.args.get("country") not in (None, "", "all") else "all"
        degree = normalize_degree(request.args.get("degree")) if request.args.get("degree") else None
        field_text = request.args.get("field", "")
        if field_text.upper() in kb.fields()["labels"]:
            code = field_text.upper()
        else:
            code = match_field(field_text)[0] if field_text and field_text != "all" else None
        if country is None:
            return jsonify({"error": "Unknown country."}), 400
        items = scholarships_for(country, degree, code)
        query = request.args.get("q", "").strip().lower()
        if query:
            items = [s for s in items if query in s["name"].lower() or query in s["description"].lower()]
        return jsonify({"count": len(items), "items": items})

    @app.after_request
    def cors(response):
        origin = request.headers.get("Origin")
        allowed = Config.ALLOWED_ORIGINS
        if origin and request.path.startswith("/api/") and ("*" in allowed or origin in allowed):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Max-Age"] = "86400"
        return response

    @app.errorhandler(ValidationError)
    def invalid(error):
        return jsonify({"error": "Please check your details.", "details": error.details}), 400

    @app.errorhandler(404)
    def not_found(_):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Not found."}), 404
        return app.send_static_file("index.html"), 404

    @app.errorhandler(Exception)
    def server_error(error):
        app.logger.exception(error)
        return jsonify({"error": "Something went wrong on the server."}), 500

    return app
