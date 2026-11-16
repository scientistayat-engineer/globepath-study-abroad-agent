import { initLayout } from "./layout.js";
import { getMeta, getScholarships } from "./api.js";
import { $, esc, debounce } from "./utils.js";
import { money, degreeLabel } from "./format.js";

initLayout("scholarships.html");
const f = { country: $("#f-country"), degree: $("#f-degree"), field: $("#f-field"), q: $("#f-q") };
const results = $("#results");
const FALLBACK_FIELDS = ["CS", "DS", "EN", "BM", "HS", "NS", "SS", "DA"];

async function setup() {
  let meta = null;
  try { meta = await getMeta(); } catch { /* use fallbacks */ }
  const countries = meta?.countries || [];
  f.country.innerHTML = '<option value="all">All countries</option>' + countries.map((c) => `<option value="${c.key}">${esc(c.name)}</option>`).join("");
  f.degree.innerHTML = '<option value="">Any degree</option>' + ["bachelor", "master", "phd"].map((d) => `<option value="${d}">${degreeLabel(d)}</option>`).join("");
  const fields = meta?.fields || FALLBACK_FIELDS.map((c) => ({ code: c, label: c }));
  f.field.innerHTML = '<option value="">Any field</option>' + fields.map((x) => `<option value="${x.code}">${esc(x.label)}</option>`).join("");
  const initial = new URLSearchParams(location.search);
  if (initial.get("country")) f.country.value = initial.get("country");
  search();
}

async function search() {
  results.setAttribute("aria-busy", "true");
  try {
    const data = await getScholarships({ country: f.country.value, degree: f.degree.value, field: f.field.value, q: f.q.value });
    $("#count").textContent = `${data.count} scholarship${data.count === 1 ? "" : "s"} found`;
    results.innerHTML = data.items.length ? data.items.map((s) => `
      <article class="card card-lift sch-card"><div class="chips">
        <span class="tag">${esc(s.country.toUpperCase())}</span>${s.degrees.map((d) => `<span class="tag tag-warn">${esc(degreeLabel(d))}</span>`).join("")}
        <span class="tag ${s.coverage === "full" ? "tag-ok" : ""}">${esc(s.coverage)}</span></div>
        <h3>${esc(s.name)}</h3><p class="muted" style="font-size:14px">${esc(s.description)}</p>
        <div class="toolbar" style="margin-top:auto"><b class="big-money" style="font-size:22px">Up to ${money(s.amount_usd)}</b><span class="muted" style="font-size:13px">per year</span></div>
        ${s.url ? `<a class="btn btn-sm" href="${esc(s.url)}" target="_blank" rel="noopener">View official site</a>` : '<span class="muted" style="font-size:13px">Check each university website for details.</span>'}
      </article>`).join("")
      : '<div class="card empty" style="grid-column:1/-1"><h3>No scholarships match</h3><p>Try another country or remove a filter.</p></div>';
  } catch (error) {
    results.innerHTML = `<div class="card empty" style="grid-column:1/-1" role="alert"><h3>Could not load scholarships</h3><p>${esc(error.message)}</p></div>`;
  }
  results.removeAttribute("aria-busy");
}

const run = debounce(search, 250);
[f.country, f.degree, f.field].forEach((el) => el.addEventListener("change", search));
f.q.addEventListener("input", run);
$("#filter-form").addEventListener("submit", (e) => { e.preventDefault(); search(); });
setup();
