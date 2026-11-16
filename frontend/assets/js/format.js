import { store } from "./store.js";

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "PKR", "INR"];
const FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.52, PKR: 280, INR: 88 };

export const getCurrency = () => store.get("currency", "USD");
export const setCurrency = (code) => store.set("currency", code);

export function money(usd, currency = getCurrency()) {
  const rates = (JSON.parse(sessionStorage.getItem("globepath:meta") || "null") || {}).rates || FALLBACK_RATES;
  const value = usd * (rates[currency] || 1);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export const usd = (value) => "$" + Math.round(value).toLocaleString("en-US");
export const degreeLabel = (key) => ({ bachelor: "Bachelor's", master: "Master's", phd: "PhD" }[key] || key);
export const titleCase = (text) => String(text).replace(/\b\w/g, (c) => c.toUpperCase());
