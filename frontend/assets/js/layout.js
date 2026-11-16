import { store } from "./store.js";
import { icon } from "./icons.js";
import { applyLang, getLang, t, toggleLang } from "./i18n.js";
import { esc } from "./utils.js";

const LINKS = [
  ["index.html", "nav.home"], ["scholarships.html", "nav.scholarships"],
  ["compare.html", "nav.compare"], ["dashboard.html", "nav.dashboard"],
];

function currentTheme() {
  return store.get("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById("theme-btn");
  if (btn) {
    btn.innerHTML = icon(theme === "dark" ? "sun" : "moon", 20);
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}

function navHtml(active) {
  const user = store.get("user");
  const links = LINKS.map(([href, key]) =>
    `<a href="${href}" ${href === active ? 'aria-current="page"' : ""} data-i18n="${key}">${t(key)}</a>`).join("");
  const account = user
    ? `<a class="user-chip" href="dashboard.html" aria-label="Open dashboard"><b>${esc(user.name[0]?.toUpperCase() || "G")}</b>${esc(user.name)}</a>`
    : `<a class="btn btn-sm" href="login.html" data-i18n="nav.login">${t("nav.login")}</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
  <nav class="nav" aria-label="Main"><div class="container nav-inner">
    <a class="logo" href="index.html">${icon("globe", 26)}Globepath</a>
    <div class="nav-links" id="nav-links">${links}</div>
    <div class="nav-tools">
      <button class="icon-btn lang-btn" id="lang-btn" type="button" aria-label="Switch language">${getLang() === "en" ? "اردو" : "EN"}</button>
      <button class="icon-btn" id="theme-btn" type="button"></button>
      ${account}
      <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false">${icon("menu", 20)}</button>
    </div></div></nav>`;
}

const footerHtml = `<footer class="footer"><div class="container footer-inner">
  <a class="logo" href="index.html">${icon("globe", 24)}Globepath</a>
  <span>AI study abroad planner. Costs are estimates; confirm on each university website.</span></div></footer>`;

export function initLayout(active) {
  applyTheme(currentTheme());
  document.getElementById("nav").innerHTML = navHtml(active);
  document.getElementById("footer").innerHTML = footerHtml;
  applyTheme(currentTheme());
  applyLang();

  document.getElementById("theme-btn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    store.set("theme", next);
    applyTheme(next);
  });
  document.getElementById("lang-btn").addEventListener("click", () => {
    toggleLang();
    document.getElementById("lang-btn").textContent = getLang() === "en" ? "اردو" : "EN";
  });
  const menu = document.getElementById("menu-btn");
  menu.addEventListener("click", () => {
    const open = document.getElementById("nav-links").classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
}
