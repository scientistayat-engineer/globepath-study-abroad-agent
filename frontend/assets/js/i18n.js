import { store } from "./store.js";

const DICT = {
  en: {
    "nav.home": "Home", "nav.scholarships": "Scholarships", "nav.compare": "Compare", "nav.dashboard": "Dashboard", "nav.login": "Log in",
    "hero.eyebrow": "AI study abroad planner",
    "hero.title": "Study abroad, planned around your budget.",
    "hero.lead": "Share your country, degree, field and budget. Our agent shortlists universities, scholarships, activities and a full cost estimate in seconds.",
    "form.title": "Create my plan", "form.country": "Country", "form.degree": "Degree", "form.field": "Field of study",
    "form.budget": "Yearly budget (USD)", "form.submit": "Generate my plan",
    "dest.title": "Where do you want to study?", "feat.title": "Everything you need to plan with confidence",
    "how.title": "Three steps to your plan", "faq.title": "Common questions", "cta.title": "Ready to plan your future?",
  },
  ur: {
    "nav.home": "ہوم", "nav.scholarships": "اسکالرشپس", "nav.compare": "موازنہ", "nav.dashboard": "ڈیش بورڈ", "nav.login": "لاگ اِن",
    "hero.eyebrow": "اے آئی اسٹڈی ابروڈ پلانر",
    "hero.title": "اپنے بجٹ کے مطابق بیرونِ ملک تعلیم کا منصوبہ",
    "hero.lead": "اپنا ملک، ڈگری، شعبہ اور بجٹ بتائیں۔ ہمارا ایجنٹ یونیورسٹیاں، اسکالرشپس، سرگرمیاں اور مکمل لاگت کا تخمینہ تیار کرتا ہے۔",
    "form.title": "میرا منصوبہ بنائیں", "form.country": "ملک", "form.degree": "ڈگری", "form.field": "شعبۂ تعلیم",
    "form.budget": "سالانہ بجٹ (امریکی ڈالر)", "form.submit": "میرا منصوبہ بنائیں",
    "dest.title": "آپ کہاں پڑھنا چاہتے ہیں؟", "feat.title": "منصوبہ بندی کے لیے سب کچھ",
    "how.title": "تین آسان مراحل", "faq.title": "عام سوالات", "cta.title": "اپنے مستقبل کی منصوبہ بندی کے لیے تیار ہیں؟",
  },
};

export const getLang = () => store.get("lang", "en");

export function t(key) {
  return (DICT[getLang()] || DICT.en)[key] ?? DICT.en[key] ?? key;
}

export function applyLang(root = document) {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  root.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
}

export function toggleLang() {
  store.set("lang", getLang() === "en" ? "ur" : "en");
  applyLang();
}
