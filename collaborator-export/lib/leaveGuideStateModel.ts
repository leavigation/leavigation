/** Leave guide: state slugs, tiers, and helpers. Program copy lives in leaveGuidePrograms.ts */

export type LeaveGuideTier = 1 | 2 | 3 | 4;

export type ProgramPillKind = "federal" | "jobProtection" | "sdi" | "pfl" | "future";

export interface LeaveGuideState {
  code: string;
  name: string;
  slug: string;
  tier: LeaveGuideTier;
}

const TIER_1_CODES = new Set([
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "HI",
  "ME",
  "MA",
  "MN",
  "NJ",
  "NY",
  "OR",
  "RI",
  "VT",
  "WA",
]);

const TIER_2_CODES = new Set(["MD", "VA"]);

const TIER_3_CODES = new Set([
  "AK",
  "AR",
  "ID",
  "IL",
  "IA",
  "KS",
  "KY",
  "LA",
  "MI",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NM",
  "OH",
  "OK",
  "PA",
  "SD",
  "TN",
  "TX",
  "WI",
]);

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const RAW_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

function tierForCode(code: string): LeaveGuideTier {
  if (TIER_1_CODES.has(code)) return 1;
  if (TIER_2_CODES.has(code)) return 2;
  if (TIER_3_CODES.has(code)) return 3;
  return 4;
}

export const LEAVE_GUIDE_STATES: LeaveGuideState[] = RAW_STATES.map((s) => ({
  ...s,
  slug: nameToSlug(s.name),
  tier: tierForCode(s.code),
})).sort((a, b) => a.name.localeCompare(b.name));

const SLUG_TO_STATE = new Map(LEAVE_GUIDE_STATES.map((s) => [s.slug, s]));

export function getLeaveGuideStateBySlug(slug: string): LeaveGuideState | undefined {
  return SLUG_TO_STATE.get(slug);
}

export const TIER_2_NOTICES: Record<
  string,
  { notice: string; goodNews: string }
> = {
  MD: {
    notice:
      "Maryland Family and Medical Leave Insurance (FAMLI) is coming. Payroll contributions begin January 1, 2027. Benefits will be available starting January 3, 2028. Until that date, there are no state paid leave benefits in Maryland. FMLA provides 12 weeks of unpaid job protection if your employer has 50+ employees.",
    goodNews:
      "The good news: many employers in Maryland offer parental leave and STD coverage that can be combined with FMLA to create a real, paid leave plan. Leavigation can map that out for you. Just enter your due date and employer benefits, and we will show you exactly what your leave can look like week by week.",
  },
  VA: {
    notice:
      "Virginia Paid Family and Medical Leave (PFML) is coming. Payroll contributions begin April 1, 2028. Benefits will be available starting December 1, 2028. Until that date, there are no state paid leave benefits in Virginia. FMLA provides 12 weeks of unpaid job protection if your employer has 50+ employees.",
    goodNews:
      "The good news: many employers in Virginia offer parental leave and STD coverage that can be combined with FMLA to create a real, paid leave plan. Leavigation can map that out for you. Just enter your due date and employer benefits, and we will show you exactly what your leave can look like week by week.",
  },
};
