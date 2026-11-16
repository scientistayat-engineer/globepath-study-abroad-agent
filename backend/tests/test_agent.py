import io
import json
import unittest
from unittest import mock

from backend.agent import StudyAbroadAgent, ValidationError
from backend.agent.analyzer import match_field, normalize_country, normalize_degree
from backend.agent import llm
from backend.app import create_app
from backend.config import Config


class AnalyzerTests(unittest.TestCase):
    def test_country_aliases(self):
        self.assertEqual(normalize_country("United Kingdom"), "uk")
        self.assertEqual(normalize_country("USA"), "usa")
        self.assertIsNone(normalize_country("Narnia"))

    def test_degree_aliases(self):
        self.assertEqual(normalize_degree("Master's"), "master")
        self.assertEqual(normalize_degree("MBA"), "master")
        self.assertEqual(normalize_degree("Doctorate"), "phd")

    def test_field_matching(self):
        self.assertEqual(match_field("Machine Learning"), ("DS", "Machine Learning"))
        self.assertEqual(match_field("software engineering")[0], "CS")
        self.assertEqual(match_field("mechanical")[0], "EN")
        self.assertIsNone(match_field("zzzz")[0])


class AgentTests(unittest.TestCase):
    def setUp(self):
        self.agent = StudyAbroadAgent()
        self.payload = {"country": "Germany", "degree": "Master's", "field": "Computer Science", "budget": 15000}

    def test_plan_has_all_sections(self):
        plan = self.agent.run(self.payload)
        for key in ("summary", "universities", "scholarships", "activities", "country_guide",
                    "timeline", "checklist", "agent_trace", "programs"):
            self.assertIn(key, plan)
        self.assertEqual(len(plan["agent_trace"]), 4)

    def test_universities_within_budget(self):
        plan = self.agent.run(self.payload)
        within = [u for u in plan["universities"] if u["within_budget"]]
        self.assertTrue(within)
        for uni in within:
            self.assertLessEqual(uni["costs"]["first_year"], 15000)
        self.assertEqual([u["rank"] for u in plan["universities"]], list(range(1, len(plan["universities"]) + 1)))

    def test_cost_breakdown_adds_up(self):
        for uni in self.agent.run(self.payload)["universities"]:
            c = uni["costs"]
            self.assertEqual(c["annual"], c["tuition"] + c["living"])
            self.assertEqual(c["first_year"], c["annual"] + c["visa"] + c["flights"])

    def test_low_budget_returns_closest_options(self):
        plan = self.agent.run({**self.payload, "country": "usa", "budget": 3000})
        self.assertTrue(plan["universities"])
        self.assertFalse(any(u["within_budget"] for u in plan["universities"]))
        self.assertTrue(all(u["over_by"] > 0 for u in plan["universities"]))

    def test_validation_errors(self):
        with self.assertRaises(ValidationError) as ctx:
            self.agent.run({"country": "Narnia", "degree": "x", "field": "", "budget": "abc"})
        self.assertEqual(set(ctx.exception.details), {"country", "degree", "field", "budget"})

    def test_higher_budget_never_reduces_matches(self):
        low = self.agent.run({**self.payload, "country": "uk", "budget": 30000})["stats"]["within_budget"]
        high = self.agent.run({**self.payload, "country": "uk", "budget": 60000})["stats"]["within_budget"]
        self.assertGreaterEqual(high, low)

    def test_every_country_and_degree_works(self):
        for country in ("germany", "canada", "uk", "australia", "usa", "netherlands"):
            for degree in ("bachelor", "master", "phd"):
                plan = self.agent.run({"country": country, "degree": degree, "field": "Data Science", "budget": 40000})
                self.assertTrue(plan["universities"], (country, degree))


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_health_and_meta(self):
        self.assertEqual(self.client.get("/api/health").json["status"], "ok")
        meta = self.client.get("/api/meta").json
        self.assertEqual(len(meta["countries"]), 6)

    def test_plan_endpoint(self):
        r = self.client.post("/api/plan", json={"country": "canada", "degree": "master",
                                                "field": "Engineering", "budget": 35000})
        self.assertEqual(r.status_code, 200)
        self.assertIn("universities", r.json)

    def test_plan_validation_error(self):
        r = self.client.post("/api/plan", json={"country": "canada"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("details", r.json)

    def test_plan_bad_body(self):
        self.assertEqual(self.client.post("/api/plan", data="nope").status_code, 400)

    def test_scholarships_filter(self):
        r = self.client.get("/api/scholarships?country=uk&degree=master")
        self.assertGreater(r.json["count"], 0)
        self.assertTrue(all(s["country"] == "uk" for s in r.json["items"]))
        self.assertEqual(self.client.get("/api/scholarships?country=zz").status_code, 400)

    def test_unknown_api_route(self):
        self.assertEqual(self.client.get("/api/nope").status_code, 404)


class LlmTests(unittest.TestCase):
    def test_no_key_returns_none(self):
        with mock.patch.object(Config, "GROQ_API_KEY", ""), mock.patch.object(Config, "ANTHROPIC_API_KEY", ""):
            self.assertIsNone(llm.polish_summary({}, "draft"))

    def test_groq_response_is_parsed(self):
        fake = io.BytesIO(json.dumps({"choices": [{"message": {"content": " Polished text. "}}]}).encode())
        with mock.patch.object(Config, "GROQ_API_KEY", "test-key"), \
                mock.patch("urllib.request.urlopen", return_value=fake) as opened:
            self.assertEqual(llm.polish_summary({"a": 1}, "draft"), "Polished text.")
        sent = opened.call_args[0][0]
        self.assertIn("Bearer test-key", sent.get_header("Authorization"))
        self.assertEqual(json.loads(sent.data)["model"], "openai/gpt-oss-120b")

    def test_network_failure_falls_back(self):
        with mock.patch.object(Config, "GROQ_API_KEY", "test-key"), \
                mock.patch("urllib.request.urlopen", side_effect=OSError("down")):
            self.assertIsNone(llm.polish_summary({}, "draft"))


class TracingTests(unittest.TestCase):
    def test_tracing_is_off_by_default_and_never_breaks_the_agent(self):
        from backend.agent import tracing
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertFalse(tracing.tracing_enabled())
        plan = StudyAbroadAgent().run({"country": "canada", "degree": "master", "field": "Data Science", "budget": 30000})
        self.assertTrue(plan["universities"])

    def test_fallback_decorator_is_a_noop(self):
        from backend.agent import tracing
        if tracing.AVAILABLE:
            self.skipTest("langsmith is installed; fallback not in use")
        @tracing.traceable(name="x", run_type="chain")
        def add(a, b):
            return a + b
        self.assertEqual(add(1, 2), 3)

    def test_health_reports_tracing_flag(self):
        self.assertIn("langsmith_tracing", create_app().test_client().get("/api/health").json)


class CorsTests(unittest.TestCase):
    def test_allowed_origin_gets_headers(self):
        with mock.patch.object(Config, "ALLOWED_ORIGINS", ["https://demo.web.app"]):
            client = create_app().test_client()
            r = client.get("/api/health", headers={"Origin": "https://demo.web.app"})
            self.assertEqual(r.headers["Access-Control-Allow-Origin"], "https://demo.web.app")
            pre = client.options("/api/plan", headers={"Origin": "https://demo.web.app"})
            self.assertEqual(pre.headers["Access-Control-Allow-Origin"], "https://demo.web.app")

    def test_other_origin_gets_nothing(self):
        with mock.patch.object(Config, "ALLOWED_ORIGINS", ["https://demo.web.app"]):
            r = create_app().test_client().get("/api/health", headers={"Origin": "https://evil.example"})
            self.assertNotIn("Access-Control-Allow-Origin", r.headers)


class VercelEntryTests(unittest.TestCase):
    def test_entry_point_serves_api_and_pages(self):
        import importlib
        import api.index as entry
        importlib.reload(entry)
        client = entry.app.test_client()
        self.assertEqual(client.get("/api/health").status_code, 200)
        self.assertEqual(client.get("/plan.html").status_code, 200)
        self.assertEqual(client.get("/assets/js/api.js").status_code, 200)


if __name__ == "__main__":
    unittest.main()
