const PATHS = {
  star: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
  calc: "M5 3h14v18H5zM8 7h8M8 12h2M12 12h2M8 16h2M12 16h2",
  compare: "M4 6h7M4 12h16M13 18h7M4 18h4",
  list: "M9 6h11M9 12h11M9 18h11M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17",
  coin: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  pdf: "M7 3h7l5 5v13H7zM14 3v5h5M10 14h6M10 17h6",
  passport: "M6 3h12v18H6zM12 9a3 3 0 100 6 3 3 0 000-6zM9 18h6",
  sliders: "M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M7 16v4",
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  briefcase: "M3 8h18v12H3zM9 8V5h6v3M3 13h18",
  bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4",
  language: "M3 5h10M8 3v2M5 5c1 4 3 7 6 9M11 5c-1 4-3 7-7 9M14 21l4-10 4 10M15.5 18h5",
  moon: "M20 14A8 8 0 1110 4a7 7 0 0010 10z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z",
  share: "M8 12l8-5M8 12l8 5M6 9a3 3 0 100 6 3 3 0 000-6zM18 4a3 3 0 100 6 3 3 0 000-6zM18 14a3 3 0 100 6 3 3 0 000-6z",
  menu: "M4 6h16M4 12h16M4 18h16",
  check: "M5 12l5 5 9-12",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  save: "M5 3h11l3 3v15H5zM8 3v6h7V3M8 21v-7h8v7",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
};

export function icon(name, size = 22, stroke = 1.8) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[name] || ""}"/></svg>`;
}
