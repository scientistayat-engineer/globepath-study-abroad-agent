import { initLayout } from "./layout.js";
import { store, planUrl } from "./store.js";
import { $, esc, toast } from "./utils.js";
import { money } from "./format.js";
import { icon } from "./icons.js";

initLayout("dashboard.html");

const DEFAULT_CHECKLIST = ["Passport and documents", "Language test", "Statement of purpose", "Visa application"];
const user = store.get("user");
$("#greeting").textContent = user ? `Welcome back, ${user.name}` : "My dashboard";

function daysLeft() {
  const value = store.get("deadline");
  if (!value) return "Not set";
  const days = Math.ceil((new Date(value + "T00:00:00") - new Date()) / 86400000);
  return days < 0 ? "Passed" : String(days);
}

function render() {
  const plans = store.get("plans", []);
  const shortlist = store.get("shortlist", { items: [] }).items;
  const checklist = store.get("checklist", DEFAULT_CHECKLIST.map((text) => ({ text, done: false })));
  const done = checklist.filter((c) => c.done).length;

  $("#tiles").innerHTML = [
    ["Saved plans", plans.length], ["Shortlisted", shortlist.length],
    ["Scholarships found", plans[0]?.plan.scholarships.length ?? 0], ["Days to deadline", daysLeft()],
  ].map(([label, value]) => `<div class="card tile"><div class="muted" style="font-size:14px;font-weight:600">${label}</div><div class="num">${esc(value)}</div></div>`).join("");

  $("#plans-list").innerHTML = plans.length ? plans.map((p) => `<div class="plan-row"><div><b>${esc(p.headline)}</b>
    <div class="muted" style="font-size:14px">$${Number(p.request.budget).toLocaleString()} per year · ${p.within} within budget · ${esc(p.best)}</div></div>
    <div style="display:flex;gap:8px"><a class="btn btn-sm" href="${esc(planUrl(p.request))}">Open</a>
    <button class="btn btn-ghost btn-sm" type="button" data-del="${esc(p.id)}" aria-label="Delete plan">${icon("trash", 18)}</button></div></div>`).join("")
    : '<div class="empty"><h3>No saved plans yet</h3><p>Generate a plan and press Save plan.</p><a class="btn" href="index.html">Create a plan</a></div>';

  $("#shortlist-list").innerHTML = shortlist.length
    ? `<div class="table-wrap"><table><tr><th>University</th><th>First year</th><th>Match</th></tr>${shortlist.map((u) =>
      `<tr><td><b>${esc(u.name)}</b></td><td>${money(u.costs.first_year)}</td><td>${u.match_score}%</td></tr>`).join("")}</table></div>
      <a class="btn btn-ghost btn-sm" style="margin-top:14px" href="compare.html">Open full comparison</a>`
    : '<p class="muted">Tick “Compare” on universities in a plan to see them here.</p>';

  $("#checklist").innerHTML = `<div class="meter" style="margin:8px 0 4px"><i style="width:${checklist.length ? done / checklist.length * 100 : 0}%"></i></div>
    <p class="muted" style="font-size:14px">${done} of ${checklist.length} done</p>
    ${checklist.map((c, i) => `<div class="check"><input type="checkbox" id="c${i}" data-i="${i}" ${c.done ? "checked" : ""}><label for="c${i}">${esc(c.text)}</label>
    <button class="btn btn-ghost btn-sm" type="button" data-rm="${i}" aria-label="Remove ${esc(c.text)}">${icon("trash", 16)}</button></div>`).join("")}`;
  $("#deadline").value = store.get("deadline", "");
}

document.addEventListener("change", (e) => {
  if (e.target.dataset.i !== undefined) {
    const list = store.get("checklist", DEFAULT_CHECKLIST.map((text) => ({ text, done: false })));
    list[e.target.dataset.i].done = e.target.checked;
    store.set("checklist", list); render();
  }
  if (e.target.id === "deadline") { store.set("deadline", e.target.value); render(); toast("Deadline saved."); }
});
document.addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  if (del) { store.set("plans", store.get("plans", []).filter((p) => p.id !== del.dataset.del)); render(); toast("Plan deleted."); }
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    const list = store.get("checklist", DEFAULT_CHECKLIST.map((text) => ({ text, done: false })));
    list.splice(Number(rm.dataset.rm), 1); store.set("checklist", list); render();
  }
});
$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#new-item");
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  const list = store.get("checklist", DEFAULT_CHECKLIST.map((t) => ({ text: t, done: false })));
  list.push({ text, done: false }); store.set("checklist", list); input.value = ""; render();
});
render();
