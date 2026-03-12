"use client";

import { useState, useEffect, useMemo } from "react";
import emailjs from "@emailjs/browser";
import { getStateLeave, FMLA } from "../stateleavedata";
import { getMunicipalLeave, isMunicipalPaySupplement } from "../data/municipalleavedata";

const US_STATES = [
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

const steps = [
  "Basics",
  "Birth & Recovery",
  "Legal & Employer",
  "Employer Leave Details",
  "Short‑term Disability",
  "Coordination",
  "Results",
];

// States with paid leave programs — show Recent Mover flow when due date within 6 months
const PAID_LEAVE_STATES = ["CA", "NY", "NJ", "WA", "MA", "CT", "CO", "OR", "RI"];
const PAYROLL_TAX_CODES: Record<string, string> = {
  CA: "CASDI",
  NY: "NY SDI",
  NJ: "NJ FLI/TDI",
  WA: "WA PFML",
  MA: "MA PFML",
  CO: "CO FAMLI",
  OR: "OR Paid Leave",
  RI: "RI TDI",
  CT: "CT PFML",
};
function getStateDisplayName(stateCode: string): string {
  const found = US_STATES.find((s) => s.code === stateCode);
  return found?.name ?? stateCode;
}

type MoverEligibilityStatus = "ELIGIBLE" | "PARTIAL" | "AT_RISK" | "INELIGIBLE";
type MoverWorkLocation = "in_state" | "remote_out_of_state" | "travel" | "not_employed" | "";
type MoverPayrollUpdated = "yes" | "no" | "not_sure" | "self_employed" | "";
type MoverNotifiedEmployer = "yes" | "not_yet" | "self" | "";

interface MoverEligibilityResult {
  status: MoverEligibilityStatus;
  monthsInState?: number;
  warning?: string;
}

type WeekStream =
  | "FMLA"
  | "State SDI"
  | "State PFL"
  | "Employer leave"
  | "Short‑term disability";

type Coordination = "concurrent" | "sequential" | "unsure" | "";

interface WeekInfo {
  weekNumber: number;
  startDateLabel?: string;
  birthRelativeWeek?: number;
  isPast?: boolean;
  jobProtected: boolean;
  protectedByFmla: boolean;
  protectedByState: boolean;
  payPercent: number;
  streams: WeekStream[];
  note: string;
}

function parseWeeks(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parsePercent(value: string): number {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/** Convert salary amount + frequency to weekly equivalent. Returns null if invalid. */
function getWeeklyFromSalary(amountStr: string, frequency: "weekly" | "biweekly" | "monthly"): number | null {
  const amt = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amt) || amt <= 0) return null;
  if (frequency === "weekly") return amt;
  if (frequency === "biweekly") return (amt * 24) / 52; // 2x per month = 24 pay periods/year
  return (amt * 12) / 52; // monthly
}

function getEstimatedTotalWithCaps(
  timeline: WeekInfo[],
  stateCode: string,
  weeklySalary: number,
  employerPayPercent: number
): number {
  if (!Number.isFinite(weeklySalary) || weeklySalary <= 0) return 0;
  const state = getStateLeave((stateCode || "DEFAULT").toUpperCase());
  const sdiCap = state.sdi?.weeklyCapDollars ?? 0;
  const pflCap = state.pfl?.weeklyCapDollars ?? 0;
  const sdiPct = state.sdi?.payPercent ?? 0.7;
  const pflPct = state.pfl?.payPercent ?? 0.7;
  let total = 0;
  for (const w of timeline) {
    let weekPay = 0;
    if (w.streams.includes("State SDI"))
      weekPay = Math.max(weekPay, Math.min(weeklySalary * sdiPct, sdiCap || Infinity));
    if (w.streams.includes("State PFL"))
      weekPay = Math.max(weekPay, Math.min(weeklySalary * pflPct, pflCap || Infinity));
    if (w.streams.includes("Employer leave"))
      weekPay = Math.max(weekPay, weeklySalary * (employerPayPercent / 100));
    if (w.streams.includes("Short‑term disability"))
      weekPay = Math.max(weekPay, weeklySalary * 0.6);
    total += Math.min(weeklySalary, weekPay);
  }
  return Math.round(total);
}

function getRecoveryWeeks(birthType: "vaginal" | "c-section" | ""): number {
  if (birthType === "vaginal") return 6;
  if (birthType === "c-section") return 8;
  return 6;
}

function formatWeekStart(dueDate: string, weekIndex: number): string | undefined {
  if (!dueDate) return undefined;
  const d = new Date(dueDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + weekIndex * 7);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWeekStartFromDate(baseDate: Date, weekIndex: number): string | undefined {
  if (Number.isNaN(baseDate.getTime())) return undefined;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + weekIndex * 7);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/** True if due date is within 6 months from today. */
function isDueDateWithin6Months(dueDate: string): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return d.getTime() <= sixMonthsFromNow.getTime();
}

/** True if due date is within 8 weeks from today. */
function isDueDateWithin8Weeks(dueDate: string): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eightWeeksFromNow = addWeeks(today, 8);
  return d.getTime() <= eightWeeksFromNow.getTime();
}

/** Approximate months between move date (YYYY-MM) and today. Returns null if invalid. */
function monthsSinceMove(moveDateStr: string): number | null {
  if (!moveDateStr || moveDateStr.length < 7) return null;
  const [y, m] = moveDateStr.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  const moveDate = new Date(y, m - 1, 1);
  const today = new Date();
  const months = (today.getFullYear() - moveDate.getFullYear()) * 12 + (today.getMonth() - moveDate.getMonth());
  return months < 0 ? 0 : months;
}

function calculateMoverEligibility(
  stateCode: string,
  moveDateStr: string,
  workLocation: MoverWorkLocation,
  payrollUpdated: MoverPayrollUpdated,
  dueDate: string,
  _notifiedEmployer?: MoverNotifiedEmployer
): MoverEligibilityResult {
  const months = monthsSinceMove(moveDateStr);
  const stateName = getStateDisplayName(stateCode);
  const taxCode = PAYROLL_TAX_CODES[stateCode] ?? "state taxes";

  if (payrollUpdated === "self_employed") {
    return { status: "AT_RISK", monthsInState: months ?? 0 };
  }
  if (payrollUpdated === "no" || payrollUpdated === "not_sure") {
    return { status: "AT_RISK", monthsInState: months ?? 0 };
  }
  if (months != null && months < 1 && isDueDateWithin8Weeks(dueDate)) {
    return {
      status: "INELIGIBLE",
      monthsInState: months,
      warning: `You moved to ${stateName} less than 1 month ago and your due date is within 8 weeks. State SDI/disability for this pregnancy may not cover you. PFL bonding may still apply after birth if payroll is corrected in time — notify your employer and ask them to switch withholding to ${taxCode} as soon as possible.`,
    };
  }
  if (months != null && months >= 2 && months < 5 && payrollUpdated === "yes") {
    return {
      status: "PARTIAL",
      monthsInState: months,
      warning: `Your benefit amount will be based only on wages earned in ${stateName}. Because you moved recently, this may be lower than your full salary would suggest.`,
    };
  }
  if (months != null && months >= 5 && payrollUpdated === "yes" && workLocation === "in_state") {
    return { status: "ELIGIBLE", monthsInState: months };
  }
  if (months != null && months >= 2 && payrollUpdated === "yes") {
    return {
      status: "PARTIAL",
      monthsInState: months,
      warning: `Your benefit amount will be based only on wages earned in ${stateName}. Because you moved recently, this may be lower than your full salary would suggest.`,
    };
  }
  return { status: "ELIGIBLE", monthsInState: months ?? 0 };
}

interface KeyDatesResult {
  leaveStart: Date | null;
  fmlaExhaustion: Date | null;
  stateProtectionEnd: Date | null;
  pdlStart: Date | null;
  pdlEnd: Date | null;
  cfraBondingStart: Date | null;
  sdiPayBegins: Date | null;
  sdiClaimDeadline: Date | null;
  sdiEnd: Date | null;
  pflClaimStart: Date | null;
  pflEnd: Date | null;
  employerLeaveEnd: Date | null;
  hasSdi: boolean;
  fmlaStartedBeforeBirth: boolean;
  payrollCorrectionDeadline?: Date | null;
}

function getKeyDates(
  dueDate: string,
  birthType: "vaginal" | "c-section" | "",
  stateCode: string,
  employerWeeks: number,
  caPreBirthWeeksNum?: number,
  coordination?: Coordination
): KeyDatesResult {
  const result: KeyDatesResult = {
    leaveStart: null,
    fmlaExhaustion: null,
    stateProtectionEnd: null,
    pdlStart: null,
    pdlEnd: null,
    cfraBondingStart: null,
    sdiPayBegins: null,
    sdiClaimDeadline: null,
    sdiEnd: null,
    pflClaimStart: null,
    pflEnd: null,
    employerLeaveEnd: null,
    hasSdi: false,
    fmlaStartedBeforeBirth: false,
  };
  if (!dueDate) return result;
  const birth = new Date(dueDate + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return result;
  const state = getStateLeave((stateCode || "DEFAULT").toUpperCase());
  const sdiWeeks =
    birthType === "c-section"
      ? state.sdi.weeksDurationCsection
      : state.sdi.weeksDurationVaginal || getRecoveryWeeks(birthType);
  const preBirthStates = ["CA", "NY", "NJ", "RI"];
  const hasPreBirth =
    preBirthStates.includes(stateCode?.toUpperCase() || "") &&
    caPreBirthWeeksNum != null &&
    caPreBirthWeeksNum > 0;

  if (hasPreBirth) {
    result.leaveStart = addWeeks(birth, -caPreBirthWeeksNum!);
    result.fmlaExhaustion = addWeeks(result.leaveStart, 12);
    result.fmlaStartedBeforeBirth = true;
  }

  if (stateCode?.toUpperCase() === "CA" && hasPreBirth) {
    result.pdlStart = result.leaveStart;
    result.sdiEnd = addWeeks(birth, sdiWeeks);
    result.pdlEnd = result.sdiEnd;
    result.cfraBondingStart = addDays(result.pdlEnd!, 1);
    const waitDays = state.sdi?.waitingPeriodDays ?? 7;
    result.sdiPayBegins = addDays(result.leaveStart!, waitDays + 1);
    if (state.sdi.available) {
      result.sdiClaimDeadline = addDays(birth, 49);
      if (state.pfl.available) {
        result.pflClaimStart = addDays(result.sdiEnd!, 1);
        result.pflEnd = addWeeks(result.sdiEnd!, state.pfl.weeksDuration || 0);
      }
    }
    result.stateProtectionEnd = addWeeks(result.cfraBondingStart!, 12);
  } else if (stateCode?.toUpperCase() === "CA") {
    result.leaveStart = birth;
    result.fmlaExhaustion = addWeeks(birth, 12);
    const waitDays = state.sdi?.waitingPeriodDays ?? 7;
    result.sdiPayBegins = addDays(birth, waitDays + 1);
    if (state.sdi.available) {
      result.sdiClaimDeadline = addDays(birth, 49);
      result.sdiEnd = addWeeks(birth, sdiWeeks);
      if (state.pfl.available) {
        result.pflClaimStart = addDays(result.sdiEnd!, 1);
        result.pflEnd = addWeeks(result.sdiEnd!, state.pfl.weeksDuration || 0);
      }
    }
  } else if (!hasPreBirth) {
    result.leaveStart = birth;
    result.fmlaExhaustion = addWeeks(birth, 12);
    result.pdlStart = null;
    result.pdlEnd = null;
    result.cfraBondingStart = null;
  }

  const stateProtectionWeeks =
    12 +
    (state.hasProtectionBeyondFMLA && state.stateProtectionLaws?.[0]
      ? state.stateProtectionLaws[0].weeksBeyondFMLA
      : 0);
  if (!(stateCode?.toUpperCase() === "CA" && hasPreBirth))
    result.stateProtectionEnd = addWeeks(birth, stateProtectionWeeks);
  result.hasSdi = state.sdi.available;

  if (stateCode?.toUpperCase() !== "CA") {
    if (state.sdi.available) {
      result.sdiClaimDeadline = addDays(birth, 49);
      result.sdiEnd = addWeeks(birth, sdiWeeks);
      if (state.pfl.available) {
        result.pflClaimStart = addDays(result.sdiEnd!, 1);
        result.pflEnd = addWeeks(result.sdiEnd!, state.pfl.weeksDuration || 0);
      }
    } else if (state.pfl.available) {
      result.pflClaimStart = birth;
      result.pflEnd = addWeeks(birth, state.pfl.weeksDuration || 0);
    }
  }

  if (employerWeeks > 0) {
    const statePaidWeeks =
      (hasPreBirth ? caPreBirthWeeksNum! : 0) +
      (state.sdi.available ? sdiWeeks : 0) +
      (state.pfl.available ? (state.pfl.weeksDuration || 0) : 0);
    if (coordination === "sequential") {
      result.employerLeaveEnd = addWeeks(
        result.leaveStart || birth,
        statePaidWeeks + employerWeeks
      );
    } else {
      result.employerLeaveEnd = addWeeks(birth, employerWeeks);
    }
  }
  if (result.leaveStart) {
    result.payrollCorrectionDeadline = addDays(result.leaveStart, -30);
  }
  return result;
}

function getSituationBullets(options: {
  stateCode: string;
  stateName: string;
  dueDate: string;
  timeline: WeekInfo[];
  keyDates: KeyDatesResult;
  employerWeeks: number;
  employerPayPercent: number;
  hasFmla: boolean;
  hasStd: boolean;
  coordination: Coordination;
  birthType: "vaginal" | "c-section" | "";
  moverEligibility?: MoverEligibilityResult;
  moverTaxCode?: string;
  weeklySalary?: number;
}): string[] {
  const bullets: string[] = [];
  const state = getStateLeave((options.stateCode || "DEFAULT").toUpperCase());
  const { stateName, timeline, keyDates, employerWeeks, hasFmla } = options;
  const hasStateProtection = state.stateProtection?.available ?? false;
  const hasProtectionBeyondFMLA = state.hasProtectionBeyondFMLA === true;
  const stateLaws = state.stateProtectionLaws ?? [];
  const stateLaw = stateLaws[0];
  const totalWeeks = timeline.length;
  const fullyPaid = timeline.filter((w) => w.payPercent >= 95).length;
  const displayName = state.name !== "No State Paid Leave" ? state.name : "Your state";

  // Recent mover bullet (PARTIAL/ELIGIBLE/INELIGIBLE)
  if (options.moverEligibility && (options.moverEligibility.status === "PARTIAL" || options.moverEligibility.status === "ELIGIBLE") && options.moverEligibility.monthsInState != null) {
    const pct = state.sdi?.payPercent ? Math.round(state.sdi.payPercent * 100) : 70;
    const salaryNote = options.weeklySalary != null && options.weeklySalary > 0
      ? ` — significantly less than ${pct}% of your current pay.`
      : ".";
    bullets.push(
      `Because you moved to ${stateName} ${options.moverEligibility.monthsInState} months ago, your ${state.sdi?.name?.includes("SDI") ? "SDI" : "state"} benefit will be calculated using only your ${stateName} wages. If your highest-earning quarter in ${stateName} was lower than your current salary, your weekly benefit may be significantly less than ${pct}% of your current pay${salaryNote}`
    );
  }
  if (options.moverEligibility?.status === "INELIGIBLE" && options.moverEligibility.warning) {
    bullets.push(options.moverEligibility.warning);
  }

  // State job protection bullet — fully from state data
  if (hasProtectionBeyondFMLA && stateLaw) {
    const threshold =
      stateLaw.employerSizeThreshold === 1
        ? "It applies to all employers regardless of size."
        : `It applies to employers with ${stateLaw.employerSizeThreshold}+ employees.`;
    const weeksPhrase =
      stateLaw.weeksBeyondFMLA > 0
        ? ` for ${12 + stateLaw.weeksBeyondFMLA} weeks total (${stateLaw.weeksBeyondFMLA} weeks beyond FMLA).`
        : ".";
    const body = stateLaw.note
      ? `${state.name}'s ${stateLaw.name}: ${stateLaw.note}`
      : `${state.name}'s ${stateLaw.name} protects your job${weeksPhrase} ${threshold}`;
    bullets.push(body.trim());
  } else {
    bullets.push(
      `⚠️ ${displayName} has no state job protection law beyond FMLA. After your FMLA exhausts at week 12, your job is not legally protected — consider negotiating extended leave with your employer before your leave starts.`
    );
  }

  // State leave program context — from state.hasStatePaidLeave and state.name
  if (state.hasStatePaidLeave) {
    bullets.push(
      `You're in ${state.name}. Your state's leave rules and deadlines will drive many of your key dates.`
    );
  } else {
    bullets.push(
      `${displayName} doesn't offer paid leave — your income during leave depends on employer benefits and any short‑term disability you have.`
    );
  }

  // CA-specific: PDL vs CFRA sequencing and total protected duration
  if ((options.stateCode || "").toUpperCase() === "CA" && state.pdl) {
    bullets.push(
      "As a California birthing parent eligible for both PDL and CFRA, your total job-protected leave can reach up to 7 months — up to 17 weeks of pregnancy disability leave followed by 12 weeks of CFRA bonding leave. This is significantly more than the federal 12-week FMLA baseline."
    );
  }
  if ((options.stateCode || "").toUpperCase() === "CA" && state.sdi.available) {
    bullets.push(
      "There is a 7-day unpaid waiting period before CA SDI begins paying. Most employers with STD plans cover this gap automatically — confirm with your HR team."
    );
  }
  if (keyDates.fmlaStartedBeforeBirth && keyDates.fmlaExhaustion) {
    bullets.push(
      `⚠️ Because your FMLA started before birth, your federal job protection ends at ${formatDateLong(keyDates.fmlaExhaustion)} — earlier than you might expect.`
    );
  }

  if (employerWeeks > 0) {
    const concurrent = options.coordination === "concurrent" || options.coordination === "unsure";
    if (concurrent) {
      bullets.push(`Your ${employerWeeks}-week employer leave runs at the same time as state benefits, so you'll receive up to ${options.employerPayPercent}% of your pay for those weeks where they overlap.`);
    } else {
      bullets.push(`Your ${employerWeeks}-week employer leave runs after state leave ends — so you get an extended period of paid time.`);
    }
  }
  if (hasFmla && !hasStateProtection) {
    const fmlaDate = keyDates.fmlaExhaustion ? formatDateLong(keyDates.fmlaExhaustion) : "week 12";
    bullets.push(`Your biggest risk is the FMLA cliff at week 12 (around ${fmlaDate}) — after that date your federal job protection ends and you're no longer protected unless your employer agrees to more leave.`);
  } else if (hasFmla && hasStateProtection && stateLaw) {
    bullets.push(`After federal FMLA ends at week 12, ${state.name}'s ${stateLaw.name} may still cover you for bonding.`);
  } else if (!hasFmla) {
    bullets.push(`You're not FMLA-eligible, so you don't have federal job protection. Your job security during leave depends on your employer's policy and any state protection.`);
  }
  if (state.sdi.available && state.pfl.available && keyDates.sdiEnd) {
    bullets.push(`You'll need to file a separate PFL claim when your SDI ends (around ${formatDateLong(keyDates.sdiEnd)}) — it won't happen automatically.`);
  } else if (state.pfl.available && keyDates.pflClaimStart) {
    bullets.push(`Your PFL claim can start around ${formatDateLong(keyDates.pflClaimStart)}. File it separately — don't wait.`);
  }
  if (!state.sdi.available) {
    bullets.push(`${displayName} has no disability insurance for medical recovery — your income during the 6–8 week recovery window depends entirely on your employer STD plan and any employer paid leave.`);
  }
  if (totalWeeks > 0 && fullyPaid >= totalWeeks * 0.8) {
    bullets.push(`You have ${fullyPaid} fully paid weeks out of ${totalWeeks} total — most of your leave is well covered.`);
  } else if (totalWeeks > 0 && fullyPaid === 0 && timeline.some((w) => w.payPercent > 0)) {
    bullets.push("Your pay varies week to week; none of your weeks reach 100% replacement. Employer top‑ups or STD can help close the gap.");
  }
  const content = bullets.slice(0, 7);
  content.push("📍 Municipal laws change frequently. If you work in a major city, ask your HR team whether any local ordinances provide additional benefits beyond what's shown here.");
  return content;
}

function buildTimeline(options: {
  stateCode: string;
  city?: string;
  dueDate: string;
  birthType: "vaginal" | "c-section" | "";
  fmlaEligible: "yes" | "no" | "unsure" | "";
  employerLeaveWeeks: string;
  employerLeavePayPercent: string;
  stdCoverage: "yes" | "no" | "unsure" | "";
  coordination: Coordination;
  caPreBirthLeave?: "yes_standard" | "yes_extended" | "no" | "";
  caPreBirthWeeks?: string;
}): WeekInfo[] {
  const {
    stateCode,
    city: cityInput = "",
    dueDate,
    birthType,
    fmlaEligible,
    employerLeaveWeeks,
    employerLeavePayPercent,
    stdCoverage,
    coordination,
    caPreBirthLeave = "",
    caPreBirthWeeks: caPreBirthWeeksStr = "4",
  } = options;

  const code = (stateCode || "DEFAULT").toUpperCase();
  const state = getStateLeave(code);
  const municipal = getMunicipalLeave(cityInput, code);

  const recoveryWeeks =
    birthType === "c-section"
      ? state.sdi.weeksDurationCsection
      : state.sdi.weeksDurationVaginal || getRecoveryWeeks(birthType);
  const employerWeeks = parseWeeks(employerLeaveWeeks);
  const employerPercent = parsePercent(employerLeavePayPercent);
  const hasStd = stdCoverage === "yes";
  const hasFmla = fmlaEligible === "yes";
  const disabilityWeeks = state.sdi.available ? recoveryWeeks : 0;
  const bondingWeeks = state.pfl.available ? state.pfl.weeksDuration || 0 : 0;

  const preBirthWeeks =
    (code === "CA" || code === "NY" || code === "NJ" || code === "RI") &&
    (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended")
      ? Math.min(20, Math.max(1, parseInt(caPreBirthWeeksStr, 10) || 4))
      : 0;

  const totalWeeks = Math.max(
    14,
    preBirthWeeks + disabilityWeeks + bondingWeeks + employerWeeks + 2
  );
  const statePaidWeeks = preBirthWeeks + disabilityWeeks + bondingWeeks;
  const employerConcurrent = coordination === "concurrent" || coordination === "unsure" || coordination === "";
  const employerStartWeek = employerConcurrent ? 1 : statePaidWeeks + 1;
  const employerEndWeek = employerConcurrent ? employerWeeks : statePaidWeeks + employerWeeks;
  const weeks: WeekInfo[] = [];

  const fmlaWeeks = hasFmla ? FMLA.weeksProtected : 0;

  if ((code === "CA" || code === "NY" || code === "NJ" || code === "RI") && preBirthWeeks > 0) {
    const pflStartWeek = preBirthWeeks + disabilityWeeks + 1;
    const pflEndWeek = pflStartWeek + bondingWeeks - 1;
    const birthWeek = preBirthWeeks + 1;
    const leaveStartDate = new Date(dueDate + "T00:00:00");
    leaveStartDate.setDate(leaveStartDate.getDate() - preBirthWeeks * 7);
    const caWaitingPeriodDays = state.sdi?.waitingPeriodDays ?? 7;
    const isCA = code === "CA";
    const isNY = code === "NY";
    const isNJ = code === "NJ";
    const isRI = code === "RI";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalWeeks; i++) {
      const weekNumber = i + 1;
      const streams: WeekStream[] = [];

      if (hasFmla && weekNumber <= 12) streams.push("FMLA");

      if (weekNumber <= preBirthWeeks) {
        streams.push("State SDI");
        if (hasStd) streams.push("Short‑term disability");
      } else if (weekNumber <= preBirthWeeks + disabilityWeeks) {
        streams.push("State SDI");
        if (hasStd) streams.push("Short‑term disability");
      }

      if (weekNumber >= pflStartWeek && weekNumber <= pflEndWeek) {
        streams.push("State PFL");
      }

      if (
        employerWeeks > 0 &&
        weekNumber >= (employerConcurrent ? birthWeek : statePaidWeeks + 1) &&
        weekNumber <= (employerConcurrent ? preBirthWeeks + employerWeeks : statePaidWeeks + employerWeeks)
      ) {
        streams.push("Employer leave");
      }

      let payPercent = 0;
      if (streams.includes("Employer leave"))
        payPercent = Math.max(payPercent, employerPercent);

      const inPreBirth = weekNumber <= preBirthWeeks;
      const isFirstWeekOfLeave = weekNumber === 1;

      if (inPreBirth) {
        if (isCA) {
          if (isFirstWeekOfLeave && caWaitingPeriodDays >= 7) {
            payPercent = 0;
            if (hasStd) payPercent = Math.max(payPercent, 60);
          } else {
            const sdiPct = state.sdi.payPercent
              ? Math.round(state.sdi.payPercent * 100)
              : 0;
            payPercent = Math.max(payPercent, sdiPct);
          }
        } else if (isNY) {
          payPercent = Math.max(payPercent, 50);
          if (hasStd) payPercent = Math.max(payPercent, 60);
        } else if (isNJ) {
          const sdiPct = state.sdi.payPercent
            ? Math.round(state.sdi.payPercent * 100)
            : 85;
          payPercent = Math.max(payPercent, sdiPct);
          if (hasStd) payPercent = Math.max(payPercent, 60);
        } else if (isRI) {
          const sdiPct = state.sdi.payPercent
            ? Math.round(state.sdi.payPercent * 100)
            : 60;
          payPercent = Math.max(payPercent, sdiPct);
          if (hasStd) payPercent = Math.max(payPercent, 60);
        }
      } else {
        if (streams.includes("State SDI")) {
          const sdiPct = state.sdi.payPercent
            ? Math.round(state.sdi.payPercent * 100)
            : 0;
          payPercent = Math.max(payPercent, sdiPct);
        }
        if (streams.includes("State PFL")) {
          const pflPct = state.pfl.payPercent
            ? Math.round(state.pfl.payPercent * 100)
            : 0;
          payPercent = Math.max(payPercent, pflPct);
        }
        if (streams.includes("Short‑term disability"))
          payPercent = Math.max(payPercent, 60);
      }

      if (payPercent > 100) payPercent = 100;

      if (
        municipal &&
        isMunicipalPaySupplement(municipal) &&
        municipal.city === "San Francisco" &&
        municipal.state === "CA" &&
        streams.includes("State PFL")
      ) {
        payPercent = 100;
      }

      const protectedByFmla = hasFmla && weekNumber <= 12;
      const pdlProtected = isCA && weekNumber <= preBirthWeeks + disabilityWeeks;
      const stateBondingProtected =
        (isCA || isNY || isNJ) &&
        weekNumber >= pflStartWeek &&
        weekNumber <= pflStartWeek + 11;
      const jobProtected =
        protectedByFmla || pdlProtected || stateBondingProtected;

      let note = "";
      if (inPreBirth) {
        if (isCA) {
          if (isFirstWeekOfLeave && caWaitingPeriodDays >= 7) {
            note = hasStd
              ? "7-day CA SDI waiting period — STD typically covers this week."
              : "⚠️ 7-day CA SDI waiting period — no state pay this week. Check if your employer covers this gap or if you have PTO to use.";
          } else {
            note =
              "PDL pre-birth phase — SDI active, FMLA clock running.";
          }
        } else if (isNY) {
          note =
            "⚠️ NY DBL pays a maximum of $170/week during this phase — employer STD is critical to supplement this gap.";
        } else if (isNJ) {
          note =
            "NJ TDI covers pre-birth leave at ~85% of wages. FMLA provides job protection if eligible — NJFLA does not apply to your own pregnancy disability.";
        } else if (isRI) {
          note =
            "RI TDI covers pre-birth leave. Note: Rhode Island has no state job protection law beyond FMLA — if not FMLA eligible, there is no job protection during this phase.";
        }
      } else if (weekNumber === birthWeek) {
        note = "Birth and start of post-birth leave.";
        if (state.sdi.available)
          note += ` ${state.sdi.filingNote}`;
      } else if (weekNumber === preBirthWeeks + disabilityWeeks) {
        note =
          "End of state disability period; bonding leave may begin.";
        if (state.pfl.available && state.pfl.filingNote)
          note += ` ${state.pfl.filingNote}`;
      } else if (weekNumber === pflStartWeek && isCA) {
        note =
          "PDL ends → CFRA bonding begins. File PFL claim now.";
      } else if (
        state.pfl.available &&
        weekNumber === pflEndWeek + 1
      ) {
        note = "State paid family leave typically ends around this point.";
      }

      if (
        hasFmla &&
        weekNumber === 13 &&
        !stateBondingProtected
      ) {
        note = note
          ? `${note} ⚠️ Because your FMLA started before birth, your federal job protection has ended — earlier than you might expect.`
          : "⚠️ Because your FMLA started before birth, your federal job protection has ended — earlier than you might expect.";
      }

      note = note.trim();

      const weekStart = new Date(leaveStartDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const birthRelativeWeek =
        weekNumber < birthWeek ? weekNumber - birthWeek : weekNumber - birthWeek + 1;
      const isPast = weekStart < today;

      weeks.push({
        weekNumber,
        startDateLabel: formatWeekStartFromDate(leaveStartDate, i),
        birthRelativeWeek,
        isPast,
        jobProtected,
        protectedByFmla,
        protectedByState: pdlProtected || stateBondingProtected,
        payPercent,
        streams,
        note,
      });
    }
    return weeks;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < totalWeeks; i++) {
    const weekNumber = i + 1;
    const streams: WeekStream[] = [];

    if (weekNumber <= fmlaWeeks) {
      streams.push("FMLA");
    }

    // SDI: starts at birth, runs for recoveryWeeks (if state has SDI)
    if (state.sdi.available && weekNumber <= disabilityWeeks) {
      streams.push("State SDI");
    }

    // PFL: starts immediately after SDI ends, or at birth if no SDI
    if (state.pfl.available) {
      const pflStart = disabilityWeeks > 0 ? disabilityWeeks + 1 : 1;
      const pflEnd = pflStart + bondingWeeks - 1;
      if (weekNumber >= pflStart && weekNumber <= pflEnd) {
        streams.push("State PFL");
      }
    }

    // STD: runs during medical recovery only, concurrently
    if (hasStd && weekNumber <= recoveryWeeks) {
      streams.push("Short‑term disability");
    }

    // Employer leave: concurrent from birth or sequential after state leave
    if (employerWeeks > 0 && weekNumber >= employerStartWeek && weekNumber <= employerEndWeek) {
      streams.push("Employer leave");
    }

    let payPercent = 0;

    if (streams.includes("Employer leave")) {
      payPercent = Math.max(payPercent, employerPercent);
    }

    if (streams.includes("State SDI")) {
      const caWaitingPeriod =
        code === "CA" &&
        (state.sdi?.waitingPeriodDays ?? 7) >= 7 &&
        weekNumber === 1;
      if (!caWaitingPeriod) {
        const sdiPercent = state.sdi.payPercent
          ? Math.round(state.sdi.payPercent * 100)
          : 0;
        payPercent = Math.max(payPercent, sdiPercent);
      }
    }

    if (streams.includes("State PFL")) {
      const pflPercent = state.pfl.payPercent
        ? Math.round(state.pfl.payPercent * 100)
        : 0;
      payPercent = Math.max(payPercent, pflPercent);
    }

    if (streams.includes("Short‑term disability")) {
      payPercent = Math.max(payPercent, 60);
    }

    if (payPercent > 100) payPercent = 100;

    // Municipal pay supplement (e.g. SF PPLO: PFL bonding weeks at 100%)
    if (
      municipal &&
      isMunicipalPaySupplement(municipal) &&
      municipal.city === "San Francisco" &&
      municipal.state === "CA" &&
      streams.includes("State PFL")
    ) {
      payPercent = 100;
    }

    const stateProtectedWeeks =
      state.stateProtection && state.stateProtection.weeksProtected
        ? state.stateProtection.weeksProtected
        : 0;

    const protectedByFmla = hasFmla && weekNumber <= fmlaWeeks;
    const protectedByState =
      state.stateProtection?.available && weekNumber <= stateProtectedWeeks;
    const jobProtected = protectedByFmla || protectedByState;

    let note = "";
    if (weekNumber === 1) {
      const caWaitingPeriod =
        code === "CA" &&
        state.sdi?.available &&
        (state.sdi?.waitingPeriodDays ?? 7) >= 7;
      if (caWaitingPeriod) {
        note = hasStd
          ? "Birth and start of leave. 7-day CA SDI waiting period — STD typically covers this week."
          : "Birth and start of leave. ⚠️ 7-day CA SDI waiting period — no state pay this week. Check if your employer covers this gap or if you have PTO to use.";
        if (state.sdi?.filingNote) note += ` ${state.sdi.filingNote}`;
      } else {
        note = "Birth and start of leave.";
        if (state.sdi.available) {
          note += ` ${state.sdi.filingNote}`;
        } else if (state.pfl.available) {
          note += ` ${state.pfl.filingNote}`;
        }
      }
    } else if (weekNumber === disabilityWeeks + 1 && state.sdi.available) {
      note = "End of state disability period; bonding leave may begin.";
      if (state.pfl.available && state.pfl.filingNote) {
        note += ` ${state.pfl.filingNote}`;
      }
    } else if (
      state.pfl.available &&
      weekNumber === disabilityWeeks + bondingWeeks + 1
    ) {
      note = "State paid family leave typically ends around this point.";
    }

    // FMLA protection exhaustion warning
    if (!jobProtected && (weekNumber === fmlaWeeks + 1 || weekNumber === 13)) {
      if (!state.stateProtection?.available) {
        note = note
          ? `${note} ⚠️ Federal job protection has ended. You are no longer protected.`
          : "⚠️ Federal job protection has ended. You are no longer protected.";
      }
    }

    note = note.trim();

    const birthWeek = 1;
    const birthRelativeWeek =
      weekNumber < birthWeek ? weekNumber - birthWeek : weekNumber - birthWeek + 1;
    const base = new Date(dueDate + "T00:00:00");
    const weekStart = new Date(base);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const isPast = weekStart < today;

    weeks.push({
      weekNumber,
      startDateLabel: formatWeekStart(dueDate, i),
      birthRelativeWeek,
      isPast,
      jobProtected,
      protectedByFmla,
      protectedByState,
      payPercent,
      streams,
      note,
    });
  }

  return weeks;
}

export default function Home() {
  const [step, setStep] = useState(0);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [birthType, setBirthType] = useState<"vaginal" | "c-section" | "">("");
  const [fmlaEligible, setFmlaEligible] = useState<"yes" | "no" | "unsure" | "">("");
  const [employerLeaveOffered, setEmployerLeaveOffered] = useState<"yes" | "no" | "unsure" | "">("");
  const [employerLeaveWeeks, setEmployerLeaveWeeks] = useState("");
  const [employerLeavePayPercent, setEmployerLeavePayPercent] = useState("");
  const [stdCoverage, setStdCoverage] = useState<"yes" | "no" | "unsure" | "">("");
  const [coordination, setCoordination] = useState<Coordination>("");
  const [timeline, setTimeline] = useState<WeekInfo[] | null>(null);
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryFrequency, setSalaryFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const weeklySalaryNum = getWeeklyFromSalary(salaryAmount, salaryFrequency);
  const hasSalaryInput = weeklySalaryNum != null && weeklySalaryNum > 0;
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSendStatus, setEmailSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [caPreBirthLeave, setCaPreBirthLeave] = useState<"yes_standard" | "yes_extended" | "no" | "">("");
  const [caPreBirthWeeks, setCaPreBirthWeeks] = useState("4");

  const [strategy, setStrategy] = useState<"money" | "time">("money");
  const [employerRequiresConcurrent, setEmployerRequiresConcurrent] = useState(false);

  // Recent Mover (step 2, when state has paid leave and due date within 6 months)
  const [recentMover, setRecentMover] = useState<"yes" | "no" | "">("");
  const [moverMoveDate, setMoverMoveDate] = useState("");
  const [moverWorkLocation, setMoverWorkLocation] = useState<MoverWorkLocation>("");
  const [moverPayrollUpdated, setMoverPayrollUpdated] = useState<MoverPayrollUpdated>("");
  const [moverNotifiedEmployer, setMoverNotifiedEmployer] = useState<MoverNotifiedEmployer>("");
  const [moverBannerResolved, setMoverBannerResolved] = useState(false);

  const PRE_BIRTH_STATES = ["CA", "NY", "NJ", "RI"];
  const hasPreBirthOption = PRE_BIRTH_STATES.includes(state);
  const showPreBirthNote = state && !PRE_BIRTH_STATES.includes(state);

  const showRecentMoverQuestion =
    step === 2 &&
    PAID_LEAVE_STATES.includes(state) &&
    (!dueDate || isDueDateWithin6Months(dueDate));
  const moverEligibilityResult: MoverEligibilityResult | null =
    recentMover === "yes" && moverMoveDate && moverWorkLocation && moverPayrollUpdated
      ? calculateMoverEligibility(
          state,
          moverMoveDate,
          moverWorkLocation,
          moverPayrollUpdated,
          dueDate,
          moverNotifiedEmployer
        )
      : null;
  const isMoverAtRisk =
    moverEligibilityResult?.status === "AT_RISK" && !moverBannerResolved;
  const isMoverSelfEmployed = moverPayrollUpdated === "self_employed";

  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const progressPercent = ((step + 1) / steps.length) * 100;

  function handleDownloadPdf() {
    // Simple approach: use browser print-to-PDF
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  function handleStartOver() {
    setStep(0);
    setState("");
    setCity("");
    setDueDate("");
    setBirthType("");
    setFmlaEligible("");
    setEmployerLeaveOffered("");
    setEmployerLeaveWeeks("");
    setEmployerLeavePayPercent("");
    setStdCoverage("");
    setCoordination("");
    setTimeline(null);
    setSalaryAmount("");
    setSalaryFrequency("monthly");
    setSelectedWeek(null);
    setShowFeedbackBox(false);
    setFeedbackText("");
    setFeedbackSent(false);
    setShowEmailModal(false);
    setEmailAddress("");
    setEmailSendStatus("idle");
    setEmailError("");
    setShareMessage("");
    setCaPreBirthLeave("");
    setCaPreBirthWeeks("4");
    setStrategy("money");
    setEmployerRequiresConcurrent(false);
    setRecentMover("");
    setMoverMoveDate("");
    setMoverWorkLocation("");
    setMoverPayrollUpdated("");
    setMoverNotifiedEmployer("");
    setMoverBannerResolved(false);
  }

  function handleShareLink() {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams({
      state,
      dueDate,
      birthType,
      fmlaEligible,
      employerLeaveOffered,
      employerLeaveWeeks,
      employerLeavePayPercent,
      stdCoverage,
      coordination,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard
      .writeText(url)
      .then(() => setShareMessage("Link copied!"))
      .catch(() =>
        setShareMessage(
          "Unable to copy link automatically. You can copy it from the address bar."
        )
      );
  }

  function handleSendEmail() {
    if (!emailAddress.trim()) return;
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      setEmailError("Email is not configured. Add your EmailJS keys to .env.local — see EMAILJS_SETUP.md.");
      setEmailSendStatus("error");
      return;
    }
    setEmailError("");
    setEmailSendStatus("sending");
    const totalWeeks = timeline?.length ?? 0;
    let fullyPaid = 0, partialPaid = 0, unpaid = 0;
    timeline?.forEach((w) => {
      if (w.payPercent >= 95) fullyPaid += 1;
      else if (w.payPercent > 0) partialPaid += 1;
      else unpaid += 1;
    });
    const summary = [
      `Total leave weeks: ${totalWeeks}`,
      `Fully paid weeks: ${fullyPaid}`,
      `Partially paid weeks: ${partialPaid}`,
      `Unpaid weeks: ${unpaid}`,
    ].join("\n");
    const templateParams = {
      to_email: emailAddress.trim(),
      email: emailAddress.trim(),
      summary,
    };
    emailjs.send(serviceId, templateId, templateParams, { publicKey })
      .then(() => {
        setEmailSendStatus("success");
        setEmailAddress("");
      })
      .catch((err) => {
        setEmailSendStatus("error");
        setEmailError(err?.text || "Failed to send. Check your EmailJS setup and try again.");
      });
  }

  function closeEmailModal() {
    setShowEmailModal(false);
    setEmailSendStatus("idle");
    setEmailError("");
  }

  useEffect(() => {
    if (!showEmailModal || emailSendStatus !== "success") return;
    const timer = window.setTimeout(() => closeEmailModal(), 5000);
    return () => window.clearTimeout(timer);
  }, [showEmailModal, emailSendStatus]);

  function handleNext() {
    const noEmployerLeave = employerLeaveOffered === "no";
    const isPenultimateStep = noEmployerLeave ? step === 4 : step === steps.length - 2;

    if (isPenultimateStep) {
      const weeks = buildTimeline({
        stateCode: state || "DEFAULT",
        city: city || "",
        dueDate,
        birthType: birthType || "vaginal",
        fmlaEligible,
        employerLeaveWeeks,
        employerLeavePayPercent,
        stdCoverage,
        coordination,
        caPreBirthLeave: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthLeave : undefined,
        caPreBirthWeeks: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthWeeks : undefined,
      });
      setTimeline(weeks);
      setStep((s) => s + 1);
      return;
    }

    if (step === 2 && noEmployerLeave) {
      setStep(4);
      return;
    }

    if (step === 4 && noEmployerLeave) {
      setStep(6);
      return;
    }

    if (!isLastStep) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    const noEmployerLeave = employerLeaveOffered === "no";
    if (noEmployerLeave) {
      if (step === 4) {
        setStep(2);
        return;
      }
      if (step === 6) {
        setStep(4);
        return;
      }
    }
    if (!isFirstStep) setStep((s) => s - 1);
  }

  function handleSendFeedback() {
    if (feedbackSent) return;
    const bodyLines = [
      "User reported issue with their leave plan:",
      "",
      feedbackText || "(no additional details provided)",
      "",
      `State: ${state || "N/A"}`,
      `Due date: ${dueDate || "N/A"}`,
    ];
    const subject = encodeURIComponent("Leavigation feedback: something looks wrong");
    const body = encodeURIComponent(bodyLines.join("\n"));
    if (typeof window !== "undefined") {
      window.location.href = `mailto:leavigate@gmail.com?subject=${subject}&body=${body}`;
    }
    setFeedbackSent(true);
  }

  const effectiveCoordination: Coordination =
    employerRequiresConcurrent ? "concurrent" : strategy === "money" ? "sequential" : "concurrent";

  const displayTimeline = useMemo(() => {
    if (!timeline || timeline.length === 0) return timeline;
    return buildTimeline({
      stateCode: state || "DEFAULT",
      city: city || "",
      dueDate,
      birthType: birthType || "vaginal",
      fmlaEligible,
      employerLeaveWeeks,
      employerLeavePayPercent,
      stdCoverage,
      coordination: effectiveCoordination,
      caPreBirthLeave: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthLeave : undefined,
      caPreBirthWeeks: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthWeeks : undefined,
    });
  }, [
    timeline,
    strategy,
    employerRequiresConcurrent,
    state,
    city,
    dueDate,
    birthType,
    fmlaEligible,
    employerLeaveWeeks,
    employerLeavePayPercent,
    stdCoverage,
    caPreBirthLeave,
    caPreBirthWeeks,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Leavigation
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Answer a few questions to map out how your medical recovery, state
            benefits, and employer policies stack up week by week.
          </p>
        </header>

        <section className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-400 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>

        <section className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Where are you planning to take leave?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Your state can affect which benefits and protections apply to
                you.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  State
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    value={state}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState(v);
                      if (!["CA", "NY", "NJ", "RI"].includes(v)) {
                        setCaPreBirthLeave("");
                        setCaPreBirthWeeks("4");
                      }
                    }}
                  >
                    <option value="">Select your state</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                {["CA", "IL", "MD", "MN", "NJ", "NY", "OR", "PA", "WA"].includes(state) && (
                  <label className="block text-sm font-medium text-slate-700">
                    City (optional — some cities have additional leave laws)
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, New York City"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      If you work in a major city, there may be additional protections or pay requirements that apply to you.
                    </p>
                  </label>
                )}

                {hasPreBirthOption && (
                  <>
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        Do you plan to start leave before your due date for pregnancy-related reasons (e.g. doctor&apos;s orders, bed rest, complications, personal preference)?
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="caPreBirth"
                            checked={caPreBirthLeave === "yes_standard"}
                            onChange={() => setCaPreBirthLeave("yes_standard")}
                            className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
                          />
                          <span className="text-sm text-slate-700">Yes — 4 weeks before due date or less (standard)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="caPreBirth"
                            checked={caPreBirthLeave === "yes_extended"}
                            onChange={() => setCaPreBirthLeave("yes_extended")}
                            className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
                          />
                          <span className="text-sm text-slate-700">Yes — more than 4 weeks (complications)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="caPreBirth"
                            checked={caPreBirthLeave === "no"}
                            onChange={() => setCaPreBirthLeave("no")}
                            className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
                          />
                          <span className="text-sm text-slate-700">No — I plan to start leave at birth</span>
                        </label>
                      </div>
                    </div>
                    {(caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended") && (
                      <label className="block text-sm font-medium text-slate-700">
                        How many weeks before your due date do you plan to start leave?
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={caPreBirthWeeks}
                          onChange={(e) => setCaPreBirthWeeks(e.target.value)}
                          className="mt-2 w-full max-w-[8rem] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        />
                      </label>
                    )}
                  </>
                )}

                {showPreBirthNote && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Pre-birth leave in your state is unpaid and covered only by FMLA (if eligible) or employer STD. It is not a separate state benefit.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Birth and recovery
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                These details help estimate how long you&apos;ll need for
                physical recovery.
              </p>

              <div className="mt-6 space-y-6">
                <label className="block text-sm font-medium text-slate-700">
                  Due date / birth date
                  <input
                    type="date"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>

                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Birth type
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    We&apos;ll assume 6 weeks for vaginal birth and 8 weeks for
                    C-section recovery.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setBirthType("vaginal")}
                      className={`rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                        birthType === "vaginal"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium">Vaginal birth</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Approx. 6 weeks recovery
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBirthType("c-section")}
                      className={`rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                        birthType === "c-section"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium">C-section</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Approx. 8 weeks recovery
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Legal protections and company policies
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                These questions help us understand what job protections you may
                have while you&apos;re away.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Are you FMLA eligible?
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    FMLA is a federal law that can protect your job during
                    unpaid leave if certain conditions are met.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Not sure" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFmlaEligible(option.value as "yes" | "no" | "unsure")
                        }
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                          fmlaEligible === option.value
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {fmlaEligible === "unsure" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <p className="font-semibold text-slate-800">FMLA eligibility basics</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        <li>You work for an employer with at least 50 employees within 75 miles.</li>
                        <li>You've worked for this employer for at least 12 months (not necessarily in a row).</li>
                        <li>You've worked at least 1,250 hours for this employer in the past 12 months.</li>
                      </ul>
                      <p className="mt-2 text-slate-600">
                        If all three apply to you, you&apos;re likely FMLA eligible.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFmlaEligible("yes")}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Yes, I meet these
                        </button>
                        <button
                          type="button"
                          onClick={() => setFmlaEligible("no")}
                          className="rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-300"
                        >
                          No, I don&apos;t
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Does your employer offer parental leave?
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    This is separate from state benefits or short-term
                    disability.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Not sure" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setEmployerLeaveOffered(
                            option.value as "yes" | "no" | "unsure"
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                          employerLeaveOffered === option.value
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {step === 2 && (console.log('showRecentMoverQuestion:', step, state, dueDate, PAID_LEAVE_STATES.includes(state), isDueDateWithin6Months(dueDate)), null)}
                {showRecentMoverQuestion && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="text-sm font-medium text-slate-700">
                      Have you recently moved to {getStateDisplayName(state)}?
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      We&apos;ll ask a few questions that affect your state benefit eligibility.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRecentMover("yes")}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                          recentMover === "yes"
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecentMover("no");
                          setMoverMoveDate("");
                          setMoverWorkLocation("");
                          setMoverPayrollUpdated("");
                          setMoverNotifiedEmployer("");
                        }}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                          recentMover === "no"
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        No
                      </button>
                    </div>

                    {recentMover === "yes" && (
                      <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
                        <div>
                          <label className="text-sm font-medium text-slate-700">
                            Q1: When did you move to {getStateDisplayName(state)}?
                          </label>
                          <p className="mt-1 text-xs text-slate-500">Month and year only.</p>
                          <input
                            type="month"
                            value={moverMoveDate}
                            onChange={(e) => setMoverMoveDate(e.target.value)}
                            className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>

                        {moverMoveDate && (
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              Q2: Where do you physically perform your work?
                            </div>
                            <div className="mt-3 space-y-2">
                              {[
                                { value: "in_state" as const, label: `In ${getStateDisplayName(state)} / at home in ${getStateDisplayName(state)}` },
                                { value: "remote_out_of_state" as const, label: "Remotely for an out-of-state employer" },
                                { value: "travel" as const, label: "I travel between states" },
                                { value: "not_employed" as const, label: "I'm not currently employed" },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setMoverWorkLocation(opt.value)}
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${
                                    moverWorkLocation === opt.value
                                      ? "border-sky-400 bg-sky-50 text-sky-900"
                                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {moverWorkLocation && (
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              Q3: Has your employer updated your payroll to withhold {getStateDisplayName(state)} state taxes (look for &quot;{PAYROLL_TAX_CODES[state] ?? "state tax"}&quot; on your paystub)?
                            </div>
                            <div className="mt-3 space-y-2">
                              {[
                                { value: "yes" as const, label: "Yes, I can see it on my paystub" },
                                { value: "no" as const, label: "No, they haven't switched yet" },
                                { value: "not_sure" as const, label: "I'm not sure" },
                                { value: "self_employed" as const, label: "I'm self-employed" },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setMoverPayrollUpdated(opt.value);
                                    if (opt.value !== "no" && opt.value !== "not_sure") setMoverNotifiedEmployer("");
                                  }}
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${
                                    moverPayrollUpdated === opt.value
                                      ? "border-sky-400 bg-sky-50 text-sky-900"
                                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            {isMoverSelfEmployed && (
                              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                Self-employed individuals are generally not automatically covered by state paid leave programs. Some states offer voluntary enrollment — in California, you can apply for Disability Insurance Elective Coverage (DIEC) through EDD, but enrollment must happen before you need the benefit. Given your timeline, contact EDD directly to explore your options.
                              </p>
                            )}
                          </div>
                        )}

                        {(moverPayrollUpdated === "no" || moverPayrollUpdated === "not_sure") && moverWorkLocation && (
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              Q4: Have you notified your employer that you&apos;ve relocated to {getStateDisplayName(state)}?
                            </div>
                            <div className="mt-3 space-y-2">
                              {[
                                { value: "yes" as const, label: "Yes, they know" },
                                { value: "not_yet" as const, label: "Not yet" },
                                { value: "self" as const, label: "I work for myself" },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setMoverNotifiedEmployer(opt.value)}
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${
                                    moverNotifiedEmployer === opt.value
                                      ? "border-sky-400 bg-sky-50 text-sky-900"
                                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && employerLeaveOffered !== "no" && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Employer parental leave details
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                If your employer offers paid leave, we&apos;ll use this to
                estimate your income coverage.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  How many weeks of employer parental leave?
                  <input
                    type="number"
                    min={0}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    placeholder="e.g., 6"
                    value={employerLeaveWeeks}
                    onChange={(e) => setEmployerLeaveWeeks(e.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  At what % of your pay?
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      placeholder="e.g., 100"
                      value={employerLeavePayPercent}
                      onChange={(e) => setEmployerLeavePayPercent(e.target.value)}
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </label>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="text-sm font-medium text-slate-700">
                  What&apos;s your income?
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  We use this to estimate your total leave pay and state benefit caps. You can enter any pay frequency.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="0"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {[
                      { value: "weekly" as const, label: "Weekly" },
                      { value: "biweekly" as const, label: "2×/month" },
                      { value: "monthly" as const, label: "Monthly" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSalaryFrequency(opt.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          salaryFrequency === opt.value
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Short-term disability
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Short-term disability can sometimes cover part of your income
                during medical recovery.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Do you have short-term disability coverage?
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    This might be through your employer or a separate plan you
                    purchased.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Not sure" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setStdCoverage(option.value as "yes" | "no" | "unsure")
                        }
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                          stdCoverage === option.value
                            ? "border-sky-400 bg-sky-50 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && employerLeaveOffered !== "no" && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                How does your leave stack?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                We&apos;ll use this to build a week‑by‑week view of how your
                employer leave lines up with state leave.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Does your employer leave run at the same time as state
                    leave, or after?
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Some employers let you stack leaves so they run one after
                    another. Others require that they run at the same time.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setCoordination("concurrent")}
                      className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                        coordination === "concurrent"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      At the same time
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoordination("sequential")}
                      className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                        coordination === "sequential"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      One after another
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoordination("unsure")}
                      className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                        coordination === "unsure"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      I&apos;m not sure
                    </button>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={employerRequiresConcurrent}
                      onChange={(e) => setEmployerRequiresConcurrent(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                    />
                    <span className="text-sm text-slate-700">
                      My employer requires that I use my leave at the same time (I cannot run employer leave after state leave ends)
                    </span>
                  </label>
                </div>

                <div className="rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-900">
                  This is just the first step. Next, we&apos;ll turn your
                  answers into a clear, week‑by‑week leave timeline.
                </div>
              </div>
            </div>
          )}

          {step === 6 && timeline && (
            <div className="flex flex-col gap-6">
              {/* Municipal pay-supplement banner */}
              {(() => {
                const municipal = getMunicipalLeave(city || "", state || "DEFAULT");
                if (!municipal || !isMunicipalPaySupplement(municipal)) return null;
                const desc = municipal.description.trim();
                const withPeriod = desc.endsWith(".") ? desc : `${desc}.`;
                return (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    🏙️ {municipal.city} Bonus: Your city has a local law that {withPeriod} This has been reflected in your timeline.
                  </div>
                );
              })()}

              {/* 1. Your leave at a glance + Key dates & deadlines (top, side by side) */}
              {(() => {
                const activeTimeline = displayTimeline ?? timeline;
                const totalWeeks = activeTimeline.length;
                let fullyPaid = 0, partialPaid = 0, unpaid = 0;
                activeTimeline.forEach((w) => {
                  if (w.payPercent >= 95) fullyPaid += 1;
                  else if (w.payPercent > 0) partialPaid += 1;
                  else unpaid += 1;
                });
                const keyDates = getKeyDates(
                  dueDate,
                  birthType || "vaginal",
                  state || "DEFAULT",
                  parseWeeks(employerLeaveWeeks),
                  ["CA", "NY", "NJ", "RI"].includes(state || "") &&
                    (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended")
                    ? Math.min(20, Math.max(1, parseInt(caPreBirthWeeks, 10) || 4))
                    : undefined,
                  effectiveCoordination
                );
                const stateData = getStateLeave((state || "DEFAULT").toUpperCase());
                const salaryNum = weeklySalaryNum ?? 0;
                const hasSalary = hasSalaryInput;
                const estimatedTotal = hasSalary
                  ? getEstimatedTotalWithCaps(activeTimeline, state || "DEFAULT", salaryNum, parsePercent(employerLeavePayPercent))
                  : 0;
                return (
                  <>
                    {isMoverAtRisk && moverEligibilityResult && (
                      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                        <h3 className="font-semibold">
                          ⚠️ Action Required Before You Can Access {getStateDisplayName(state)} Benefits
                        </h3>
                        <p className="mt-2 text-amber-900">
                          Your employer appears to still be withholding taxes for your previous state. To access {getStateDisplayName(state)} paid leave benefits, you need to: (1) Notify your employer in writing that you have relocated to {getStateDisplayName(state)} and now physically work there. (2) Ask HR or payroll to update your state tax withholding to {getStateDisplayName(state)} immediately — look for {PAYROLL_TAX_CODES[state] ?? "state tax"} on your next paystub to confirm. (3) Your employer can file amended payroll returns retroactively, which may restore some eligibility for wages already earned in {getStateDisplayName(state)}. (4) Even if payroll isn&apos;t corrected before your leave, apply for {getStateDisplayName(state)} benefits anyway and explain your situation — {getStateDisplayName(state)} may still process your claim during the correction period.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMoverBannerResolved(true)}
                          className="mt-3 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    )}
                    {keyDates.fmlaStartedBeforeBirth && keyDates.fmlaExhaustion && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        ⚠️ Your FMLA clock started when your pre-birth leave began — not at birth. Your federal job protection ends on {formatDateLong(keyDates.fmlaExhaustion)}, which may be earlier than you expect.
                      </div>
                    )}
                    {moverEligibilityResult?.status === "PARTIAL" && moverEligibilityResult.warning && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {moverEligibilityResult.warning}
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Your leave at a glance
                      </h3>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Total leave weeks</dt>
                          <dd className="font-semibold text-slate-900">{totalWeeks}</dd>
                        </div>
                        {keyDates.fmlaStartedBeforeBirth &&
                          keyDates.leaveStart &&
                          (() => {
                            const birth = new Date(dueDate + "T00:00:00");
                            const preBirthWeeks = Math.round(
                              (birth.getTime() - keyDates.leaveStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
                            );
                            return preBirthWeeks > 0 ? (
                              <div className="flex justify-between" key="prebirth">
                                <dt className="text-slate-600">Pre-birth leave weeks</dt>
                                <dd className="font-semibold text-slate-900">{preBirthWeeks}</dd>
                              </div>
                            ) : null;
                          })()}
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Fully paid weeks</dt>
                          <dd className="font-semibold text-emerald-700">{fullyPaid}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Partially paid weeks</dt>
                          <dd className="font-semibold text-amber-700">{partialPaid}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Unpaid weeks</dt>
                          <dd className="font-semibold text-rose-700">{unpaid}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        {hasSalary ? (
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Estimated total received
                            </div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                              ${Math.round(estimatedTotal).toLocaleString()}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Based on ${salaryNum.toLocaleString()} per week
                            </p>
                            {moverEligibilityResult && (moverEligibilityResult.status === "PARTIAL" || moverEligibilityResult.status === "ELIGIBLE") && moverEligibilityResult.monthsInState != null && (
                              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                                <span aria-hidden className="mt-0.5 shrink-0 rounded-full bg-slate-100 p-0.5" title="Your state benefit is calculated from wages earned in-state. Because you moved recently, only the last few months of pay in this state count toward your benefit amount.">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-slate-400">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.26 13h-.258a.75.75 0 000 1.5h.979a1.75 1.75 0 001.646-2.23l-.459-2.066a.25.25 0 01.244-.304H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.74 7h.258a.75.75 0 000-1.5H9a.75.75 0 00-.75.75v.002z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <span>Estimated {getStateDisplayName(state)} benefit based on: {moverEligibilityResult.monthsInState} months of in-state wages</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-slate-600">
                              Enter your income in Step 4 (Employer leave details) to see your estimated total payout.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Key dates &amp; deadlines
                      </h3>
                      {dueDate ? (
                        <div className="mt-4 space-y-3 text-sm">
                          {(() => {
                            const primaryLaw = stateData.stateProtectionLaws?.[0];
                            let lawLabel = "State protection ends";
                            if (primaryLaw) {
                              const m = primaryLaw.name.match(/\(([^)]+)\)/);
                              const acronym = m?.[1] || primaryLaw.name;
                              lawLabel = `${acronym} protection ends`;
                            }
                            return (
                              keyDates.stateProtectionEnd && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-600">{lawLabel}</span>
                                  <span className="font-medium text-slate-900">
                                    {formatDateLong(keyDates.stateProtectionEnd)}
                                  </span>
                                </div>
                              )
                            );
                          })()}
                          {/* Chronological: leave start / pre-birth, then PDL, CFRA, FMLA, state protection, then SDI/PFL/employer */}
                          {keyDates.leaveStart && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">
                                {keyDates.fmlaStartedBeforeBirth
                                  ? "Pre-birth leave start date"
                                  : "Leave start date"}
                              </span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.leaveStart)}
                              </span>
                            </div>
                          )}
                          {keyDates.pdlStart && keyDates.fmlaStartedBeforeBirth && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">PDL start date</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.pdlStart)}
                              </span>
                            </div>
                          )}
                          {keyDates.pdlEnd && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">PDL end date</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.pdlEnd)}
                              </span>
                            </div>
                          )}
                          {keyDates.cfraBondingStart && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">CFRA bonding start date</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.cfraBondingStart)}
                              </span>
                            </div>
                          )}
                          {keyDates.fmlaExhaustion && (
                            <div className="flex justify-between gap-2">
                              <span className="flex items-center gap-1 text-slate-600">
                                <span aria-hidden>⚠️</span> FMLA exhaustion
                              </span>
                              <span className="font-medium text-amber-800">
                                {formatDateLong(keyDates.fmlaExhaustion)}
                              </span>
                            </div>
                          )}
                          {keyDates.sdiPayBegins && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">SDI pay begins</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.sdiPayBegins)}
                              </span>
                            </div>
                          )}
                          {keyDates.hasSdi ? (
                            <>
                              {keyDates.sdiClaimDeadline && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-600">SDI claim deadline</span>
                                  <span className="font-medium text-slate-900">
                                    {formatDateLong(keyDates.sdiClaimDeadline)}
                                  </span>
                                </div>
                              )}
                              {keyDates.sdiEnd && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-600">SDI end date</span>
                                  <span className="font-medium text-slate-900">
                                    {formatDateLong(keyDates.sdiEnd)}
                                  </span>
                                </div>
                              )}
                              {keyDates.pflClaimStart && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-600">PFL claim start</span>
                                  <span className="font-medium text-slate-900">
                                    {formatDateLong(keyDates.pflClaimStart)}
                                  </span>
                                </div>
                              )}
                              {keyDates.pflEnd && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-600">PFL end date</span>
                                  <span className="font-medium text-slate-900">
                                    {formatDateLong(keyDates.pflEnd)}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="mt-2 text-xs italic text-slate-600">
                                No state disability in your state — your medical recovery pay depends on your STD plan.
                              </p>
                              {stateData.pfl.available && keyDates.pflClaimStart && (
                                <>
                                  <div className="mt-3 flex justify-between gap-2">
                                    <span className="text-slate-600">PFL claim start</span>
                                    <span className="font-medium text-slate-900">
                                      {formatDateLong(keyDates.pflClaimStart)}
                                    </span>
                                  </div>
                                  {keyDates.pflEnd && (
                                    <div className="flex justify-between gap-2">
                                      <span className="text-slate-600">PFL end date</span>
                                      <span className="font-medium text-slate-900">
                                        {formatDateLong(keyDates.pflEnd)}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {keyDates.employerLeaveEnd && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">Employer leave end</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.employerLeaveEnd)}
                              </span>
                            </div>
                          )}
                          {recentMover === "yes" && keyDates.payrollCorrectionDeadline && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600">Payroll correction deadline</span>
                              <span className="font-medium text-slate-900">
                                {formatDateLong(keyDates.payrollCorrectionDeadline)} — confirm {PAYROLL_TAX_CODES[state] ?? "state tax"} appears on paystub by this date
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-slate-500">
                          Add your due date in the form to see key dates and deadlines.
                        </p>
                      )}
                    </div>
                  </div>
                  </>
                );
              })()}

              {/* 2. Header + action buttons */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Your week‑by‑week leave timeline
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This is a simplified, educational estimate based on your
                    answers and high‑level rules from state and federal
                    programs. It is not legal or financial advice.
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Share Link
                  </button>
                </div>

              {shareMessage && (
                <div className="rounded-xl bg-sky-50 px-4 py-2 text-xs text-sky-900">
                  {shareMessage}
                </div>
              )}

              {state === "MN" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <div className="font-semibold">
                    Note: Minnesota program not yet launched
                  </div>
                  <p className="mt-1">
                    Minnesota&apos;s paid leave program is planned for 2026. This
                    timeline assumes those benefits exist; if you deliver before
                    launch, your actual state benefits may be lower or
                    unavailable. Confirm details with the state and your HR
                    team.
                  </p>
                </div>
              )}

              {state === "MD" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <div className="font-semibold">
                    Note: Maryland program not yet launched
                  </div>
                  <p className="mt-1">
                    Maryland&apos;s paid leave program is scheduled to launch in
                    2026. If you deliver before launch, these benefits may not
                    yet be available. Please confirm current status with the
                    Maryland Department of Labor and your HR team.
                  </p>
                </div>
              )}

              {state === "CT" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  <div className="font-semibold">
                    Your state has no disability insurance
                  </div>
                  <p className="mt-1">
                    Connecticut does not offer state disability insurance for the
                    birthing parent&apos;s medical recovery. Your income during
                    the 6–8 week recovery window depends entirely on employer
                    short‑term disability and/or employer paid leave.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span>Green: paid &amp; job‑protected</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span>Yellow: paid but not protected</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-800">
                  <span className="h-3 w-3 rounded-full bg-orange-400" />
                  <span>Orange: unpaid but protected</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-rose-800">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span>Red: unpaid &amp; not protected</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span>Gray: this leave type is not active</span>
                </div>
              </div>

              {/* Gantt-style timeline */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-700">Leave types over time</div>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full rounded-xl border border-slate-200 bg-white p-3">
                    <div className="grid auto-cols-[minmax(2.5rem,1fr)] grid-flow-col gap-1 text-[10px] text-slate-500">
                      <div className="col-span-1 text-[11px] font-medium text-slate-600">
                        Type
                      </div>
                      {((displayTimeline ?? timeline) as WeekInfo[]).map((w) => (
                        <div
                          key={`head-${w.weekNumber}`}
                          className="flex flex-col items-center justify-center"
                        >
                          {w.birthRelativeWeek !== undefined ? (
                            <>
                              <div className="text-[11px] font-semibold text-slate-700">
                                W{w.birthRelativeWeek > 0 ? w.birthRelativeWeek : w.birthRelativeWeek}
                              </div>
                              {w.startDateLabel && (
                                <div className="mt-0.5 text-[9px] text-slate-400">
                                  {w.startDateLabel}
                                </div>
                              )}
                            </>
                          ) : (
                            <>W{w.weekNumber}</>
                          )}
                        </div>
                      ))}
                    </div>

                    {(["FMLA", "State SDI", "State PFL", "Employer leave", "Short‑term disability"] as WeekStream[]).map(
                      (stream) => (
                        <div
                          key={stream}
                          className="mt-1 grid auto-cols-[minmax(2.5rem,1fr)] grid-flow-col gap-1 text-[10px]"
                        >
                          <div className="pr-2 text-right font-medium text-slate-600">
                            {stream}
                          </div>
                          {((displayTimeline ?? timeline) as WeekInfo[]).map((week) => {
                            const isActive = week.streams.includes(stream);
                            const hasPay = week.payPercent > 0 && isActive;
                            let color =
                              "bg-slate-100 border border-slate-200 text-slate-500";

                            if (isActive) {
                              if (hasPay && week.jobProtected) {
                                color =
                                  "bg-emerald-400/70 border border-emerald-500 text-emerald-950";
                              } else if (hasPay && !week.jobProtected) {
                                color =
                                  "bg-amber-300/80 border border-amber-500 text-amber-950";
                              } else if (!hasPay && week.jobProtected) {
                                color =
                                  "bg-orange-300/80 border border-orange-500 text-orange-950";
                              } else {
                                color =
                                  "bg-rose-300/80 border border-rose-500 text-rose-950";
                              }
                            }

                            return (
                              <button
                                type="button"
                                key={`${stream}-${week.weekNumber}`}
                                onClick={() => setSelectedWeek(week.weekNumber)}
                                className={`flex h-7 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${color} ${
                                  week.birthRelativeWeek === 1
                                    ? "border-l-2 border-slate-400"
                                    : ""
                                } ${week.birthRelativeWeek !== undefined && week.birthRelativeWeek < 0 ? "bg-indigo-50" : ""} ${
                                  week.isPast ? "opacity-60" : ""
                                }`}
                              >
                                {week.birthRelativeWeek ?? week.weekNumber}
                              </button>
                            );
                          })}
                        </div>
                      )
                    )}

                    {/* State Job Protection row: green weeks 1–12 (FMLA), then green/red based on hasProtectionBeyondFMLA */}
                    {(() => {
                      const stateLeave = getStateLeave((state || "DEFAULT").toUpperCase());
                      const extraWeeks = stateLeave.hasProtectionBeyondFMLA && stateLeave.stateProtectionLaws?.[0]
                        ? stateLeave.stateProtectionLaws[0].weeksBeyondFMLA
                        : 0;
                      const primaryLaw = stateLeave.stateProtectionLaws?.[0];
                      const lawHeader = (() => {
                        if (!primaryLaw) return "State job protection";
                        const m = primaryLaw.name.match(/\(([^)]+)\)/);
                        const acronym = m?.[1] || primaryLaw.name;
                        return acronym;
                      })();
                      const stateProtectionEndWeek = 12 + extraWeeks;
                      return (
                        <div className="mt-1 grid auto-cols-[minmax(2.5rem,1fr)] grid-flow-col gap-1 text-[10px]">
                          <div className="pr-2 text-right font-medium text-slate-600">
                            {lawHeader}
                          </div>
                          {((displayTimeline ?? timeline) as WeekInfo[]).map((week) => {
                            const isProtected =
                              week.weekNumber <= 12 ||
                              (stateLeave.hasProtectionBeyondFMLA && week.weekNumber <= stateProtectionEndWeek);
                            const color = isProtected
                              ? "bg-emerald-400/70 border border-emerald-500 text-emerald-950"
                              : "bg-rose-300/80 border border-rose-500 text-rose-950";
                            return (
                              <button
                                type="button"
                                key={`state-protection-${week.weekNumber}`}
                                onClick={() => setSelectedWeek(week.weekNumber)}
                                className={`flex h-7 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${color} ${
                                  week.birthRelativeWeek === 1
                                    ? "border-l-2 border-slate-400"
                                    : ""
                                } ${week.birthRelativeWeek !== undefined && week.birthRelativeWeek < 0 ? "bg-indigo-50" : ""} ${
                                  week.isPast ? "opacity-60" : ""
                                }`}
                              >
                                {week.birthRelativeWeek ?? week.weekNumber}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
              </div>
              </div>
              </div>

              {/* 6. Week-by-week details (collapsible via selection) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium text-slate-700">
                    Week‑by‑week details
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Click any week in the chart to see details here.
                  </div>
                </div>

                {selectedWeek == null && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    No week selected yet. Tap or click a week box in the
                    timeline above to see what&apos;s happening that week.
                  </div>
                )}

                {selectedWeek != null && (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-800 shadow-sm">
                    {(() => {
                      const week =
                        (displayTimeline ?? timeline).find((w) => w.weekNumber === selectedWeek) ||
                        (displayTimeline ?? timeline)?.[0];
                      return (
                        <>
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {(() => {
                                const rel = week.birthRelativeWeek ?? week.weekNumber;
                                if (rel < 0) {
                                  const n = Math.abs(rel);
                                  return `Week ${rel} (${n} week${n === 1 ? "" : "s"} before birth)`;
                                }
                                const n = rel;
                                return `Week ${n} (${n} week${n === 1 ? "" : "s"} after birth)`;
                              })()}
                            </div>
                            {week.startDateLabel && (
                              <div className="text-[11px] text-slate-500">
                                Starting {week.startDateLabel}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <div>
                              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Protection status
                              </div>
                              <div className="mt-1 text-xs">
                                {week.jobProtected ? (
                                  <>
                                    <span className="font-semibold text-emerald-700">
                                      Job‑protected
                                    </span>{" "}
                                    {week.protectedByFmla &&
                                      !week.protectedByState && (
                                        <span className="text-slate-600">
                                          (federal FMLA)
                                        </span>
                                      )}
                                    {week.protectedByState && (
                                      <span className="text-slate-600">
                                        (state protection)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-semibold text-rose-700">
                                    Not clearly job‑protected
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Estimated pay this week
                              </div>
                              <div className="mt-1 text-xs">
                                <span className="font-semibold">
                                  {week.payPercent}% of usual pay
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              Active leave streams
                            </div>
                            <div className="mt-1 text-xs">
                              {week.streams.length === 0 ? (
                                <span className="italic text-slate-500">
                                  No formal leave benefits active this week.
                                </span>
                              ) : (
                                week.streams.join(", ")
                              )}
                            </div>
                          </div>
                          {week.note && (
                            <div className="mt-3">
                              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                What to know this week
                              </div>
                              <div className="mt-1 text-xs text-slate-700">
                                {week.note}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 7. Your situation summary */}
              {(() => {
                const keyDates = getKeyDates(
                  dueDate,
                  birthType || "vaginal",
                  state || "DEFAULT",
                  parseWeeks(employerLeaveWeeks),
                  ["CA", "NY", "NJ", "RI"].includes(state || "") &&
                    (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended")
                    ? Math.min(20, Math.max(1, parseInt(caPreBirthWeeks, 10) || 4))
                    : undefined,
                  effectiveCoordination
                );
                const stateData = getStateLeave((state || "DEFAULT").toUpperCase());
                const situationBullets = getSituationBullets({
                  stateCode: state || "DEFAULT",
                  stateName: stateData.name,
                  dueDate,
                  timeline: (displayTimeline ?? timeline) ?? [],
                  keyDates,
                  employerWeeks: parseWeeks(employerLeaveWeeks),
                  employerPayPercent: parsePercent(employerLeavePayPercent),
                  hasFmla: fmlaEligible === "yes",
                  hasStd: stdCoverage === "yes",
                  coordination: effectiveCoordination,
                  birthType: birthType || "vaginal",
                  moverEligibility: moverEligibilityResult ?? undefined,
                  moverTaxCode: state ? PAYROLL_TAX_CODES[state] : undefined,
                  weeklySalary: weeklySalaryNum ?? undefined,
                });
                return (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Your situation summary
                    </h3>
                    <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                      {situationBullets.map((bullet, i) => {
                        const isMunicipalNote = i === situationBullets.length - 1 && bullet.startsWith("📍");
                        return (
                          <li
                            key={i}
                            className={`flex gap-2 ${isMunicipalNote ? "text-slate-500" : ""}`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isMunicipalNote ? "bg-slate-100 text-slate-400" : "bg-sky-100 text-sky-600"}`}
                              aria-hidden
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.26 13h-.258a.75.75 0 000 1.5h.979a1.75 1.75 0 001.646-2.23l-.459-2.066a.25.25 0 01.244-.304H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.74 7h.258a.75.75 0 000-1.5H9a.75.75 0 00-.75.75v.002z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span>{bullet}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {state?.toUpperCase() === "CA" &&
                      moverEligibilityResult &&
                      moverEligibilityResult.monthsInState != null &&
                      (moverEligibilityResult.monthsInState >= 3) &&
                      (moverEligibilityResult.monthsInState <= 6) && (
                        <div className="mt-4 flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                          <span className="shrink-0 rounded-full bg-sky-100 p-1" title="Alternative Base Period (ABP)">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-sky-600">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.26 13h-.258a.75.75 0 000 1.5h.979a1.75 1.75 0 001.646-2.23l-.459-2.066a.25.25 0 01.244-.304H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.74 7h.258a.75.75 0 000-1.5H9a.75.75 0 00-.75.75v.002z" clipRule="evenodd" />
                            </svg>
                          </span>
                          <span>
                            If you don&apos;t qualify under the standard base period, California allows an Alternative Base Period (ABP) that includes more recent wages. Apply anyway and EDD will determine which base period gives you the best benefit.
                          </span>
                        </div>
                      )}
                  </div>
                );
              })()}

            </div>
          )}
        </section>

        {step === 6 && (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowFeedbackBox(true);
                setFeedbackSent(false);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
            >
              See something wrong? Let us know.
            </button>
            {showFeedbackBox && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Tell us what looked off in your plan
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    disabled={feedbackSent}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs ${
                      feedbackSent
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                        : "border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    }`}
                    placeholder="Briefly describe what seems inaccurate or missing..."
                  />
                </label>
                {!feedbackSent ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendFeedback}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] font-semibold text-slate-900">
                    Thank you for letting us know there was something wrong. We are in beta and will work to
                    correct this soon.
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleStartOver}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Start Over
            </button>
          </div>
        )}

        <footer className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstStep}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isFirstStep
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Back
          </button>

          {step < 6 && (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Next
              <span aria-hidden="true">→</span>
            </button>
          )}
        </footer>
      </div>

    </main>
  );
}