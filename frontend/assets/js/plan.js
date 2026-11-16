import { initLayout } from "./layout.js";
import { generatePlan, getMeta } from "./api.js";
import { store, savePlan, planUrl } from "./store.js";
import { $, $$, esc, sleep, reducedMotion, debounce, toast, animateBars, countUp } from "./utils.js";
import { money, usd, degreeLabel, CURRENCIES, getCurrency, setCurrency } from "./format.js";
import { icon } from "./icons.js";

initLayout("");

const head = $("#plan-head");
const root = $("#plan-root");
const params = new URLSearchParams(location.search);
let req = {
  country: params.get("country") || "", degree: params.get("degree") || "", field: params.get("field") || "",
  budget: params.get("budget") || "", accommodation: params.get("accommodation") || "shared",
};
let plan = null;
let selectedId = null;

if (!req.country || !req.degree || !req.field || !req.budget) location.replace("index.html");

const STEPS = [
  ["Analyze your profile", "Reading country, degree, field and budget"],
  ["Find universities under budget", "Matching programs to your field"],
  ["Suggest programs, scholarships and activities", "Looking up funding and student life"],
  ["Estimate fees, accommodation and travel", "Adding up tuition, rent, visa and flights"],
];
const ACC_LABEL = { dorm: "Dorm", shared: "Shared flat", private: "Private rent" };
const COLORS = { tuition: "#2F5BEA", accommodation: "#14B8A6", daily: "#8B5CF6", other: "#F59E0B", travel: "#EF6C4D" };

/* ---------- Loading state ---------- */
function renderProgress() {
  head.innerHTML = "";
  root.innerHTML = `<div class="card progress-card" role="status" aria-live="polite">
    <div class="eyebrow">Your agent is working</div>
    <h1>Building your study abroad plan</h1>
    <p class="muted" style="margin-bottom:20px">${esc(req.country)} · ${esc(req.degree)} · ${esc(req.field)} · $${Number(req.budget).toLocaleString()} / year</p>
    <div class="meter" style="margin-bottom:8px"><i id="prog-bar"></i></div>
    ${STEPS.map(([title, detail], i) => `<div class="progress-step" data-step="${i}">
      <div class="step-dot">${icon("check", 16, 3)}</div>
      <div><b>${title}</b><div class="muted" style="font-size:14px">${detail}</div></div></div>`).join("")}</div>`;
}

async function animateProgress(total) {
  const each = total / STEPS.length;
  for (let i = 0; i < STEPS.length; i++) {
    const row = $(`[data-step="${i}"]`);
    if (!row) return;
    row.classList.add("active");
    $("#prog-bar").style.width = Math.round(((i + 0.5) / STEPS.length) * 100) + "%";
    await sleep(each);
    row.classList.remove("active");
    row.classList.add("done");
  }
  const bar = $("#prog-bar");
  if (bar) bar.style.width = "100%";
}

function renderError(error) {
  head.innerHTML = "";
  const details = error.details ? `<ul>${Object.values(error.details).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : "";
  root.innerHTML = `<div class="card empty" role="alert"><h3>We could not build your plan</h3>
    <p>${esc(error.message)}</p>${details}
    <a class="btn" href="index.html">Change my details</a></div>`;
}

async function load() {
  renderProgress();
  const wait = reducedMotion() ? 300 : 2600;
  try {
    const [data] = await Promise.all([generatePlan(req), animateProgress(wait), getMeta().catch(() => null)]);
    plan = data;
  } catch (error) { renderError(error); return; }
  await sleep(reducedMotion() ? 0 : 350);
  selectedId = plan.universities[0]?.id || null;
  store.set("last-request", req);
  render();
}

async function refresh(patch) {
  req = { ...req, ...patch };
  root.setAttribute("aria-busy", "true");
  root.style.opacity = ".55";
  try {
    plan = await generatePlan(req);
    if (!plan.universities.some((u) => u.id === selectedId)) selectedId = plan.universities[0]?.id || null;
    history.replaceState(null, "", planUrl(req));
    store.set("last-request", req);
    render(false);
  } catch (error) { toast(error.message); }
  root.style.opacity = "";
  root.removeAttribute("aria-busy");
}

/* ---------- Rendering ---------- */
const shortlist = () => store.get("shortlist", { items: [] }).items;
const selected = () => plan.universities.find((u) => u.id === selectedId) || plan.universities[0];

function headHtml() {
  const p = plan.profile;
  return `<div class="page-head on-dark"><div class="container">
    <div class="eyebrow">Your study abroad plan</div><h1>${esc(plan.summary.headline)}</h1>
    <div class="chips"><span class="chip">Budget ${usd(p.budget)} / year</span><span class="chip">${esc(degreeLabel(p.degree))}</span>
    <span class="chip">${esc(p.field_label)}</span><span class="chip">${esc(p.country_name)}</span>
    <span class="chip">${esc(ACC_LABEL[p.accommodation])}</span></div></div></div>`;
}

function toolbarHtml() {
  const budget = Number(req.budget);
  return `<section class="card no-print" aria-label="Plan controls"><div class="toolbar">
    <div class="group" style="flex:1;min-width:260px"><div class="field" style="flex:1">
      <label for="budget-range">What if my budget changes? <b id="budget-val" style="color:var(--ink)">${usd(budget)}</b> per year</label>
      <input class="range" id="budget-range" type="range" min="1000" max="100000" step="500" value="${Math.min(budget, 100000)}"></div></div>
    <div class="group"><div class="field"><label>Accommodation</label><div class="segmented" role="group" aria-label="Accommodation type">
      ${Object.entries(ACC_LABEL).map(([k, l]) => `<button type="button" data-acc="${k}" aria-pressed="${req.accommodation === k}">${l}</button>`).join("")}</div></div>
      <div class="field"><label for="cur">Currency</label><select class="input" id="cur" style="width:110px">
      ${CURRENCIES.map((c) => `<option ${c === getCurrency() ? "selected" : ""}>${c}</option>`).join("")}</select></div></div>
    <div class="group"><button class="btn btn-ghost btn-sm" id="save-btn" type="button">${icon("save", 18)}Save plan</button>
      <button class="btn btn-ghost btn-sm" id="share-btn" type="button">${icon("share", 18)}Copy link</button>
      <button class="btn btn-ghost btn-sm" id="print-btn" type="button">${icon("pdf", 18)}Export PDF</button></div>
  </div></section>`;
}

function summaryHtml() {
  const s = plan.summary;
  const savings = plan.potential_savings;
  return `<section class="card"><h2 style="font-size:24px;margin-bottom:12px">Agent summary ${s.ai_enhanced ? '<span class="tag">Polished with AI</span>' : ""}</h2>
    <p>${esc(s.text)}</p>
    ${savings ? `<p class="notice notice-info" style="margin-top:14px">Biggest scholarship that fits this profile: <b>${esc(savings.name)}</b>, worth up to ${money(savings.amount)} per year (${esc(savings.coverage)} funding, competitive).</p>` : ""}
    <ul class="muted" style="margin:14px 0 0;padding-left:18px;font-size:14px">${s.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
    <div class="chips" style="margin-top:16px">${plan.programs.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></section>`;
}

function uniHtml() {
  const picked = new Set(shortlist().map((u) => u.id));
  return `<section><div class="toolbar" style="margin-bottom:16px"><div><h2 class="section-title" style="margin:0">Top universities for your budget</h2>
    <p class="muted">${plan.stats.within_budget} of ${plan.stats.available} universities fit ${usd(plan.profile.budget)} in the first year.</p></div>
    <a class="btn btn-ghost btn-sm no-print" id="compare-link" href="compare.html">${icon("compare", 18)}<span id="cmp-count">Compare selected (${picked.size})</span></a></div>
    <div class="uni-grid">${plan.universities.map((u) => `
      <article class="card uni-card card-lift ${u.id === selectedId ? "selected" : ""}" data-id="${u.id}">
        <div class="toolbar"><span class="rank">${u.rank}</span>
        ${u.within_budget ? '<span class="tag tag-ok">Within budget</span>' : `<span class="tag tag-warn">Over by ${money(u.over_by)}</span>`}</div>
        <h3>${esc(u.name)}</h3><div class="muted" style="font-size:14px">${esc(u.city)} · ${esc(u.type)} university</div>
        <div><div class="toolbar" style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:6px"><span>Match score</span><span>${u.match_score}%</span></div>
        <div class="meter"><i data-w="${u.match_score}"></i></div></div>
        <ul>${u.programs.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div><span class="big-money">${money(u.costs.first_year)}</span> <span class="muted" style="font-size:14px">first year</span>
        <div class="muted" style="font-size:14px">Tuition ${money(u.costs.tuition)} per year</div></div>
        <div class="toolbar no-print"><button class="btn btn-sm" type="button" data-view="${u.id}">View costs</button>
          <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" data-cmp="${u.id}" ${picked.has(u.id) ? "checked" : ""}> Compare</label>
          <a href="${esc(u.url)}" target="_blank" rel="noopener" aria-label="Official website of ${esc(u.name)}">${icon("external", 18)}</a></div>
      </article>`).join("")}</div></section>`;
}

function costHtml() {
  const u = selected();
  if (!u) return "";
  const c = u.costs;
  const parts = [
    ["tuition", "Tuition and fees", c.tuition], ["accommodation", "Accommodation", c.accommodation],
    ["daily", "Food and transport", c.food + c.transport], ["other", "Insurance and other", c.insurance + c.misc],
    ["travel", "Visa and flights", c.visa + c.flights],
  ];
  return `<h2 style="font-size:22px;margin-bottom:4px">Estimated cost</h2><p class="muted" style="margin-bottom:16px;font-size:14px">${esc(u.name)}, first year</p>
    <div class="stacked-bar" role="img" aria-label="Cost breakdown">${parts.map(([k, , v]) => `<i style="background:${COLORS[k]}" data-w="${(v / c.first_year * 100).toFixed(1)}"></i>`).join("")}</div>
    ${parts.map(([k, label, v]) => `<div class="kv"><span><i class="dot" style="background:${COLORS[k]}"></i>${label}</span><b>${money(v)}</b></div>`).join("")}
    <div class="kv"><b>Total, first year</b><b class="kv-total" id="total-val">${money(c.first_year)}</b></div>
    <p class="muted" style="font-size:13px;margin-top:8px">About ${money(c.monthly_living)} per month for living costs.</p>`;
}

function fundingHtml() {
  const list = plan.scholarships;
  return `<h2 style="font-size:22px;margin-bottom:4px">Scholarships</h2>
    ${list.length ? list.map((s) => `<div class="list-item"><b>${esc(s.name)} <span class="tag ${s.coverage === "full" ? "tag-ok" : ""}">${esc(s.coverage)}</span></b>
      <span class="muted" style="font-size:14px">Up to ${money(s.amount_usd)} per year. ${esc(s.description)}</span>
      ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" style="font-size:14px">Official site</a>` : ""}</div>`).join("")
      : '<p class="muted">No scholarships found for this profile.</p>'}`;
}

function activitiesHtml() {
  const a = plan.activities;
  return `<h2 style="font-size:22px;margin-bottom:4px">Activities</h2>
    ${[...a.field, ...a.country].map((t) => `<div class="list-item">${esc(t)}</div>`).join("")}`;
}

function guideHtml() {
  const g = plan.country_guide;
  return `<section class="stack"><div><h2 class="section-title">Living in ${esc(g.name)}</h2></div>
    <div class="row"><div class="card grow"><h3 style="font-size:20px;margin-bottom:8px">Visa</h3>
      <p>${esc(g.visa.notes)}</p><p class="muted" style="margin-top:8px">Typical fee: ${money(g.visa.fee)}</p></div>
      <div class="card grow"><h3 style="font-size:20px;margin-bottom:8px">Working while studying</h3>
      <p>${esc(g.work.rule)}.</p><p class="muted" style="margin-top:8px">Typical student pay: about ${money(g.work.hourly)} per hour.</p></div>
      <div class="card grow"><h3 style="font-size:20px;margin-bottom:8px">Tests and intakes</h3>
      <p>${esc(g.language_tests)}.</p><p class="muted" style="margin-top:8px">Intakes: ${g.intakes.map(esc).join(", ")}.</p></div></div>
    <div class="row"><div class="card grow"><h3 style="font-size:20px;margin-bottom:8px">Accommodation options</h3><div class="table-wrap"><table>
      <tr><th>Type</th><th>Per month</th><th>Per year</th></tr>
      ${g.accommodation.map((a) => `<tr><td>${ACC_LABEL[a.type]}${a.type === plan.profile.accommodation ? ' <span class="tag">selected</span>' : ""}</td><td>${money(a.monthly)}</td><td>${money(a.annual)}</td></tr>`).join("")}
      </table></div><p class="muted" style="font-size:13px;margin-top:8px">Average city. Big cities cost more.</p></div>
      <div class="card grow"><h3 style="font-size:20px;margin-bottom:8px">Tips</h3>${g.tips.map((t) => `<div class="list-item">${esc(t)}</div>`).join("")}</div></div></section>`;
}

function timelineHtml() {
  return `<section class="card"><div class="toolbar" style="margin-bottom:20px"><h2 style="font-size:24px">Your timeline</h2>
    <div class="group no-print"><div class="field"><label for="intake">Intake month</label><input class="input" id="intake" type="month" style="width:170px"></div>
    <button class="btn btn-ghost btn-sm" id="ics-btn" type="button">${icon("calendar", 18)}Add to calendar</button></div></div>
    <div class="timeline">${plan.timeline.map((s) => `<div><div class="eyebrow">${s.months_before ? s.months_before + " months before" : "Intake month"}</div>
      <h4>${esc(s.title)}</h4><p>${esc(s.detail)}</p></div>`).join("")}</div></section>`;
}

function checklistHtml() {
  const key = "docs:" + plan.profile.country;
  const done = new Set(store.get(key, []));
  return `<section class="card"><h2 style="font-size:24px;margin-bottom:4px">Document checklist</h2>
    <p class="muted" style="margin-bottom:8px" id="doc-progress"></p>
    ${plan.checklist.map((d, i) => `<div class="check"><input type="checkbox" id="doc${i}" data-doc="${esc(d)}" ${done.has(d) ? "checked" : ""}><label for="doc${i}">${esc(d)}</label></div>`).join("")}</section>`;
}

function traceHtml() {
  return `<details class="card no-print"><summary>How the agent decided</summary><ol class="trace">
    ${plan.agent_trace.map((s) => `<li><b>${esc(s.step)}</b>: ${esc(s.detail)} (${s.ms} ms)</li>`).join("")}</ol></details>`;
}

function render(first = true) {
  head.innerHTML = headHtml();
  root.innerHTML = `<div class="stack">${toolbarHtml()}${summaryHtml()}<div id="uni-section">${uniHtml()}</div>
    <div class="row" style="align-items:flex-start"><section class="card" id="cost-section" style="flex:1.3;min-width:300px">${costHtml()}</section>
    <section class="card grow" id="funding">${fundingHtml()}</section><section class="card grow">${activitiesHtml()}</section></div>
    ${guideHtml()}${timelineHtml()}${checklistHtml()}${traceHtml()}</div>`;
  document.title = plan.summary.headline + " | Globepath";
  bind();
  animateBars(root);
  updateDocProgress();
  if (first) { const total = $("#total-val"); const u = selected(); if (total && u) countUp(total, u.costs.first_year, (v) => money(v)); }
}

function updateDocProgress() {
  const all = $$("[data-doc]");
  const n = all.filter((i) => i.checked).length;
  $("#doc-progress").textContent = `${n} of ${all.length} documents ready`;
}

function refreshCost() {
  $("#cost-section").innerHTML = costHtml();
  $$(".uni-card").forEach((card) => card.classList.toggle("selected", card.dataset.id === selectedId));
  animateBars($("#cost-section"));
}

function toggleCompare(id, checkbox) {
  const data = store.get("shortlist", { items: [] });
  if (checkbox.checked) {
    if (data.items.length >= 3) { checkbox.checked = false; toast("You can compare up to 3 universities."); return; }
    const uni = plan.universities.find((u) => u.id === id);
    data.items.push({ ...uni, _degree: plan.profile.degree, _field: plan.profile.field_label });
  } else data.items = data.items.filter((u) => u.id !== id);
  store.set("shortlist", data);
  $("#cmp-count").textContent = `Compare selected (${data.items.length})`;
}

function downloadIcs(intake) {
  const [y, m] = intake.split("-").map(Number);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = plan.timeline.map((step, i) => {
    const d = new Date(Date.UTC(y, m - 1 - step.months_before, 1));
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
    const text = (s) => String(s).replace(/([,;])/g, "\\$1");
    return ["BEGIN:VEVENT", `UID:globepath-${plan.profile.country}-${i}-${ymd}@globepath`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd}`, `SUMMARY:${text(step.title)}`, `DESCRIPTION:${text(step.detail)}`, "END:VEVENT"].join("\r\n");
  });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Globepath//Study Abroad Plan//EN", ...events, "END:VCALENDAR"].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = "study-abroad-timeline.ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bind() {
  const range = $("#budget-range");
  const apply = debounce(() => refresh({ budget: String(range.value) }), 350);
  range.addEventListener("input", () => { $("#budget-val").textContent = usd(range.value); apply(); });
  $$("[data-acc]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.acc !== req.accommodation) refresh({ accommodation: b.dataset.acc }); }));
  $("#cur").addEventListener("change", (e) => { setCurrency(e.target.value); render(false); });
  $("#save-btn").addEventListener("click", () => { const n = savePlan(req, plan); toast(`Plan saved. You have ${n} saved plan${n === 1 ? "" : "s"}.`); });
  $("#print-btn").addEventListener("click", () => window.print());
  $("#share-btn").addEventListener("click", async () => {
    const url = location.origin + location.pathname + "?" + new URLSearchParams(req);
    try { await navigator.clipboard.writeText(url); toast("Link copied."); } catch { prompt("Copy this link:", url); }
  });
  $("#uni-section").addEventListener("click", (e) => {
    const view = e.target.closest("[data-view]");
    if (view) { selectedId = view.dataset.view; refreshCost(); $("#cost-section").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  });
  $("#uni-section").addEventListener("change", (e) => { if (e.target.dataset.cmp) toggleCompare(e.target.dataset.cmp, e.target); });
  $("#ics-btn").addEventListener("click", () => { const v = $("#intake").value; v ? downloadIcs(v) : toast("Choose your intake month first."); });
  $$("[data-doc]").forEach((box) => box.addEventListener("change", () => {
    store.set("docs:" + plan.profile.country, $$("[data-doc]").filter((i) => i.checked).map((i) => i.dataset.doc));
    updateDocProgress();
  }));
}

load();
