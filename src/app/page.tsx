"use client";

import { useState, useEffect, useMemo } from "react";
import emailjs from "@emailjs/browser";
import { getStateLeave, FMLA } from "../stateleavedata";
import { getMunicipalLeave, isMunicipalPaySupplement } from "../data/municipalleavedata";

const US_STATES = [{ code: "CA", name: "California" }];

const steps = [
  "Basics",
  "Birth & Recovery",
  "Legal & Employer",
  "Your Income",
  "Employer Leave Details",
  "Short‑term Disability",
  "Coordination",
  "Results",
];

// Set to true to show income/salary input and tax details (step 3) and any results-page estimated total / "Based on $X per week" UI
const SHOW_INCOME_UI = false;

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
  | "SF PPLO"
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
  protectedByCfra: boolean;
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
function getWeeklyFromSalary(amountStr: string, frequency: "weekly" | "biweekly" | "monthly" | "annually"): number | null {
  const amt = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amt) || amt <= 0) return null;
  if (frequency === "weekly") return amt;
  if (frequency === "biweekly") return (amt * 24) / 52; // 2x per month = 24 pay periods/year
  if (frequency === "annually") return amt / 52;
  return (amt * 12) / 52; // monthly
}

/** CA EDD 2026: state average weekly wage and max weekly benefit */
const CA_SAWW_2026 = 1789;
const CA_MAX_WEEKLY_BENEFIT_2026 = 1765;

/** CA SDI/PFL 2026: weekly benefit before cap. If salary ≤ 70% of SAWW → 90%; else 70%. Capped at CA_MAX_WEEKLY_BENEFIT_2026. */
function getCAWeeklyBenefit2026(weeklySalary: number): number {
  if (!Number.isFinite(weeklySalary) || weeklySalary <= 0) return 0;
  const threshold = 0.7 * CA_SAWW_2026;
  const rate = weeklySalary <= threshold ? 0.9 : 0.7;
  return Math.min(weeklySalary * rate, CA_MAX_WEEKLY_BENEFIT_2026);
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
    22,
    preBirthWeeks + disabilityWeeks + bondingWeeks + employerWeeks + 2
  );
  const statePaidWeeks = preBirthWeeks + disabilityWeeks + bondingWeeks;
  const employerConcurrent = coordination === "concurrent" || coordination === "unsure" || coordination === "";
  const employerStartWeek = employerConcurrent ? 1 : statePaidWeeks + 1;
  const employerEndWeek = employerConcurrent ? employerWeeks : statePaidWeeks + employerWeeks;
  const weeks: WeekInfo[] = [];

  const fmlaWeeks = hasFmla ? FMLA.weeksProtected : 0;

  if ((code === "CA" || code === "NY" || code === "NJ" || code === "RI") && preBirthWeeks > 0) {
    const lastSdiWeek = preBirthWeeks + disabilityWeeks;
    const pflStartWeek = lastSdiWeek + 1;
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
      } else if (weekNumber <= lastSdiWeek) {
        streams.push("State SDI");
        if (hasStd) streams.push("Short‑term disability");
      }

      if (weekNumber >= pflStartWeek && weekNumber <= pflEndWeek && !streams.includes("State SDI")) {
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
        protectedByCfra: stateBondingProtected,
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
      streams.push("SF PPLO");
    }

    const stateProtectedWeeks =
      state.stateProtection && state.stateProtection.weeksProtected
        ? state.stateProtection.weeksProtected
        : 0;

    const protectedByFmla = hasFmla && weekNumber <= fmlaWeeks;
    const protectedByState =
      state.stateProtection?.available && weekNumber <= stateProtectedWeeks;
    const protectedByCfra =
      (code === "CA" || code === "NY" || code === "NJ") &&
      state.stateProtection?.available &&
      weekNumber > disabilityWeeks &&
      weekNumber <= disabilityWeeks + 12;
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
      protectedByCfra,
      payPercent,
      streams,
      note,
    });
  }

  return weeks;
}

export function PlanPage() {
  const [step, setStep] = useState(0);

  const [state, setState] = useState("CA");
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
  const [salaryFrequency, setSalaryFrequency] = useState<"weekly" | "biweekly" | "monthly" | "annually">("monthly");
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
  const [taxDetailsOpen, setTaxDetailsOpen] = useState(false);
  const [incomeWeekByWeekOpen, setIncomeWeekByWeekOpen] = useState(false);

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
    console.log("[Print] salaryAmount:", salaryAmount, "salaryFrequency:", salaryFrequency, "weeklySalaryNum:", weeklySalaryNum);
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  function handleStartOver() {
    setStep(0);
    setState("CA");
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
    const isPenultimateStep = noEmployerLeave ? step === 5 : step === steps.length - 2;

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
      // When no employer leave, skip step 6 (Coordination) and go straight to Results (step 7)
      if (noEmployerLeave) {
        setStep(7);
      } else {
        setStep((s) => s + 1);
      }
      return;
    }

    if (step === 3 && noEmployerLeave) {
      setStep(5);
      return;
    }

    if (!isLastStep) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    const noEmployerLeave = employerLeaveOffered === "no";
    if (noEmployerLeave) {
      if (step === 5) {
        setStep(3);
        return;
      }
      if (step === 7) {
        setStep(5);
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

  const coordinationForTimeline: Coordination =
    employerRequiresConcurrent
      ? "concurrent"
      : coordination === "concurrent" || coordination === "sequential"
        ? coordination
        : "concurrent";

  const displayTimeline = useMemo(() => {
    if (!timeline || timeline.length === 0) return timeline;
    const result = buildTimeline({
      stateCode: state || "DEFAULT",
      city: city || "",
      dueDate,
      birthType: birthType || "vaginal",
      fmlaEligible,
      employerLeaveWeeks,
      employerLeavePayPercent,
      stdCoverage,
      coordination: coordinationForTimeline,
      caPreBirthLeave: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthLeave : undefined,
      caPreBirthWeeks: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthWeeks : undefined,
    });
    return result;
  }, [
    timeline,
    coordination,
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

  const activeTimelineForEstimator = (displayTimeline ?? timeline) as WeekInfo[] | null;

  const incomeEstimator = useMemo(() => {
    if (!activeTimelineForEstimator || activeTimelineForEstimator.length === 0) return null;
    const weeklySalary = weeklySalaryNum ?? 0;
    const stateCode = (state || "CA").toUpperCase();
    const isCA = stateCode === "CA";
    const employerPct = parsePercent(employerLeavePayPercent);
    const employerWks = parseWeeks(employerLeaveWeeks);
    const hasStd = stdCoverage === "yes";
    const coordinationForEstimator: "concurrent" | "sequential" =
      employerRequiresConcurrent
        ? "concurrent"
        : coordination === "concurrent" || coordination === "sequential"
          ? coordination
          : "concurrent";
    const isConcurrentLike = coordinationForEstimator === "concurrent";

    const caWeeklyRate = isCA ? getCAWeeklyBenefit2026(weeklySalary) : 0;
    let sdiPaidWeeks = 0;
    let pflPaidWeeks = 0;
    let employerPaidWeeks = 0;
    let stdPaidWeeks = 0;
    let sdiTotal = 0;
    let pflTotal = 0;
    let employerTotal = 0;
    let stdTotal = 0;
    let totalLeaveIncomeCapped = 0;
    const weekRows: { weekNumber: number; dateLabel: string; programs: string[]; grossPay: number; pctOfNormal: number }[] = [];

    for (const w of activeTimelineForEstimator) {
      let weekSdi = 0;
      let weekPfl = 0;
      let weekEmployer = 0;
      let weekStd = 0;
      if (w.streams.includes("State SDI")) {
        const rate = isCA ? (w.weekNumber === 1 ? 0 : getCAWeeklyBenefit2026(weeklySalary)) : (weeklySalary * 0.7);
        weekSdi = isCA ? (w.weekNumber === 1 ? 0 : caWeeklyRate) : Math.min(rate, 1620); // non-CA fallback cap
        sdiPaidWeeks += w.weekNumber === 1 ? 0 : 1;
        sdiTotal += weekSdi;
      }
      if (w.streams.includes("State PFL")) {
        weekPfl = isCA ? caWeeklyRate : Math.min(weeklySalary * 0.7, 1620);
        pflPaidWeeks += 1;
        pflTotal += weekPfl;
      }
      if (w.streams.includes("Employer leave")) {
        weekEmployer = weeklySalary * (employerPct / 100);
        employerPaidWeeks += 1;
        employerTotal += weekEmployer;
      }
      if (w.streams.includes("Short‑term disability")) {
        weekStd = weeklySalary * 0.6;
        stdPaidWeeks += 1;
        stdTotal += weekStd;
      }
      // SF PPLO tops up PFL to 100% of weekly salary
      let weekSfPplo = 0;
      if (w.streams.includes("SF PPLO")) {
        const baseWithoutPplo = Math.min(weekSdi + weekPfl + weekEmployer + weekStd, weeklySalary);
        weekSfPplo = Math.max(0, weeklySalary - baseWithoutPplo);
      }
      const grossPay = Math.min(weekSdi + weekPfl + weekEmployer + weekStd + weekSfPplo, weeklySalary);
      const pctOfNormal = weeklySalary > 0 ? (grossPay / weeklySalary) * 100 : 0;
      const programs: string[] = [];
      if (w.streams.includes("State SDI") && weekSdi > 0) programs.push(isCA ? "CA SDI" : "State SDI");
      if (w.streams.includes("State PFL")) programs.push(isCA ? "CA PFL" : "State PFL");
      if (w.streams.includes("Employer leave")) programs.push("Employer");
      if (w.streams.includes("Short‑term disability")) programs.push("STD");
      if (w.streams.includes("SF PPLO") && weekSfPplo > 0) programs.push("SF PPLO");
      totalLeaveIncomeCapped += grossPay;
      weekRows.push({
        weekNumber: w.weekNumber,
        dateLabel: w.startDateLabel ?? `Week ${w.weekNumber}`,
        programs,
        grossPay,
        pctOfNormal,
      });
    }

    const sdiWeeksForDisplay = activeTimelineForEstimator.filter((w) => w.streams.includes("State SDI")).length;
    const sdiPaidWeeksForDisplay = isCA && sdiWeeksForDisplay > 0 ? sdiWeeksForDisplay - 1 : sdiWeeksForDisplay;
    const sdiWeeklyForDisplay = isCA ? caWeeklyRate : (weeklySalary * 0.7);

    const concurrentBaseWeeks = sdiWeeksForDisplay + pflPaidWeeks;
    const sequentialBaseWeeks = concurrentBaseWeeks + employerWks;
    const leaveDurationWeeks = isConcurrentLike ? concurrentBaseWeeks : sequentialBaseWeeks;

    const totalLeaveIncome = totalLeaveIncomeCapped;
    const totalWeeks = leaveDurationWeeks;
    const normalIncomeSamePeriod = weeklySalary * totalWeeks;
    const shortfall = normalIncomeSamePeriod - totalLeaveIncome;

    return {
      sdiWeeks: sdiWeeksForDisplay,
      sdiPaidWeeks: sdiPaidWeeksForDisplay,
      sdiWeekly: sdiWeeklyForDisplay,
      sdiTotal,
      pflWeeks: pflPaidWeeks,
      pflWeekly: isCA ? caWeeklyRate : Math.min(weeklySalary * 0.7, 1620),
      pflTotal,
      employerWeeks: employerPaidWeeks,
      employerWeekly: weeklySalary * (employerPct / 100),
      employerTotal,
      stdWeeks: stdPaidWeeks,
      stdWeekly: weeklySalary * 0.6,
      stdTotal,
      totalLeaveIncome,
      normalIncomeSamePeriod,
      shortfall,
      weekRows,
      totalWeeks,
    };
  }, [
    activeTimelineForEstimator,
    weeklySalaryNum,
    state,
    employerLeavePayPercent,
    employerLeaveWeeks,
    stdCoverage,
    coordination,
    employerRequiresConcurrent,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="plan-page-container mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 print:max-w-none print:px-2">
        <header className="no-print mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Leavigation
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Answer a few questions to map out how your medical recovery, state
            benefits, and employer policies stack up week by week.
          </p>
        </header>

        <section className="no-print mb-4">
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
                    <option value="CA">California</option>
                  </select>
                </label>

                {state === "CA" && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm">
                    <input
                      type="checkbox"
                      checked={city === "San Francisco"}
                      onChange={(e) =>
                        setCity(e.target.checked ? "San Francisco" : "")
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                    />
                    <span className="text-sm text-slate-700">
                      I work in <span className="font-medium">San Francisco</span>{" "}
                      <span className="text-slate-400">(unlocks SF Paid Parental Leave Ordinance supplement)</span>
                    </span>
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

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                What is your current salary?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Used to estimate your leave income. Optional — skip if you prefer not to share.
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-4">
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
                    { value: "annually" as const, label: "Annually" },
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
          )}

          {step === 4 && employerLeaveOffered !== "no" && (
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
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Short-term disability
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Short-term disability can sometimes cover part of your income
                during medical recovery.
              </p>
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-900 space-y-2">
                <p><span className="font-semibold">What is short-term disability (STD)?</span> STD is private insurance — separate from California SDI — that pays a portion of your salary if you can't work due to a medical condition, including pregnancy and childbirth recovery.</p>
                <p><span className="font-semibold">How is it different from CA SDI?</span> CA SDI is a state program everyone pays into via payroll taxes. STD is an additional employer-provided or privately purchased benefit. Some employers offer both — they often work together to fill income gaps.</p>
                <p><span className="font-semibold">Why it matters:</span> CA SDI has a 7-day unpaid waiting period. If you have STD, it often covers that first unpaid week automatically. STD typically pays 60% of your salary and runs during your medical recovery period (6 weeks for vaginal birth, 8 weeks for C-section).</p>
                <p><span className="font-semibold">Not sure?</span> Check your employee benefits portal, your offer letter benefits summary, or ask your HR team. Search for "short-term disability" or "income protection."</p>
              </div>

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

          {step === 6 && employerLeaveOffered !== "no" && (
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

          {step === 7 && (displayTimeline ?? timeline) && (
            <div className="print-results-full-width flex w-full flex-col gap-6">
              {/* When re-adding "Estimated total received", dollar amount, or "Based on $X per week" on results, wrap in SHOW_INCOME_UI */}
              <div className="print-only border-b border-slate-200 pb-2 mb-4">
                <div className="font-bold text-lg">My Leavigation Leave Plan</div>
                <div className="text-sm text-slate-600">{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</div>
              </div>
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

                <div className="no-print mt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
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
                <div className="no-print rounded-xl bg-sky-50 px-4 py-2 text-xs text-sky-900">
                  {shareMessage}
                </div>
              )}

              <div className="legend-container flex flex-col gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-700">Summary row colors:</span>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 print:bg-emerald-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-emerald-400 bg-emerald-400 print:bg-emerald-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Green: paid &amp; job‑protected</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800 print:bg-amber-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-amber-400 bg-amber-400 print:bg-amber-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Yellow: paid but not protected</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-800 print:bg-orange-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-orange-400 bg-orange-400 print:bg-orange-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Orange: unpaid but protected</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-rose-800 print:bg-rose-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-rose-400 bg-rose-400 print:bg-rose-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Red: unpaid &amp; not protected</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-700">Individual row colors:</span>
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-purple-800 print:bg-purple-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-purple-400 bg-purple-400 print:bg-purple-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Purple: job protected</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 print:bg-emerald-50">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-emerald-400 bg-emerald-400 print:bg-emerald-400" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Green: paid leave active</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700 print:bg-slate-100">
                    <span className="legend-bubble h-3 w-3 rounded-full border-2 border-slate-400 bg-slate-300 print:bg-slate-300" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <span>Gray: not active</span>
                  </div>
                </div>
              </div>

              {/* SDI waiting period note */}
              {state === "CA" && (
                <p className="mt-2 text-xs text-slate-500 px-1">
                  ‡ California SDI has a 7-day unpaid waiting period. The first week of disability leave will appear orange (unpaid but protected) in the summary row. SDI payments begin in week 2.
                </p>
              )}
              {/* Gantt-style timeline */}
              <div className="w-full space-y-3">
                <div className="text-xs font-medium text-slate-700">Leave types over time</div>
                <div className="gantt-container gantt-print-area w-full overflow-x-auto">
                  <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3">
                    {(() => {
                      const fullTimeline = (displayTimeline ?? timeline) as WeekInfo[];
                      const lastActiveWeek = fullTimeline.length === 0 ? 0 : Math.max(0, ...fullTimeline.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                      const activeTimeline = fullTimeline.filter((w) => w.weekNumber <= lastActiveWeek);
                      const birthColIdx = Math.max(
                        0,
                        activeTimeline.findIndex((w) => w.birthRelativeWeek === 1)
                      );
                      const preWeeks = activeTimeline.slice(0, birthColIdx);
                      const postWeeks = activeTimeline.slice(birthColIdx);
                      const showBirthDivider = preWeeks.length > 0;
                      const gridStyle = showBirthDivider
                        ? { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${preWeeks.length}, minmax(2.5rem, 1fr)) minmax(1rem, 1rem) repeat(${postWeeks.length}, minmax(2.5rem, 1fr))` }
                        : { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${activeTimeline.length}, minmax(2.5rem, 1fr))` };
                      return (
                        <>
                    <div className="gantt-header-row gantt-grid grid grid-flow-col gap-1 text-[10px] text-slate-500" style={gridStyle}>
                      <div className="gantt-label-col min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right text-[11px] font-medium text-slate-600 flex items-center overflow-hidden min-h-12">
                        Type
                      </div>
                      {showBirthDivider ? (
                        <>
                          {preWeeks.map((w) => (
                            <div
                              key={`head-pre-${w.weekNumber}`}
                              className="flex min-h-12 flex-col items-center justify-center bg-indigo-50 py-1"
                            >
                              <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                                {w.birthRelativeWeek !== undefined ? `W${w.birthRelativeWeek > 0 ? w.birthRelativeWeek : w.birthRelativeWeek}` : `W${w.weekNumber}`}
                              </div>
                              {w.startDateLabel && (
                                <div className="mt-0.5 text-[9px] text-slate-500 leading-tight">
                                  {w.startDateLabel}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex min-h-12 flex-col items-center justify-start shrink-0 w-4 min-w-4 max-w-4 self-stretch py-1" aria-hidden>
                            <div className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
                              👶 BIRTH
                            </div>
                            <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
                          </div>
                          {postWeeks.map((w) => (
                            <div
                              key={`head-post-${w.weekNumber}`}
                              className="flex min-h-12 flex-col items-center justify-center py-1"
                            >
                              <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                                {w.birthRelativeWeek !== undefined ? `W${w.birthRelativeWeek > 0 ? w.birthRelativeWeek : w.birthRelativeWeek}` : `W${w.weekNumber}`}
                              </div>
                              {w.startDateLabel && (
                                <div className="mt-0.5 text-[9px] text-slate-500 leading-tight">
                                  {w.startDateLabel}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        activeTimeline.map((w) => (
                          <div
                            key={`head-${w.weekNumber}`}
                            className="flex min-h-12 flex-col items-center justify-center py-1"
                          >
                            <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                              {w.birthRelativeWeek !== undefined ? `W${w.birthRelativeWeek > 0 ? w.birthRelativeWeek : w.birthRelativeWeek}` : `W${w.weekNumber}`}
                            </div>
                            {w.startDateLabel && (
                              <div className="mt-0.5 text-[9px] text-slate-500 leading-tight">
                                {w.startDateLabel}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                        </>
                      );
                    })()}

                    {/* Summary row: overall weekly status (uses original green/yellow/orange/red palette) */}
                    {(() => {
                      const fullTimeline = (displayTimeline ?? timeline) as WeekInfo[];
                      const lastActiveWeek = fullTimeline.length === 0 ? 0 : Math.max(0, ...fullTimeline.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                      const activeTimeline = fullTimeline.filter((w) => w.weekNumber <= lastActiveWeek);
                      const birthColIdx = Math.max(
                        0,
                        activeTimeline.findIndex((w) => w.birthRelativeWeek === 1)
                      );
                      const preWeeks = activeTimeline.slice(0, birthColIdx);
                      const postWeeks = activeTimeline.slice(birthColIdx);
                      const showBirthDivider = preWeeks.length > 0;
                      const gridStyle = showBirthDivider
                        ? { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${preWeeks.length}, minmax(2.5rem, 1fr)) minmax(1rem, 1rem) repeat(${postWeeks.length}, minmax(2.5rem, 1fr))` }
                        : { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${activeTimeline.length}, minmax(2.5rem, 1fr))` };
                      const getSummaryColor = (week: WeekInfo) => {
                        const hasPay = week.payPercent > 0;
                        const isProtected = week.jobProtected;
                        if (hasPay && isProtected) {
                          return "bg-emerald-400/70 border border-emerald-500 text-emerald-950";
                        }
                        if (hasPay && !isProtected) {
                          return "bg-amber-300/80 border border-amber-500 text-amber-950";
                        }
                        if (!hasPay && isProtected) {
                          return "bg-orange-300/80 border border-orange-500 text-orange-950";
                        }
                        return "bg-rose-300/80 border border-rose-500 text-rose-950";
                      };
                      return (
                        <div className="mt-2 border-y border-slate-300 py-1 gantt-grid grid grid-flow-col gap-1 text-[10px]" style={gridStyle}>
                          <div className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-semibold text-[11px] text-slate-700 flex items-center overflow-hidden">
                            Summary
                          </div>
                          {showBirthDivider ? (
                            <>
                              {preWeeks.map((week) => (
                                <button
                                  key={`summary-pre-${week.weekNumber}`}
                                  type="button"
                                  onClick={() => setSelectedWeek(week.weekNumber)}
                                  className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryColor(week)} bg-indigo-50 ${week.isPast ? "opacity-60" : ""}`}
                                >
                                  {week.birthRelativeWeek ?? week.weekNumber}
                                </button>
                              ))}
                              <div className="flex flex-col items-center shrink-0 w-4 min-w-4 max-w-4 h-9 self-stretch" aria-hidden>
                                <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
                              </div>
                              {postWeeks.map((week) => (
                                <button
                                  key={`summary-post-${week.weekNumber}`}
                                  type="button"
                                  onClick={() => setSelectedWeek(week.weekNumber)}
                                  className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryColor(week)} ${week.isPast ? "opacity-60" : ""}`}
                                >
                                  {week.birthRelativeWeek ?? week.weekNumber}
                                </button>
                              ))}
                            </>
                          ) : (
                            activeTimeline.map((week) => (
                              <button
                                key={`summary-${week.weekNumber}`}
                                type="button"
                                onClick={() => setSelectedWeek(week.weekNumber)}
                                className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryColor(week)} ${week.isPast ? "opacity-60" : ""}`}
                              >
                                {week.birthRelativeWeek ?? week.weekNumber}
                              </button>
                            ))
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const stateLeave = getStateLeave((state || "DEFAULT").toUpperCase());
                      const fullTimeline = (displayTimeline ?? timeline) as WeekInfo[];
                      const lastActiveWeek = fullTimeline.length === 0 ? 0 : Math.max(0, ...fullTimeline.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                      const activeTimeline = fullTimeline.filter((w) => w.weekNumber <= lastActiveWeek);
                      const birthColIdx = Math.max(0, activeTimeline.findIndex((w) => w.birthRelativeWeek === 1));
                      const preWeeks = activeTimeline.slice(0, birthColIdx);
                      const postWeeks = activeTimeline.slice(birthColIdx);
                      const showBirthDivider = preWeeks.length > 0;
                      const gridStyle = showBirthDivider
                        ? { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${preWeeks.length}, minmax(2.5rem, 1fr)) minmax(1rem, 1rem) repeat(${postWeeks.length}, minmax(2.5rem, 1fr))` }
                        : { gridTemplateColumns: `minmax(8rem, 8rem) repeat(${activeTimeline.length}, minmax(2.5rem, 1fr))` };
                      const recoveryWeeks =
                        birthType === "c-section"
                          ? (stateLeave.sdi?.weeksDurationCsection ?? 8)
                          : (stateLeave.sdi?.weeksDurationVaginal ?? 6);
                      const disabilityWeeks = stateLeave.sdi?.available ? recoveryWeeks : 0;
                      const preBirthWeeks =
                        (state === "CA" &&
                          (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended"))
                          ? Math.min(20, Math.max(1, parseInt(caPreBirthWeeks, 10) || 4))
                          : 0;
                      const pdlEndWeek = preBirthWeeks + disabilityWeeks;
                      const pflStartWeek = pdlEndWeek + 1;
                      const excludedRows: string[] = [];
                      const streamRows: (WeekStream | "PDL" | "CFRA")[] = (() => {
                        const rows: (WeekStream | "PDL" | "CFRA")[] = [];
                        const hasFmlaEligible = fmlaEligible === "yes";
                        const hasEmployer = parseFloat(employerLeaveWeeks) > 0;
                        const hasStdCoverage = stdCoverage === "yes";
                        const isSF = city === "San Francisco";
                        const isCA = state === "CA";

                        if (hasFmlaEligible) {
                          rows.push("FMLA");
                        } else {
                          excludedRows.push("FMLA (not eligible)");
                        }

                        if (isCA) {
                          rows.push("PDL");
                          rows.push("CFRA");
                        } else {
                          rows.push("CFRA");
                        }

                        rows.push("State SDI");
                        rows.push("State PFL");

                        if (isSF) rows.push("SF PPLO" as WeekStream);

                        if (hasEmployer) {
                          rows.push("Employer leave");
                        } else {
                          excludedRows.push("Employer leave (none provided)");
                        }

                        if (hasStdCoverage) {
                          rows.push("Short‑term disability");
                        } else {
                          excludedRows.push("Short-term disability (not selected)");
                        }

                        return rows;
                      })();
                      const primaryLaw = stateLeave.stateProtectionLaws?.[0];
                      const cfraLawHeader = (() => {
                        if (!primaryLaw) return "State job protection";
                        const m = primaryLaw.name.match(/\(([^)]+)\)/);
                        return m?.[1] || primaryLaw.name;
                      })();
                      const renderCfraCell = (week: WeekInfo, isPreBirth: boolean) => {
                        const isProtected = week.protectedByCfra;
                        const color = isProtected
                          ? "bg-purple-400/70 border border-purple-500 text-purple-950"
                          : "bg-slate-100 border border-slate-200 text-slate-600";
                        const preBirthUnprotectedBg =
                          !isProtected && (isPreBirth || (week.birthRelativeWeek !== undefined && week.birthRelativeWeek < 0))
                            ? "bg-indigo-50"
                            : "";
                        return (
                          <button
                            type="button"
                            key={`cfra-${week.weekNumber}`}
                            onClick={() => setSelectedWeek(week.weekNumber)}
                            className={`flex h-7 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${preBirthUnprotectedBg} ${color} ${week.isPast ? "opacity-60" : ""}`}
                          >
                            {week.birthRelativeWeek ?? week.weekNumber}
                          </button>
                        );
                      };
                      const renderStreamCell = (week: WeekInfo, isPreBirth: boolean, stream: WeekStream | "PDL") => {
                        const isPdlRow = stream === "PDL";
                        const isCfraBoundaryWeek = state === "CA" && week.weekNumber === pflStartWeek;
                        const isPdlActive = isPdlRow && week.weekNumber <= pdlEndWeek;
                        const isActive = isPdlRow ? isPdlActive : (stream === "State PFL" ? week.streams.includes("State PFL") && !week.streams.includes("State SDI") : week.streams.includes(stream as WeekStream));
                        const isJobProtectionRow = stream === "FMLA" || stream === "PDL";
                        const isPaidLeaveRow = !isJobProtectionRow;
                        let color = "bg-slate-100 border border-slate-200 text-slate-500";

                        if (isActive) {
                          if (isJobProtectionRow) {
                            color = "bg-purple-400/70 border border-purple-500 text-purple-950";
                          } else {
                            const isSdiFirstWeekWaitingPeriod = stream === "State SDI" && isPreBirth && week.weekNumber === 1;
                            if (isSdiFirstWeekWaitingPeriod) {
                              color = "bg-emerald-50 border border-emerald-300 text-emerald-800";
                            } else {
                              const hasPay = week.payPercent > 0;
                              if (stream === "State SDI" && isActive) {
                                color = "bg-emerald-400/70 border border-emerald-500 text-emerald-950";
                              } else if (hasPay) {
                                color = "bg-emerald-400/70 border border-emerald-500 text-emerald-950";
                              } else {
                                color = "bg-emerald-100/70 border border-emerald-300 text-emerald-900";
                              }
                            }
                          }
                        }

                        const cfraBoundaryClass = isCfraBoundaryWeek ? "border-l-2 border-sky-600" : "";
                        const cfraBoundaryTitle = isCfraBoundaryWeek
                          ? "PDL ends → CFRA bonding begins. File PFL claim now."
                          : undefined;
                        const isSdiWaitingWeek = stream === "State SDI" && isActive && isPreBirth && week.weekNumber === 1;
                        const usePreBirthIndigo = !isJobProtectionRow && !isSdiWaitingWeek;
                        const preBirthInactiveBg = usePreBirthIndigo && isPreBirth && !isActive ? "bg-indigo-50" : "";
                        const preBirthActiveRing = usePreBirthIndigo && isPreBirth && isActive ? "ring-1 ring-inset ring-indigo-200/50" : "";
                        const preBirthRelativeBg = usePreBirthIndigo && week.birthRelativeWeek !== undefined && week.birthRelativeWeek < 0 ? "bg-indigo-50" : "";

                        return (
                          <button
                            type="button"
                            key={`${stream}-${week.weekNumber}`}
                            onClick={() => setSelectedWeek(week.weekNumber)}
                            title={cfraBoundaryTitle ?? (isPdlRow && isPdlActive ? "Job protection only; pay from SDI row" : undefined)}
                            className={`flex h-7 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${color} ${preBirthInactiveBg} ${preBirthActiveRing} ${preBirthRelativeBg} ${cfraBoundaryClass} ${week.isPast ? "opacity-60" : ""}`}
                          >
                            {week.birthRelativeWeek ?? week.weekNumber}
                          </button>
                        );
                      };
                      const CategoryHeader = ({ label, printLabel }: { label: string; printLabel?: string }) => (
                        <div className="mt-2 first:mt-0 gantt-grid grid grid-flow-col gap-1 text-[10px] gantt-category-header" style={gridStyle}>
                          <div className="py-1.5 px-2 bg-slate-200/60 font-bold uppercase text-slate-700 text-[10px] rounded-md" style={{ gridColumn: "1 / -1" }}>
                            {printLabel != null ? (
                              <>
                                <span className="no-print">{label}</span>
                                <span className="print-only">{printLabel}</span>
                              </>
                            ) : (
                              label
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <>
                          {streamRows.flatMap((stream, index) => {
                            const elements: React.ReactNode[] = [];
                            if (index === 0) elements.push(<CategoryHeader key="job-protection" label="JOB PROTECTION" printLabel="JOB PROT." />);
                            if (stream === "State SDI") elements.push(<CategoryHeader key="paid-leave" label="PAID LEAVE" />);
                            if (stream === "CFRA") {
                              elements.push(
                                <div key="CFRA" className="mt-1 gantt-grid grid grid-flow-col gap-1 text-[10px]" style={gridStyle}>
                                  <div className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-medium text-slate-600 flex items-center overflow-hidden">
                                    {cfraLawHeader}
                                  </div>
                                  {showBirthDivider ? (
                                    <>
                                      {preWeeks.map((week) => renderCfraCell(week, true))}
                                      <div className="flex flex-col items-center shrink-0 w-4 min-w-4 max-w-4 h-7 self-stretch" aria-hidden>
                                        <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
                                      </div>
                                      {postWeeks.map((week) => renderCfraCell(week, false))}
                                    </>
                                  ) : (
                                    activeTimeline.map((week) => renderCfraCell(week, false))
                                  )}
                                </div>
                              );
                            } else {
                              elements.push(
                                <div
                                  key={stream}
                                  className="mt-1 gantt-grid grid grid-flow-col gap-1 text-[10px]"
                                  style={gridStyle}
                                >
                                  <div
                                    className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-medium text-slate-600 flex items-center overflow-hidden"
                                    title={
                                      stream === "State SDI"
                                        ? "State disability insurance (e.g. CA SDI). Paid by the state during disability/recovery."
                                        : stream === "Short‑term disability"
                                          ? "Employer or private short‑term disability. Often tops up state SDI or covers the 7‑day waiting period."
                                          : undefined
                                    }
                                  >
                                    {stream}
                                  </div>
                                  {showBirthDivider ? (
                                    <>
                                      {preWeeks.map((week) => renderStreamCell(week, true, stream))}
                                      <div className="flex flex-col items-center shrink-0 w-4 min-w-4 max-w-4 h-7 self-stretch" aria-hidden>
                                        <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
                                      </div>
                                      {postWeeks.map((week) => renderStreamCell(week, false, stream))}
                                    </>
                                  ) : (
                                    activeTimeline.map((week) => renderStreamCell(week, false, stream))
                                  )}
                                </div>
                              );
                            }
                            return elements;
                          })}
                          {city === "San Francisco" && (
                            <p className="mt-2 text-xs text-slate-500 px-1">
                              * SF Paid Parental Leave Ordinance (SF PPLO) tops up CA PFL to 100% of your weekly salary during bonding weeks where CA PFL is your only pay source. Weeks where employer leave or SDI already covers a portion of your pay may receive a partial or no top-up.
                            </p>
                          )}
                          {excludedRows.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400 px-1">
                              † Not shown: {excludedRows.join(", ")}. These rows are hidden because they do not apply to your situation.
                            </p>
                          )}
                        </>
                      );
                    })()}
              </div>
              </div>
              </div>

              {/* Estimated Leave Income card — always render both prompt and breakdown in DOM; show one via visibility for reliable print */}
              <div className="income-estimator-print-section rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Estimated Leave Income</h3>
                  <div className={weeklySalaryNum != null && weeklySalaryNum > 0 ? "hidden" : ""}>
                    <p className="mt-2 text-sm text-slate-600">
                      Add your income in Step 4 to see your estimated leave pay breakdown.
                    </p>
                  </div>
                  <div className={weeklySalaryNum != null && weeklySalaryNum > 0 ? "" : "hidden"}>
                    {incomeEstimator ? (
                    <div className="mt-4 space-y-4">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                          {incomeEstimator.sdiTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">{(state || "CA").toUpperCase() === "CA" ? "CA SDI" : "State SDI"} (pregnancy disability)</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.sdiPaidWeeks} weeks × ${Math.round(incomeEstimator.sdiWeekly)}/week = ${incomeEstimator.sdiTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.pflTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">{(state || "CA").toUpperCase() === "CA" ? "CA PFL" : "State PFL"} (bonding)</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.pflWeeks} weeks × ${Math.round(incomeEstimator.pflWeekly)}/week = ${incomeEstimator.pflTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.employerTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">Employer leave</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.employerWeeks} weeks × ${Math.round(incomeEstimator.employerWeekly)}/week = ${incomeEstimator.employerTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.stdTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">Short‑term disability</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.stdWeeks} weeks × ${Math.round(incomeEstimator.stdWeekly)}/week = ${incomeEstimator.stdTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {incomeEstimator.employerTotal > 0 && (
                        <p className="text-[11px] text-slate-500">Employer leave: paid as regular wages — federal and CA state taxes apply.</p>
                      )}
                      {incomeEstimator.stdTotal > 0 && (
                        <p className="text-[11px] text-slate-500">STD: tax treatment depends on who paid your premiums — check with HR.</p>
                      )}
                      <div className="border-t border-slate-200 pt-3 text-sm">
                        <div className="flex justify-between py-1">
                          <span className="text-slate-700">Total estimated gross leave income</span>
                          <span className="font-semibold text-emerald-700">${incomeEstimator.totalLeaveIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-700">Your normal gross income for same period</span>
                          <span className="font-medium text-slate-900">${incomeEstimator.normalIncomeSamePeriod.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-700">Estimated shortfall</span>
                          <span className={`font-semibold ${incomeEstimator.shortfall > 0 ? "text-rose-600" : "text-slate-700"}`}>
                            ${Math.abs(incomeEstimator.shortfall).toLocaleString("en-US", { maximumFractionDigits: 0 })}{incomeEstimator.shortfall > 0 ? " less" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setIncomeWeekByWeekOpen(!incomeWeekByWeekOpen)}
                          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600"
                          aria-expanded={incomeWeekByWeekOpen}
                        >
                          {incomeWeekByWeekOpen ? "Hide week by week breakdown" : "View the week by week breakdown"}
                        </button>
                        {incomeWeekByWeekOpen && (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full min-w-[400px] text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                  <th className="py-2 text-left font-medium">Week</th>
                                  <th className="py-2 text-left font-medium">Date</th>
                                  <th className="py-2 text-left font-medium">Active programs</th>
                                  <th className="py-2 text-right font-medium">Est. gross pay</th>
                                  <th className="py-2 text-right font-medium">% of normal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {incomeEstimator.weekRows.map((row) => (
                                  <tr
                                    key={row.weekNumber}
                                    className={
                                      row.grossPay === 0
                                        ? "bg-rose-50/50"
                                        : row.pctOfNormal < 50
                                          ? "bg-amber-50/50"
                                          : ""
                                    }
                                  >
                                    <td className="py-1.5 text-slate-700">{row.weekNumber}</td>
                                    <td className="py-1.5 text-slate-700">{row.dateLabel}</td>
                                    <td className="py-1.5 text-slate-600">{row.programs.join(", ") || "—"}</td>
                                    <td className="py-1.5 text-right font-medium text-slate-900">${row.grossPay.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                                    <td className={`py-1.5 text-right font-medium ${row.grossPay === 0 ? "text-rose-600" : row.pctOfNormal < 50 ? "text-amber-700" : "text-slate-700"}`}>
                                      {row.pctOfNormal.toFixed(0)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-700">
                        During your leave you may receive approximately{" "}
                        <span className="font-semibold text-emerald-700">${incomeEstimator.totalLeaveIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        {" "}out of your normal{" "}
                        <span className="font-semibold">${incomeEstimator.normalIncomeSamePeriod.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                        {incomeEstimator.shortfall > 0 && (
                          <> — a shortfall of <span className="font-semibold text-rose-600">${incomeEstimator.shortfall.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span></>
                        )}.
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        SDI and PFL amounts are gross pre-tax estimates. Your employer leave is taxed as regular income. See tax details for more.
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Estimates are based on 2026 CA EDD rates. Actual benefits depend on your base period wages. This is not financial advice.
                      </p>
                    </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-600">Estimated leave income based on your timeline and salary.</p>
                    )}
                  </div>
                </div>

            </div>
          )}
        </section>

        {step === 7 && (
          <div className="no-print mt-6 space-y-3">
            <button
              type="button"
              onClick={handleStartOver}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Start Over
            </button>
          </div>
        )}

        <footer className="no-print mt-6 flex items-center justify-between">
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

          {step < 7 && (
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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold">
              L
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Leavigation
            </span>
          </div>
          <a
            href="/plan"
            className="text-sm font-semibold text-sky-700 hover:text-sky-900"
          >
            Build my plan
          </a>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="mb-12">
            <div className="rounded-3xl bg-sky-50/60 px-6 py-8 shadow-sm ring-1 ring-sky-100">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Parental leave is two things.{" "}
                <span className="text-sky-700">Most people only know about one.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-700">
                Understanding how job protection and paid leave work — and how they
                interact — is the key to planning a leave that actually works for you.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="/plan"
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Build my leave plan →
                </a>
                <p className="text-xs text-slate-500">
                  Takes about 5–10 minutes. No login required.
                </p>
              </div>
            </div>
          </section>

          {/* Section 1: Job protection */}
          <section className="mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="text-base leading-none">🛡️</span>
              <span>Job Protection</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Job Protection: Your right to come back
            </h2>
            <p className="text-sm text-slate-700">
              Job protection means your employer has to hold your job (or an equivalent
              role) while you&apos;re on leave. It{" "}
              <span className="font-semibold">does not</span> mean you get paid. The main
              federal law is FMLA — 12 weeks of job protection for eligible employees.
              Some states layer on additional weeks of protection on top of that.
            </p>
            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">
                Job protection and pay are separate.
              </p>
              <p className="mt-1">
                You can be fully job-protected and still receive no income — or you can
                be getting paid with no legal right to return to your role.
              </p>
            </div>
          </section>

          {/* Section 2: Paid leave */}
          <section className="mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="text-base leading-none">💵</span>
              <span>Paid Leave</span>
            </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Paid Leave: Income while you&apos;re away
          </h2>
          <p className="text-sm text-slate-700">
            Paid leave is the money that shows up while you&apos;re out. It can come
            from state disability insurance (SDI), state paid family leave (PFL),
            employer parental leave, and short-term disability (STD). Each has its own
            start date, duration, and pay rate — and they can stack.
          </p>
          <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
            <p className="font-semibold">
              Most people receive pay from 2–3 different programs.
            </p>
            <p className="mt-1">
              Each program has its own forms, deadlines, and rules. The confusing part
              isn&apos;t any one program — it&apos;s how they overlap.
            </p>
          </div>
        </section>

        {/* Section 3: How they work together */}
        <section className="mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            <span className="text-base leading-none">🔗</span>
            <span>Job Protection + Pay</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            How they work together
          </h2>
          <p className="text-sm text-slate-700">
            In any given week of leave, you might be job-protected but unpaid, paid but
            not job-protected, both, or neither. The goal is to maximize weeks where
            you have{" "}
            <span className="font-semibold">both protection and income.</span> That&apos;s
            exactly what Leavigation helps you map out.
          </p>

          {/* 2x2 grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-200">
              <p className="font-semibold text-emerald-900">✅ Protected + Paid</p>
              <p className="mt-1 text-emerald-900/80">
                The ideal: your job is protected and money is coming in.
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-3 ring-1 ring-amber-200">
              <p className="font-semibold text-amber-900">
                ⚠️ Protected + Unpaid
              </p>
              <p className="mt-1 text-amber-900/80">
                Legally safe, but financially stressful — sometimes a planned gap.
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 px-3 py-3 ring-1 ring-orange-200">
              <p className="font-semibold text-orange-900">
                ⚠️ Paid + Unprotected
              </p>
              <p className="mt-1 text-orange-900/80">
                Income without legal protection — often when employer pay extends after
                laws run out.
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-3 ring-1 ring-rose-200">
              <p className="font-semibold text-rose-900">
                ❌ Unprotected + Unpaid
              </p>
              <p className="mt-1 text-rose-900/80">
                The real cliff — no legal protection and no income. Planning helps you
                avoid landing here by surprise.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Ready to map out your leave?
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Answer a few questions and get a week-by-week breakdown of your job
            protection and pay — specific to your state, employer, and situation.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href="/plan"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Build my leave plan →
            </a>
            <p className="text-xs text-slate-500">
              You can tweak your answers and re-run the plan anytime.
            </p>
          </div>
          <p className="mt-4 text-[11px] leading-snug text-slate-500">
            This tool is informational only and not legal or tax advice. Talk to your
            HR team, a lawyer, or a qualified professional before making decisions
            about your leave.
          </p>
        </section>
        </main>
      </div>
    </main>
  );
}