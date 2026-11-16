import { initLayout } from "./layout.js";
import { store } from "./store.js";
import { $, $$ } from "./utils.js";

initLayout("login.html");
let mode = "login";

async function hash(text) {
  if (!crypto?.subtle) return btoa(text);
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function setMode(next) {
  mode = next;
  $("#auth-title").textContent = mode === "login" ? "Log in" : "Create your account";
  $("#name-field").classList.toggle("hidden", mode === "login");
  $("#auth-submit").textContent = mode === "login" ? "Log in" : "Create account";
  $("#switch-text").innerHTML = mode === "login"
    ? 'New here? <button class="link-btn" type="button" id="switch">Create an account</button>'
    : 'Already have an account? <button class="link-btn" type="button" id="switch">Log in</button>';
  $("#switch").addEventListener("click", () => setMode(mode === "login" ? "register" : "login"));
  $("#form-error").textContent = "";
}

function fail(message, id) {
  $("#form-error").textContent = message;
  $(id)?.focus();
}

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#name").value.trim();
  const email = $("#email").value.trim().toLowerCase();
  const password = $("#password").value;
  if (mode === "register" && !name) return fail("Enter your name.", "#name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email address.", "#email");
  if (password.length < 6) return fail("Password must be at least 6 characters.", "#password");

  const users = store.get("users", []);
  const digest = await hash(email + ":" + password);
  if (mode === "register") {
    if (users.some((u) => u.email === email)) return fail("An account with this email already exists. Log in instead.", "#email");
    users.push({ name, email, digest });
    store.set("users", users);
    store.set("user", { name, email });
  } else {
    const found = users.find((u) => u.email === email && u.digest === digest);
    if (!found) return fail("Email or password is incorrect. If you are new, create an account.", "#password");
    store.set("user", { name: found.name, email });
  }
  location.href = "dashboard.html";
});

$("#guest-btn").addEventListener("click", () => {
  store.set("user", { name: "Guest", email: "" });
  location.href = "dashboard.html";
});

setMode("login");
