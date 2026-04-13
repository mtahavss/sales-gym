/**
 * Canonical industry list for prospect filters and create flow (deduplicated, stable order).
 */
export const PROSPECT_INDUSTRY_OPTIONS = [
  { value: "software", label: "Software" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "real-estate", label: "Real Estate" },
  { value: "fitness-wellness", label: "Fitness & Wellness" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "insurance", label: "Insurance" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "energy", label: "Energy" },
  { value: "home-services", label: "Home Services" },
  { value: "travel-hospitality", label: "Travel & Hospitality" },
  { value: "construction", label: "Construction" },
  { value: "media-entertainment", label: "Media & Entertainment" },
  { value: "agriculture", label: "Agriculture" },
  { value: "professional-services", label: "Professional Services" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "government", label: "Government" },
];

export const PROSPECT_INDUSTRY_FILTER_OPTIONS = [
  { value: "all", label: "All industries" },
  ...PROSPECT_INDUSTRY_OPTIONS,
];

export const PROSPECT_INDUSTRY_FORM_OPTIONS = [
  { value: "", label: "Select industry" },
  ...PROSPECT_INDUSTRY_OPTIONS,
];

/** @param {string} filterValue */
export function labelForIndustryValue(filterValue) {
  const o = PROSPECT_INDUSTRY_OPTIONS.find((x) => x.value === filterValue);
  return o?.label ?? "";
}

/**
 * Match stored prospect industry/role against a selected canonical label (and legacy wizard labels).
 * @param {{ industry?: string; role?: string }} p
 * @param {string} selectedLabel
 */
export function prospectMatchesIndustryLabel(p, selectedLabel) {
  const ind = String(p.industry || "").toLowerCase();
  const role = String(p.role || "").toLowerCase();
  const hay = `${ind} ${role}`;
  const L = selectedLabel.toLowerCase();

  if (hay.includes(L)) return true;

  const compact = L.replace(/[^a-z0-9]+/g, "");
  const hayCompact = hay.replace(/[^a-z0-9]+/g, "");
  if (compact.length >= 4 && hayCompact.includes(compact)) return true;

  const legacy = LEGACY_INDUSTRY_MATCHES[selectedLabel];
  if (legacy && legacy.some((frag) => hay.includes(frag))) return true;

  return false;
}

/** Map canonical label -> substrings that appear in older saved prospects */
const LEGACY_INDUSTRY_MATCHES = {
  Software: ["technology", "tech", "saas", "software"],
  Finance: ["financial services", "financial"],
  Healthcare: ["healthcare", "health"],
  "Professional Services": ["professional"],
  Retail: ["retail"],
  Manufacturing: ["manufacturing"],
};
