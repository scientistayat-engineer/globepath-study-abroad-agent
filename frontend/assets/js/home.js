import { initLayout } from "./layout.js";
import { getMeta } from "./api.js";
import { store, planUrl } from "./store.js";
import { $, esc } from "./utils.js";

initLayout("index.html");

const FALLBACK = [
  ["germany", "Germany", "DE"], ["canada", "Canada", "CA"], ["uk", "United Kingdom", "GB"],
  ["australia", "Australia", "AU"], ["usa", "United States", "US"], ["netherlands", "Netherlands", "NL"],
];
const FALLBACK_FIELDS = ["Computer Science", "Data Science", "Machine Learning", "Mechanical Engineering",
  "Business Administration", "Public Health", "Architecture", "Physics", "Economics"];

const form = $("#plan-form");
const fields = { country: $("#country"), degree: $("#degree"), field: $("#field"), budget: $("#budget") };
let limits = { min: 1000, max: 200000 };

async function setup() {
  let meta = null;
  try { meta = await getMeta(); } catch { /* the form still works with built-in lists */ }
  const countries = meta ? meta.countries.map((c) => [c.key, c.name, c.flag]) : FALLBACK;
  if (meta) limits = meta.budget_limits;

  fields.country.innerHTML = countries.map(([key, name]) => `<option value="${key}">${esc(name)}</option>`).join("");
  $("#field-list").innerHTML = (meta?.field_suggestions || FALLBACK_FIELDS).map((n) => `<option value="${esc(n)}"></option>`).join("");

  $("#dest-grid").innerHTML = countries.map(([key, name, flag]) => `
    <button class="card card-lift dest" type="button" data-country="${key}">
      <span class="flag">${esc(flag)}</span><h3>${esc(name)}</h3>
      <span class="muted">See universities and costs</span></button>`).join("");

  const last = store.get("last-request");
  if (last) {
    fields.country.value = last.country; fields.degree.value = last.degree;
    fields.field.value = last.field; fields.budget.value = last.budget;
  }
  renderRecent();
}

function renderRecent() {
  const plans = store.get("plans", []).slice(0, 3);
  const box = $("#recent");
  if (!plans.length) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  $("#recent-list").innerHTML = plans.map((p) =>
    `<a href="${esc(planUrl(p.request))}">${esc(p.headline)}</a>`).join("");
}

function validate() {
  const errors = {};
  if (!fields.country.value) errors.country = "Choose a country.";
  if (!fields.degree.value) errors.degree = "Choose a degree.";
  if (!fields.field.value.trim()) errors.field = "Enter your field of study, for example Computer Science.";
  const budget = Number(fields.budget.value);
  if (!budget) errors.budget = "Enter your yearly budget in US dollars.";
  else if (budget < limits.min || budget > limits.max) {
    errors.budget = `Budget must be between $${limits.min.toLocaleString()} and $${limits.max.toLocaleString()}.`;
  }
  Object.keys(fields).forEach((key) => {
    $(`#err-${key}`).textContent = errors[key] || "";
    fields[key].setAttribute("aria-invalid", errors[key] ? "true" : "false");
  });
  const first = Object.keys(errors)[0];
  if (first) fields[first].focus();
  return !Object.keys(errors).length;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;
  const request = {
    country: fields.country.value, degree: fields.degree.value,
    field: fields.field.value.trim(), budget: String(Number(fields.budget.value)), accommodation: "shared",
  };
  store.set("last-request", request);
  const button = $("#submit-btn");
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>';
  location.href = planUrl(request);
});

$("#dest-grid").addEventListener("click", (event) => {
  const card = event.target.closest("[data-country]");
  if (!card) return;
  fields.country.value = card.dataset.country;
  $("#hero").scrollIntoView({ behavior: "smooth" });
  fields.field.focus({ preventScroll: true });
});

$("#cta-btn").addEventListener("click", () => {
  $("#hero").scrollIntoView({ behavior: "smooth" });
  fields.country.focus({ preventScroll: true });
});

setup();
