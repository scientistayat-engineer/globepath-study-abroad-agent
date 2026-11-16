"""Capture README screenshots with Playwright.

Usage (with the app running on http://127.0.0.1:5000):
    pip install playwright && playwright install chromium
    python scripts/take_screenshots.py
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000"
OUT = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
PLAN = "/plan.html?country=germany&degree=master&field=Computer%20Science&budget=15000&accommodation=shared"


def main():
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.on("pageerror", lambda e: problems.append(f"pageerror: {e}"))
        page.on("console", lambda m: m.type == "error" and "fonts.g" not in m.text
                and "ERR_" not in m.text and problems.append(f"console: {m.text}"))

        page.goto(BASE + "/")
        page.wait_for_selector(".dest")
        page.wait_for_timeout(900)
        page.screenshot(path=OUT / "01-home.png", full_page=True)

        page.fill("#field", "Computer Science")
        page.fill("#budget", "15000")
        page.select_option("#country", "germany")
        page.click("#submit-btn")
        page.wait_for_selector(".progress-card")
        page.wait_for_timeout(1500)
        page.screenshot(path=OUT / "02-agent-running.png")
        page.wait_for_selector(".uni-grid", timeout=15000)
        page.wait_for_timeout(1400)
        page.screenshot(path=OUT / "03-plan-results.png", full_page=True)

        page.click("#save-btn")
        for box in page.query_selector_all("[data-cmp]")[:3]:
            box.check()
        page.goto(BASE + "/compare.html")
        page.wait_for_selector("table")
        page.screenshot(path=OUT / "04-compare.png", full_page=True)

        page.goto(BASE + "/scholarships.html?country=uk")
        page.wait_for_selector(".sch-card")
        page.screenshot(path=OUT / "05-scholarships.png", full_page=True)

        page.goto(BASE + "/dashboard.html")
        page.wait_for_selector(".tile")
        page.screenshot(path=OUT / "06-dashboard.png", full_page=True)

        page.goto(BASE + "/login.html")
        page.wait_for_selector("#auth-form")
        page.screenshot(path=OUT / "07-login.png")

        dark = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark")
        dpage = dark.new_page()
        dpage.goto(BASE + PLAN)
        dpage.wait_for_selector(".uni-grid", timeout=15000)
        dpage.wait_for_timeout(1400)
        dpage.screenshot(path=OUT / "08-dark-mode.png")

        urdu = browser.new_context(viewport={"width": 1440, "height": 900})
        urdu.add_init_script('localStorage.setItem("globepath:lang", JSON.stringify("ur"))')
        upage = urdu.new_page()
        upage.goto(BASE + "/")
        upage.wait_for_selector(".dest")
        upage.wait_for_timeout(900)
        upage.screenshot(path=OUT / "10-urdu-home.png")

        mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        mpage = mobile.new_page()
        mpage.goto(BASE + "/")
        mpage.wait_for_selector(".dest")
        mpage.wait_for_timeout(900)
        mpage.screenshot(path=OUT / "09-mobile-home.png")
        browser.close()
    print("Saved screenshots to", OUT)
    print("Problems:", problems or "none")


if __name__ == "__main__":
    main()
