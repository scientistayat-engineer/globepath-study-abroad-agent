const PREFIX = "globepath:";

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  },
};

export const planKey = (req) => [req.country, req.degree, req.field, req.accommodation].join("|").toLowerCase();

export function savePlan(req, plan) {
  const plans = store.get("plans", []);
  const key = planKey(req);
  const entry = {
    id: key, savedAt: new Date().toISOString(), request: req,
    headline: plan.summary.headline, within: plan.stats.within_budget,
    best: plan.universities[0]?.name || "", plan,
  };
  const next = [entry, ...plans.filter((p) => p.id !== key)].slice(0, 20);
  store.set("plans", next);
  return next.length;
}

export const planUrl = (req) => "plan.html?" + new URLSearchParams(req).toString();
