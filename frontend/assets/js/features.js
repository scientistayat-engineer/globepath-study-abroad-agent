import { icon } from "./icons.js";

const FEATURES = [
  ["star", "Smart university match", "Ranks universities that fit your budget."],
  ["cap", "Scholarship finder", "Funding options matched to your profile."],
  ["calc", "Cost calculator", "Fees, rent, food, travel and visa in one total."],
  ["compare", "Compare universities", "Put up to 3 options side by side."],
  ["list", "Timeline and checklist", "Deadlines, documents and visa steps."],
  ["coin", "Currency converter", "See every cost in your own currency."],
  ["bookmark", "Saved plans", "Keep and revisit your past plans."],
  ["pdf", "Export to PDF", "Download or share your full plan."],
  ["passport", "Visa and documents guide", "Visa notes and a document checklist for your destination."],
  ["sliders", "Budget what-if slider", "Change your budget and see new options live."],
  ["home", "Accommodation options", "Dorm, shared flat or private rent estimates."],
  ["briefcase", "Part-time work info", "Work rules and typical pay for students."],
  ["calendar", "Deadline calendar", "Download your timeline as a calendar file."],
  ["language", "English and Urdu", "Switch the main pages to Urdu."],
  ["moon", "Dark mode", "Easy on the eyes, day or night."],
  ["share", "Share your plan", "Copy a link for family or an advisor."],
];

document.getElementById("features").innerHTML = FEATURES.map(([ico, title, text]) =>
  `<div class="card card-lift"><div class="icon-box">${icon(ico)}</div><h3>${title}</h3><p>${text}</p></div>`).join("");
