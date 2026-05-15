// ============================================================
// MUNICIPAL LEAVE LAWS, local ordinances beyond state law
// ============================================================
// Used to show city-specific banners and adjust timeline pay
// when user enters a city with type 'pay_supplement'.
// ============================================================

/**
 * @typedef {'pay_supplement' | 'job_protection' | 'sick_leave' | 'none'} MunicipalLeaveType
 */

/**
 * @typedef {Object} MunicipalLeaveEntry
 * @property {string} city
 * @property {string} state
 * @property {string} lawName
 * @property {MunicipalLeaveType} type
 * @property {number} [employerSizeThreshold]
 * @property {string} description
 * @property {string} impactOnTimeline
 * @property {string[]} [aliases] - Optional alternate names for matching (e.g. ["SF"] for San Francisco)
 */

/** @type {MunicipalLeaveEntry[]} */
export const MUNICIPAL_LEAVE_DATA = [
  {
    city: "San Francisco",
    state: "CA",
    lawName: "Paid Parental Leave Ordinance (PPLO)",
    type: "pay_supplement",
    employerSizeThreshold: 20,
    description:
      "requires employers with 20+ employees worldwide to supplement CA PFL during bonding leave so you receive 100% of your normal weekly wages (capped at $2,402/week in 2025). Applies to the 8-week PFL bonding period only, not the SDI disability phase.",
    impactOnTimeline:
      "During PFL bonding weeks, show pay as ~100% instead of ~60-70% for eligible SF employees.",
    aliases: ["SF", "San Fran"],
  },
  {
    city: "New York City",
    state: "NY",
    lawName: "NY PFL applies citywide",
    type: "none",
    description:
      "NYC has no separate parental leave law beyond NY state law. NY PFL applies citywide.",
    impactOnTimeline: "No additional municipal benefit.",
    aliases: ["NYC", "New York"],
  },
  {
    city: "Seattle",
    state: "WA",
    lawName: "Paid Sick and Safe Time",
    type: "sick_leave",
    description:
      "Seattle has a Paid Sick and Safe Time ordinance but no separate parental leave ordinance beyond WA state law.",
    impactOnTimeline: "No additional municipal parental leave benefit.",
  },
  {
    city: "Chicago",
    state: "IL",
    lawName: "Paid Leave and Paid Sick and Safe Leave Ordinance",
    type: "pay_supplement",
    employerSizeThreshold: 50,
    description:
      "provides up to 40 hours of paid leave annually for any reason, including bonding (effective 2024). Applies to employers with 50+ employees. This is a general paid leave bank, not parental-specific, but can be used during parental leave.",
    impactOnTimeline:
      "Can supplement up to 40 hours (1 week) during leave; general leave bank.",
  },
  {
    city: "Portland",
    state: "OR",
    lawName: "Paid sick leave ordinance",
    type: "sick_leave",
    description:
      "Portland has a paid sick leave ordinance but parental leave is covered by OR state law.",
    impactOnTimeline: "No additional municipal parental benefit.",
  },
  {
    city: "Philadelphia",
    state: "PA",
    lawName: "Paid sick leave law",
    type: "sick_leave",
    description:
      "Philadelphia has a paid sick leave law (up to 40 hours) but no separate parental leave ordinance.",
    impactOnTimeline: "No additional municipal parental benefit.",
  },
];

/**
 * Normalize city string for matching (lowercase, trim, collapse spaces).
 * @param {string} str
 * @returns {string}
 */
function normalizeCity(str) {
  if (!str || typeof str !== "string") return "";
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Get municipal leave entry for a city and state, if any.
 * Matches on normalized city name (and optional aliases) and state code.
 * @param {string} city - User-entered city (e.g. "San Francisco", "SF")
 * @param {string} stateCode - Two-letter state code (e.g. "CA")
 * @returns {MunicipalLeaveEntry | null}
 */
export function getMunicipalLeave(city, stateCode) {
  if (!city || !stateCode) return null;
  const normalized = normalizeCity(city);
  const code = (stateCode || "").toUpperCase();
  return (
    MUNICIPAL_LEAVE_DATA.find((entry) => {
      if (entry.state !== code) return false;
      if (normalizeCity(entry.city) === normalized) return true;
      const entryAliases = entry.aliases || [];
      return entryAliases.some((a) => normalizeCity(a) === normalized);
    }) || null
  );
}

/**
 * Returns true if the municipal entry is a pay supplement that should
 * be reflected in the timeline and trigger the city bonus banner.
 * @param {MunicipalLeaveEntry | null} entry
 * @returns {boolean}
 */
export function isMunicipalPaySupplement(entry) {
  return entry != null && entry.type === "pay_supplement";
}
