import { API_BASE } from "./config.js";

async function request(path, options) {
  let response;
  try {
    response = await fetch(API_BASE + "/api" + path, options);
  } catch {
    throw Object.assign(new Error("Cannot reach the server. Make sure the app is running."), { status: 0 });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error || "Request failed."), { status: response.status, details: data.details });
  }
  return data;
}

export const generatePlan = (body) =>
  request("/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const getScholarships = (params) => request("/scholarships?" + new URLSearchParams(params));

let metaCache;
export async function getMeta() {
  if (metaCache) return metaCache;
  const cached = sessionStorage.getItem("globepath:meta");
  if (cached) { metaCache = JSON.parse(cached); return metaCache; }
  metaCache = await request("/meta");
  sessionStorage.setItem("globepath:meta", JSON.stringify(metaCache));
  return metaCache;
}
