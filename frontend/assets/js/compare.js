import { initLayout } from "./layout.js";
import { store } from "./store.js";
import { $, esc, toast } from "./utils.js";
import { money, degreeLabel, CURRENCIES, getCurrency, setCurrency } from "./format.js";

initLayout("compare.html");
const root = $("#compare-root");

const COUNTRY = { germany: "Germany", canada: "Canada", uk: "United Kingdom", australia: "Australia", usa: "United States", netherlands: "Netherlands" };
const ROWS = [
  ["Location", (u) => `${esc(u.city)}, ${esc(COUNTRY[u.country] || u.country)}`],
  ["Study", (u) => `${esc(degreeLabel(u._degree))} in ${esc(u._field)}`],
  ["Tuition per year", (u) => u.costs.tuition, "low"],
  ["Accommodation", (u) => u.costs.accommodation, "low"],
  ["Food and transport", (u) => u.costs.food + u.costs.transport, "low"],
  ["Insurance and other", (u) => u.costs.insurance + u.costs.misc, "low"],
  ["Visa and flights", (u) => u.costs.visa + u.costs.flights, "low"],
  ["Total, first year", (u) => u.costs.first_year, "low"],
  ["Match score", (u) => u.match_score, "high"],
];

function render() {
  const items = store.get("shortlist", { items: [] }).items;
  if (!items.length) {
    root.innerHTML = `<div class="card empty"><h3>Nothing to compare yet</h3>
      <p>Generate a plan and tick “Compare” on up to 3 universities.</p><a class="btn" href="index.html">Create a plan</a></div>`;
    return;
  }
  const best = (row) => {
    const values = items.map(row[1]);
    return row[2] === "low" ? Math.min(...values) : row[2] === "high" ? Math.max(...values) : null;
  };
  const cell = (row, u, target) => {
    const v = row[1](u);
    if (!row[2]) return `<td>${v}</td>`;
    const isBest = items.length > 1 && v === target && new Set(items.map(row[1])).size > 1;
    const text = row[0] === "Match score" ? v + "%" : money(v);
    return `<td class="${isBest ? "best" : ""}">${text}${isBest ? " ✓" : ""}</td>`;
  };
  root.innerHTML = `<div class="toolbar no-print" style="margin-bottom:16px">
      <p class="muted">The best value in each row is marked ✓.</p>
      <div class="group" style="display:flex;gap:12px;align-items:end"><div class="field"><label for="cur">Currency</label>
      <select class="input" id="cur" style="width:110px">${CURRENCIES.map((c) => `<option ${c === getCurrency() ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <button class="btn btn-ghost btn-sm" id="clear" type="button">Clear all</button></div></div>
    <div class="card table-wrap" style="padding:8px 20px"><table><thead><tr><th></th>
      ${items.map((u) => `<th>${esc(u.name)}<br><button class="btn btn-ghost btn-sm no-print" type="button" data-remove="${u.id}" style="margin-top:8px">Remove</button></th>`).join("")}
      </tr></thead><tbody>${ROWS.map((row) => { const target = best(row); return `<tr><td style="font-weight:600;color:var(--muted)">${row[0]}</td>${items.map((u) => cell(row, u, target)).join("")}</tr>`; }).join("")}
      <tr><td style="font-weight:600;color:var(--muted)">Programs</td>${items.map((u) => `<td>${u.programs.map(esc).join("<br>")}</td>`).join("")}</tr>
      <tr><td style="font-weight:600;color:var(--muted)">Website</td>${items.map((u) => `<td><a href="${esc(u.url)}" target="_blank" rel="noopener">Official site</a></td>`).join("")}</tr>
      </tbody></table></div>`;
  $("#cur").addEventListener("change", (e) => { setCurrency(e.target.value); render(); });
  $("#clear").addEventListener("click", () => { store.set("shortlist", { items: [] }); render(); toast("Comparison cleared."); });
  root.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    store.set("shortlist", { items: items.filter((u) => u.id !== b.dataset.remove) });
    render();
  }));
}

render();
