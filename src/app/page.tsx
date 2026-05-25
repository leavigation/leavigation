"use client";

declare function gtag(command: string, action: string, params?: Record<string, unknown>): void;

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import emailjs from "@emailjs/browser";
import { StateProgramsReference } from "@/components/StateProgramsReference";
import {
  getChatPlaceholder,
  getChatSuggestedQuestions,
  getIncomeEstimateFootnote,
  getStateIncomeProgramLabels,
} from "@/lib/leaveGuideDisplay";
import { getStateLeave, FMLA } from "../stateleavedata";
import { getMunicipalLeave, isMunicipalPaySupplement } from "../data/municipalleavedata";

const US_STATES_SUPPORTED = ["CA"];
const US_STATES_PAID_LEAVE_COMING_SOON = ["NY", "NJ", "WA", "MA", "CT", "CO", "OR", "RI", "MN", "DE", "MD", "HI"];
const ALL_US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  { code: "DC", name: "Washington DC" },
];

const steps = [
  "Basics",
  "Birth & Recovery",
  "Your Income",
  "Legal & Employer",
  "Short‑term Disability",
  "Results",
];

// Set to true to show income/salary input and tax details (step 3) and any results-page estimated total / "Based on $X per week" UI
const SHOW_INCOME_UI = false;

// States with paid leave programs, show Recent Mover flow when due date within 6 months
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
  const found = ALL_US_STATES.find((s) => s.code === stateCode);
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

function getIncomeSourceBarColor(label: string): string {
  if (label === "STD") return "#85B7EB";
  if (label === "Employer") return "#FAC775";
  if (label === "SF PPLO") return "#F0997B";
  const lower = label.toLowerCase();
  if (
    lower.includes("sdi") ||
    lower.includes("tdi") ||
    lower.includes("dbl") ||
    lower.includes("disability insurance") ||
    lower.includes("disability benefits")
  ) {
    return "#5DCAA5";
  }
  if (
    lower.includes("pfl") ||
    lower.includes("family leave") ||
    lower.includes("paid leave")
  ) {
    return "#7F77DD";
  }
  return "#85B7EB";
}

function getIncomeSourceSortOrder(label: string): number {
  const color = getIncomeSourceBarColor(label);
  if (color === "#5DCAA5") return 0;
  if (color === "#7F77DD") return 1;
  if (color === "#F0997B") return 2;
  if (color === "#FAC775") return 3;
  if (color === "#85B7EB") return 4;
  return 5;
}

function getIncomeSourceLegendLabel(label: string): string {
  if (label === "Employer") return "Employer leave";
  if (label === "STD") return "STD";
  return label;
}

function WeekIncomeStackedBar({
  sources,
  normalWeeklyGrossPay,
}: {
  sources: { label: string; amount: number }[];
  normalWeeklyGrossPay: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; left: number } | null>(null);

  const activeSources = sources.filter((s) => s.amount > 0);
  const gross = normalWeeklyGrossPay > 0 ? normalWeeklyGrossPay : 1;
  const totalPct = activeSources.reduce((sum, s) => sum + (s.amount / gross) * 100, 0);
  const scale = totalPct > 100 ? 100 / totalPct : 1;

  return (
    <div className="relative w-full min-w-[100px]">
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 whitespace-nowrap"
          style={{
            left: tooltip.left,
            bottom: "100%",
            transform: "translate(-50%, -6px)",
            background: "#2C2C2A",
            color: "#fff",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <div
        className="absolute top-0 z-10 pointer-events-none"
        style={{
          left: "100%",
          transform: "translateX(-0.75px)",
          width: 1.5,
          height: 22,
          backgroundImage:
            "repeating-linear-gradient(to bottom, #E24B4A 0, #E24B4A 4px, transparent 4px, transparent 7px)",
        }}
        aria-hidden
      />
      <div ref={barRef} className="flex h-[22px] w-full overflow-hidden rounded-[3px]">
        {activeSources.map((s, i) => {
          const widthPct = (s.amount / gross) * 100 * scale;
          return (
            <div
              key={`${s.label}-${i}`}
              className="relative h-full shrink-0"
              style={{
                width: `${widthPct}%`,
                backgroundColor: getIncomeSourceBarColor(s.label),
              }}
              onMouseEnter={(e) => {
                const segment = e.currentTarget;
                const bar = barRef.current;
                if (!bar) return;
                const segmentRect = segment.getBoundingClientRect();
                const barRect = bar.getBoundingClientRect();
                const displayLabel = getIncomeSourceLegendLabel(s.label);
                setTooltip({
                  text: `${displayLabel}: $${Math.round(s.amount).toLocaleString("en-US")}`,
                  left: segmentRect.left - barRect.left + segmentRect.width / 2,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </div>
    </div>
  );
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

/** Annual gross from salary input (matches weekly × 52 used in estimates). */
function getAnnualFromSalary(amountStr: string, frequency: "weekly" | "biweekly" | "monthly" | "annually"): number | null {
  const weekly = getWeeklyFromSalary(amountStr, frequency);
  if (weekly == null || weekly <= 0) return null;
  return Math.round(weekly * 52);
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
  const effectiveStateCode = US_STATES_PAID_LEAVE_COMING_SOON.includes((stateCode || "").toUpperCase())
    ? "DEFAULT"
    : (stateCode || "DEFAULT").toUpperCase();
  const state = getStateLeave(effectiveStateCode);
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

/** CA SDI 7-day waiting period: first calendar week of disability leave (timeline week 1). */
function isCaSdiWaitingPeriodWeek(week: WeekInfo, stateCode: string): boolean {
  if (stateCode !== "CA") return false;
  if (!week.streams.includes("State SDI")) return false;
  if (week.weekNumber !== 1) return false;
  const stateLeave = getStateLeave("CA");
  if (!stateLeave.sdi?.available) return false;
  return (stateLeave.sdi.waitingPeriodDays ?? 7) >= 7;
}

const STD_STREAM_NAME = "Short‑term disability" as const;

function formatGanttWeekLabel(week: WeekInfo, waitingMarker: boolean): string {
  const brw = week.birthRelativeWeek;
  const label =
    brw !== undefined
      ? `W${brw}`
      : `W${week.weekNumber}`;
  return waitingMarker ? `${label}\u2021` : label;
}

/** Summary row: inactive (rose) pre-birth columns only get indigo tint — never override paid/protected fills. */
function getSummaryCellClassName(week: WeekInfo, isPreBirthColumn: boolean): string {
  const hasPay = week.payPercent > 0;
  const isProtected = week.jobProtected;
  let color: string;
  if (hasPay && isProtected) {
    color = "bg-emerald-400 border border-emerald-500 text-emerald-950";
  } else if (hasPay && !isProtected) {
    color = "bg-amber-300/80 border border-amber-500 text-amber-950";
  } else if (!hasPay && isProtected) {
    color = "bg-orange-300/80 border border-orange-500 text-orange-950";
  } else {
    color = "bg-rose-300/80 border border-rose-500 text-rose-950";
  }
  const isInactiveSummary = !hasPay && !isProtected;
  if (isPreBirthColumn && isInactiveSummary) {
    return `${color} bg-indigo-50`;
  }
  return color;
}

function isStdGanttStream(stream: WeekStream | "PDL" | "CFRA"): boolean {
  return stream === STD_STREAM_NAME;
}

function weekHasStdStream(streams: WeekStream[]): boolean {
  return streams.some((s) => s === STD_STREAM_NAME);
}

function isStdStreamActiveInGantt(
  week: WeekInfo,
  isPreBirth: boolean,
  stdCoverage: string,
  stdPreBirth: string
): boolean {
  if (stdCoverage !== "yes") return false;
  if (!weekHasStdStream(week.streams)) return false;
  if (!isPreBirth) return true;
  return stdPreBirth === "yes";
}

/** Pre-birth Gantt columns use negative birth-relative week labels (e.g. W-4); weekNumber stays 1-based. */
function isGanttPreBirthWeek(week: WeekInfo): boolean {
  return (week.birthRelativeWeek ?? 0) < 1;
}

function getGanttWeekPartitions(activeTimeline: WeekInfo[]) {
  let birthColIdx = activeTimeline.findIndex((w) => w.birthRelativeWeek === 1);
  if (birthColIdx < 0) {
    birthColIdx = activeTimeline.findIndex((w) => (w.birthRelativeWeek ?? 0) >= 1);
  }
  const splitAt = birthColIdx >= 0 ? birthColIdx : activeTimeline.length;
  const preWeeks = activeTimeline.slice(0, splitAt);
  const postWeeks = activeTimeline.slice(splitAt);
  const showBirthDivider = preWeeks.length > 0;
  const gridStyle = showBirthDivider
    ? {
        gridTemplateColumns: `minmax(8rem, 8rem) repeat(${preWeeks.length}, minmax(2.5rem, 1fr)) minmax(1rem, 1rem) repeat(${postWeeks.length}, minmax(2.5rem, 1fr))`,
      }
    : {
        gridTemplateColumns: `minmax(8rem, 8rem) repeat(${activeTimeline.length}, minmax(2.5rem, 1fr))`,
      };
  return { preWeeks, postWeeks, showBirthDivider, gridStyle };
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
      warning: `You moved to ${stateName} less than 1 month ago and your due date is within 8 weeks. State SDI/disability for this pregnancy may not cover you. PFL bonding may still apply after birth if payroll is corrected in time, notify your employer and ask them to switch withholding to ${taxCode} as soon as possible.`,
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
  const effectiveStateCode = US_STATES_PAID_LEAVE_COMING_SOON.includes((stateCode || "").toUpperCase())
    ? "DEFAULT"
    : (stateCode || "DEFAULT").toUpperCase();
  const state = getStateLeave(effectiveStateCode);
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
  const effectiveStateCode = US_STATES_PAID_LEAVE_COMING_SOON.includes((options.stateCode || "").toUpperCase())
    ? "DEFAULT"
    : (options.stateCode || "DEFAULT").toUpperCase();
  const state = getStateLeave(effectiveStateCode);
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
      ? `, significantly less than ${pct}% of your current pay.`
      : ".";
    bullets.push(
      `Because you moved to ${stateName} ${options.moverEligibility.monthsInState} months ago, your ${state.sdi?.name?.includes("SDI") ? "SDI" : "state"} benefit will be calculated using only your ${stateName} wages. If your highest-earning quarter in ${stateName} was lower than your current salary, your weekly benefit may be significantly less than ${pct}% of your current pay${salaryNote}`
    );
  }
  if (options.moverEligibility?.status === "INELIGIBLE" && options.moverEligibility.warning) {
    bullets.push(options.moverEligibility.warning);
  }

  // State job protection bullet, fully from state data
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
      `⚠️ ${displayName} has no state job protection law beyond FMLA. After your FMLA exhausts at week 12, your job is not legally protected, consider negotiating extended leave with your employer before your leave starts.`
    );
  }

  // State leave program context, from state.hasStatePaidLeave and state.name
  if (state.hasStatePaidLeave) {
    bullets.push(
      `You're in ${state.name}. Your state's leave rules and deadlines will drive many of your key dates.`
    );
  } else {
    bullets.push(
      `${displayName} doesn't offer paid leave, your income during leave depends on employer benefits and any short‑term disability you have.`
    );
  }

  // CA-specific: PDL vs CFRA sequencing and total protected duration
  if ((options.stateCode || "").toUpperCase() === "CA" && state.pdl) {
    bullets.push(
      "As a California birthing parent eligible for both PDL and CFRA, your total job-protected leave can reach up to 7 months, up to 17 weeks of pregnancy disability leave followed by 12 weeks of CFRA bonding leave. This is significantly more than the federal 12-week FMLA baseline."
    );
  }
  if ((options.stateCode || "").toUpperCase() === "CA" && state.sdi.available) {
    bullets.push(
      "There is a 7-day unpaid waiting period before CA SDI begins paying. Most employers with STD plans cover this gap automatically, confirm with your HR team."
    );
  }
  if (keyDates.fmlaStartedBeforeBirth && keyDates.fmlaExhaustion) {
    bullets.push(
      `⚠️ Because your FMLA started before birth, your federal job protection ends at ${formatDateLong(keyDates.fmlaExhaustion)}, earlier than you might expect.`
    );
  }

  if (employerWeeks > 0) {
    const concurrent = options.coordination === "concurrent" || options.coordination === "unsure";
    if (concurrent) {
      bullets.push(`Your ${employerWeeks}-week employer leave runs at the same time as state benefits, so you'll receive up to ${options.employerPayPercent}% of your pay for those weeks where they overlap.`);
    } else {
      bullets.push(`Your ${employerWeeks}-week employer leave runs after state leave ends, so you get an extended period of paid time.`);
    }
  }
  if (hasFmla && !hasStateProtection) {
    const fmlaDate = keyDates.fmlaExhaustion ? formatDateLong(keyDates.fmlaExhaustion) : "week 12";
    bullets.push(`Your biggest risk is the FMLA cliff at week 12 (around ${fmlaDate}), after that date your federal job protection ends and you're no longer protected unless your employer agrees to more leave.`);
  } else if (hasFmla && hasStateProtection && stateLaw) {
    bullets.push(`After federal FMLA ends at week 12, ${state.name}'s ${stateLaw.name} may still cover you for bonding.`);
  } else if (!hasFmla) {
    bullets.push(`You're not FMLA-eligible, so you don't have federal job protection. Your job security during leave depends on your employer's policy and any state protection.`);
  }
  if (state.sdi.available && state.pfl.available && keyDates.sdiEnd) {
    bullets.push(`You'll need to file a separate PFL claim when your SDI ends (around ${formatDateLong(keyDates.sdiEnd)}), it won't happen automatically.`);
  } else if (state.pfl.available && keyDates.pflClaimStart) {
    bullets.push(`Your PFL claim can start around ${formatDateLong(keyDates.pflClaimStart)}. File it separately, don't wait.`);
  }
  if (!state.sdi.available) {
    bullets.push(`${displayName} has no disability insurance for medical recovery, your income during the 6 to 8 week recovery window depends entirely on your employer STD plan and any employer paid leave.`);
  }
  if (totalWeeks > 0 && fullyPaid >= totalWeeks * 0.8) {
    bullets.push(`You have ${fullyPaid} fully paid weeks out of ${totalWeeks} total, most of your leave is well covered.`);
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
  employerPreBirth?: "yes" | "no" | "";
  employerPreBirthWeeks?: string;
  employerPreBirthPayPercent?: string;
  stdCoverage: "yes" | "no" | "unsure" | "";
  stdWeeks?: string;
  stdPayPercent?: string;
  stdPreBirth?: "yes" | "no" | "";
  stdPreBirthPayPercent?: string;
  stdCoversWaitingPeriod?: "yes" | "no" | "unsure" | "";
  stdCoordinatesWithEmployer?: "supplement" | "replace" | "";
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
    employerPreBirth = "",
    employerPreBirthWeeks: employerPreBirthWeeksStr = "2",
    employerPreBirthPayPercent: employerPreBirthPayPercentStr = "100",
    stdCoverage,
    stdWeeks: stdWeeksStr = "",
    stdPayPercent: stdPayPercentStr = "60",
    stdPreBirth = "",
    stdPreBirthPayPercent: stdPreBirthPayPercentStr = "60",
    stdCoversWaitingPeriod = "",
    stdCoordinatesWithEmployer = "",
    coordination,
    caPreBirthLeave = "",
    caPreBirthWeeks: caPreBirthWeeksStr = "4",
  } = options;

  const code = (stateCode || "DEFAULT").toUpperCase();
  const effectiveStateCode = US_STATES_PAID_LEAVE_COMING_SOON.includes((stateCode || "").toUpperCase())
    ? "DEFAULT"
    : (stateCode || "DEFAULT").toUpperCase();
  const state = getStateLeave(effectiveStateCode);
  const municipal = getMunicipalLeave(cityInput, code);

  const recoveryWeeks =
    birthType === "c-section"
      ? state.sdi.weeksDurationCsection
      : state.sdi.weeksDurationVaginal || getRecoveryWeeks(birthType);
  const employerWeeks = parseWeeks(employerLeaveWeeks);
  const employerPercent = parsePercent(employerLeavePayPercent);
  const hasStd = stdCoverage === "yes";
  const stdWeeksNum = hasStd ? (parseInt(stdWeeksStr, 10) || 6) : 0;
  const stdPercent = hasStd ? (parseInt(stdPayPercentStr, 10) || 60) : 0;
  const employerPreBirthPercentForPay =
    parseInt(employerPreBirthPayPercentStr, 10) || employerPercent;
  const stdPreBirthPercentForPay =
    parseInt(stdPreBirthPayPercentStr, 10) || stdPercent;
  const stdCoversWeek1 = hasStd && stdCoversWaitingPeriod === "yes";
  const hasEmployerPreBirth = employerPreBirth === "yes";
  const employerPreBirthWeeksNum = hasEmployerPreBirth ? (parseInt(employerPreBirthWeeksStr, 10) || 2) : 0;
  const hasFmla = fmlaEligible === "yes";
  const disabilityWeeks = state.sdi.available ? recoveryWeeks : 0;
  const bondingWeeks = state.pfl.available ? state.pfl.weeksDuration || 0 : 0;

  const statePreBirthWeeks =
    (effectiveStateCode === "CA" || effectiveStateCode === "NY" || effectiveStateCode === "NJ" || effectiveStateCode === "RI") &&
    (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended")
      ? Math.min(20, Math.max(1, parseInt(caPreBirthWeeksStr, 10) || 4))
      : 0;
  const preBirthWeeks = Math.max(statePreBirthWeeks, employerPreBirthWeeksNum);

  const statePaidWeeks = preBirthWeeks + disabilityWeeks + bondingWeeks;
  const employerConcurrent = coordination === "concurrent" || coordination === "unsure" || coordination === "";
  const cfraExtension = (effectiveStateCode === "CA" || effectiveStateCode === "NY" || effectiveStateCode === "NJ") ? 12 : 0;
  const jobProtectionEnd = preBirthWeeks + disabilityWeeks + cfraExtension;
  const paidLeaveEnd = preBirthWeeks + disabilityWeeks + bondingWeeks + (employerConcurrent ? 0 : employerWeeks);
  const concurrentEmployerEnd = employerConcurrent ? preBirthWeeks + employerWeeks : 0;
  const fmlaProtectionEnd = hasFmla ? preBirthWeeks + FMLA.weeksProtected : 0;
  const totalWeeks = Math.max(
    jobProtectionEnd,
    paidLeaveEnd,
    concurrentEmployerEnd,
    fmlaProtectionEnd,
    preBirthWeeks + disabilityWeeks + bondingWeeks + employerWeeks + 2
  );
  const employerStartWeek = hasEmployerPreBirth ? 1 : (employerConcurrent ? preBirthWeeks + 1 : statePaidWeeks + 1);
  const employerEndWeek = hasEmployerPreBirth
    ? employerPreBirthWeeksNum + employerWeeks
    : (employerConcurrent ? preBirthWeeks + employerWeeks : statePaidWeeks + employerWeeks);
  const weeks: WeekInfo[] = [];

  const stdCoordMode = stdCoordinatesWithEmployer;
  function applyStdEmployerToPayPercent(
    payPercent: number,
    stdPct: number,
    streams: WeekStream[]
  ): number {
    if (!streams.includes("Short‑term disability")) return payPercent;
    if (stdCoordMode === "supplement" && streams.includes("Employer leave")) {
      return Math.min(100, Math.max(payPercent, stdPct));
    }
    if (stdCoordMode === "replace") {
      return Math.min(100, payPercent + stdPct);
    }
    return Math.min(100, Math.max(payPercent, stdPct));
  }

  const fmlaWeeks = hasFmla ? FMLA.weeksProtected : 0;

  if ((effectiveStateCode === "CA" || effectiveStateCode === "NY" || effectiveStateCode === "NJ" || effectiveStateCode === "RI") && preBirthWeeks > 0) {
    const lastSdiWeek = preBirthWeeks + disabilityWeeks;
    const pflStartWeek = lastSdiWeek + 1;
    const pflEndWeek = pflStartWeek + bondingWeeks - 1;
    const birthWeek = preBirthWeeks + 1;
    const leaveStartDate = new Date(dueDate + "T00:00:00");
    leaveStartDate.setDate(leaveStartDate.getDate() - preBirthWeeks * 7);
    const caWaitingPeriodDays = state.sdi?.waitingPeriodDays ?? 7;
    const isCA = effectiveStateCode === "CA";
    const isNY = effectiveStateCode === "NY";
    const isNJ = effectiveStateCode === "NJ";
    const isRI = effectiveStateCode === "RI";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalWeeks; i++) {
      const weekNumber = i + 1;
      const streams: WeekStream[] = [];

      if (hasFmla && weekNumber <= 12) streams.push("FMLA");

      if (weekNumber <= preBirthWeeks) {
        streams.push("State SDI");
        if (hasStd && stdPreBirth === "yes") streams.push("Short‑term disability");
      } else if (weekNumber <= lastSdiWeek) {
        streams.push("State SDI");
        if (hasStd && weekNumber <= preBirthWeeks + Math.min(stdWeeksNum, recoveryWeeks)) streams.push("Short‑term disability");
      }

      if (weekNumber >= pflStartWeek && weekNumber <= pflEndWeek && !streams.includes("State SDI")) {
        streams.push("State PFL");
      }

      if (employerWeeks > 0) {
        const empStart = hasEmployerPreBirth
          ? 1
          : (employerConcurrent ? birthWeek : statePaidWeeks + 1);
        const empEnd = hasEmployerPreBirth
          ? employerPreBirthWeeksNum + employerWeeks
          : (employerConcurrent ? birthWeek - 1 + employerWeeks : statePaidWeeks + employerWeeks);
        if (weekNumber >= empStart && weekNumber <= empEnd) {
          streams.push("Employer leave");
        }
      }

      const inPreBirth = weekNumber <= preBirthWeeks;
      const isFirstWeekOfLeave = weekNumber === 1;

      let payPercent = 0;
      if (streams.includes("Employer leave")) {
        const empPct =
          inPreBirth && hasEmployerPreBirth
            ? employerPreBirthPercentForPay
            : employerPercent;
        payPercent = Math.max(payPercent, empPct);
      }

      if (inPreBirth) {
        if (isCA) {
          if (isFirstWeekOfLeave && caWaitingPeriodDays >= 7) {
            payPercent = 0;
            if (hasStd && stdCoversWeek1) {
              const stdPctW1 =
                stdPreBirth === "yes" ? stdPreBirthPercentForPay : stdPercent;
              if (streams.includes("Short‑term disability")) {
                payPercent = applyStdEmployerToPayPercent(payPercent, stdPctW1, streams);
              } else {
                payPercent = Math.max(payPercent, stdPctW1);
              }
            }
          } else {
            const sdiPct = state.sdi.payPercent
              ? Math.round(state.sdi.payPercent * 100)
              : 0;
            payPercent = Math.max(payPercent, sdiPct);
          }
        } else if (isNY) {
          payPercent = Math.max(payPercent, 50);
          if (hasStd) {
            const stdPctNy =
              stdPreBirth === "yes" ? stdPreBirthPercentForPay : stdPercent;
            if (streams.includes("Short‑term disability")) {
              payPercent = applyStdEmployerToPayPercent(payPercent, stdPctNy, streams);
            } else {
              payPercent = Math.max(payPercent, stdPctNy);
            }
          }
        } else if (isNJ) {
          const sdiPct = state.sdi.payPercent
            ? Math.round(state.sdi.payPercent * 100)
            : 85;
          payPercent = Math.max(payPercent, sdiPct);
          if (hasStd) {
            const stdPctNj =
              stdPreBirth === "yes" ? stdPreBirthPercentForPay : stdPercent;
            if (streams.includes("Short‑term disability")) {
              payPercent = applyStdEmployerToPayPercent(payPercent, stdPctNj, streams);
            } else {
              payPercent = Math.max(payPercent, stdPctNj);
            }
          }
        } else if (isRI) {
          const sdiPct = state.sdi.payPercent
            ? Math.round(state.sdi.payPercent * 100)
            : 60;
          payPercent = Math.max(payPercent, sdiPct);
          if (hasStd) {
            const stdPctRi =
              stdPreBirth === "yes" ? stdPreBirthPercentForPay : stdPercent;
            if (streams.includes("Short‑term disability")) {
              payPercent = applyStdEmployerToPayPercent(payPercent, stdPctRi, streams);
            } else {
              payPercent = Math.max(payPercent, stdPctRi);
            }
          }
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
        if (streams.includes("Short‑term disability")) {
          payPercent = applyStdEmployerToPayPercent(payPercent, stdPercent, streams);
        }
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
        streams.push("SF PPLO");
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
              ? "7-day CA SDI waiting period, STD typically covers this week."
              : "⚠️ 7-day CA SDI waiting period, no state pay this week. Check if your employer covers this gap or if you have PTO to use.";
          } else {
            note =
              "PDL pre-birth phase, SDI active, FMLA clock running.";
          }
        } else if (isNY) {
          note =
            "⚠️ NY DBL pays a maximum of $170/week during this phase, employer STD is critical to supplement this gap.";
        } else if (isNJ) {
          note =
            "NJ TDI covers pre-birth leave at ~85% of wages. FMLA provides job protection if eligible, NJFLA does not apply to your own pregnancy disability.";
        } else if (isRI) {
          note =
            "RI TDI covers pre-birth leave. Note: Rhode Island has no state job protection law beyond FMLA, if not FMLA eligible, there is no job protection during this phase.";
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
          ? `${note} ⚠️ Because your FMLA started before birth, your federal job protection has ended, earlier than you might expect.`
          : "⚠️ Because your FMLA started before birth, your federal job protection has ended, earlier than you might expect.";
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

    // STD: runs during pre-birth (if applicable) and post-birth recovery
    const stdStartWeek = (hasStd && stdPreBirth === "yes") ? 1 : preBirthWeeks + 1;
    const stdEndWeek = (hasStd && stdPreBirth === "yes")
      ? preBirthWeeks + stdWeeksNum
      : preBirthWeeks + Math.min(stdWeeksNum, recoveryWeeks);
    if (hasStd && weekNumber >= stdStartWeek && weekNumber <= stdEndWeek) {
      streams.push("Short‑term disability");
    }

    // Employer leave: concurrent from birth or sequential after state leave
    if (employerWeeks > 0 && weekNumber >= employerStartWeek && weekNumber <= employerEndWeek) {
      streams.push("Employer leave");
    }

    let payPercent = 0;

    const inPreBirthDefault = preBirthWeeks > 0 && weekNumber <= preBirthWeeks;
    if (streams.includes("Employer leave")) {
      const empPct =
        inPreBirthDefault && hasEmployerPreBirth
          ? employerPreBirthPercentForPay
          : employerPercent;
      payPercent = Math.max(payPercent, empPct);
    }

    if (streams.includes("State SDI")) {
      const caWaitingPeriod =
        effectiveStateCode === "CA" &&
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
      const caWeek1SdiWaiting =
        effectiveStateCode === "CA" &&
        state.sdi.available &&
        (state.sdi?.waitingPeriodDays ?? 7) >= 7 &&
        weekNumber === 1;
      const stdPctThisWeek =
        inPreBirthDefault && stdPreBirth === "yes"
          ? stdPreBirthPercentForPay
          : stdPercent;
      if (!caWeek1SdiWaiting || stdCoversWeek1) {
        payPercent = applyStdEmployerToPayPercent(payPercent, stdPctThisWeek, streams);
      }
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
      (effectiveStateCode === "CA" || effectiveStateCode === "NY" || effectiveStateCode === "NJ") &&
      state.stateProtection?.available &&
      weekNumber > disabilityWeeks &&
      weekNumber <= disabilityWeeks + 12;
    const jobProtected = protectedByFmla || protectedByState || protectedByCfra;

    let note = "";
    if (weekNumber === 1) {
      const caWaitingPeriod =
        effectiveStateCode === "CA" &&
        state.sdi?.available &&
        (state.sdi?.waitingPeriodDays ?? 7) >= 7;
      if (caWaitingPeriod) {
        note = hasStd
          ? "Birth and start of leave. 7-day CA SDI waiting period, STD typically covers this week."
          : "Birth and start of leave. ⚠️ 7-day CA SDI waiting period, no state pay this week. Check if your employer covers this gap or if you have PTO to use.";
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

    const birthWeekForRelative = preBirthWeeks + 1;
    const birthRelativeWeek =
      weekNumber < birthWeekForRelative
        ? weekNumber - birthWeekForRelative
        : weekNumber - birthWeekForRelative + 1;
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
  const [scenario, setScenario] = useState<"employed_long" | "employed_short" | "new_job" | "laid_off" | "">("");

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  const [birthType, setBirthType] = useState<"vaginal" | "c-section" | "">("");
  // FMLA eligibility hidden, tool currently scoped to full-time employees
  // Re-enable when expanding to part-time, contractor, and self-employed flows
  const [fmlaEligible, setFmlaEligible] = useState<"yes" | "no" | "unsure" | "">("yes");
  const [employerLeaveOffered, setEmployerLeaveOffered] = useState<"yes" | "no" | "unsure" | "">("");
  const [employerLeaveWeeks, setEmployerLeaveWeeks] = useState("");
  const [employerLeavePayPercent, setEmployerLeavePayPercent] = useState("");
  const [stdCoverage, setStdCoverage] = useState<"yes" | "no" | "unsure" | "">("");
  const [employerPreBirth, setEmployerPreBirth] = useState<"yes" | "no" | "">("");
  const [employerPreBirthWeeks, setEmployerPreBirthWeeks] = useState("2");
  const [employerPreBirthPayPercent, setEmployerPreBirthPayPercent] = useState("100");
  const [stdWeeks, setStdWeeks] = useState("");
  const [stdPayPercent, setStdPayPercent] = useState("60");
  const [stdPreBirth, setStdPreBirth] = useState<"yes" | "no" | "">("");
  const [stdPreBirthPayPercent, setStdPreBirthPayPercent] = useState("60");
  const [stdCoversWaitingPeriod, setStdCoversWaitingPeriod] = useState<"yes" | "no" | "unsure" | "">("");
  const [stdCoordinatesWithEmployer, setStdCoordinatesWithEmployer] = useState<"supplement" | "replace" | "">("");
  const [coordination, setCoordination] = useState<Coordination>("");
  const [timeline, setTimeline] = useState<WeekInfo[] | null>(null);
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryFrequency, setSalaryFrequency] = useState<"weekly" | "biweekly" | "monthly" | "annually">("monthly");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState(1);
  const [feedbackQ1, setFeedbackQ1] = useState("");
  const [feedbackQ2, setFeedbackQ2] = useState("");
  const [feedbackQ3, setFeedbackQ3] = useState("");
  const [feedbackQ4, setFeedbackQ4] = useState("");
  const [feedbackQ5, setFeedbackQ5] = useState("");
  const [feedbackQ2Text, setFeedbackQ2Text] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [assumptionsAcknowledged, setAssumptionsAcknowledged] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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
  const [stdExplainerOpen, setStdExplainerOpen] = useState(false);
  const [sdiExplainerOpen, setSdiExplainerOpen] = useState(false);

  const PRE_BIRTH_STATES = ["CA", "NY", "NJ", "RI"];
  const hasPreBirthOption = PRE_BIRTH_STATES.includes(state);
  const showPreBirthNote = state && !PRE_BIRTH_STATES.includes(state);
  const stateProgramLabels = useMemo(() => getStateIncomeProgramLabels(state), [state]);
  const chatSuggestedQuestions = useMemo(() => getChatSuggestedQuestions(state), [state]);

  const showRecentMoverQuestion =
    (step === 0 || step === 3) &&
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
    setScenario("");
    setAssumptionsAcknowledged(false);
    setState("");
    setCity("");
    setDueDate("");
    setEmploymentStartDate("");
    setBirthType("");
    setFmlaEligible("yes");
    setEmployerLeaveOffered("");
    setEmployerLeaveWeeks("");
    setEmployerLeavePayPercent("");
    setStdCoverage("");
    setEmployerPreBirth("");
    setEmployerPreBirthWeeks("2");
    setEmployerPreBirthPayPercent("100");
    setStdWeeks("");
    setStdPayPercent("60");
    setStdPreBirth("");
    setStdPreBirthPayPercent("60");
    setStdCoversWaitingPeriod("");
    setStdCoordinatesWithEmployer("");
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
      setEmailError("Email is not configured. Add your EmailJS keys to .env.local, see EMAILJS_SETUP.md.");
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

  async function handleChatSubmit() {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    const tl = (displayTimeline ?? timeline) as WeekInfo[] | null;
    const lastActive = tl ? Math.max(0, ...tl.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0))) : 0;
    const fullyPaid = tl ? tl.filter((w) => w.weekNumber <= lastActive && w.payPercent >= 95).length : 0;

    const stateDisplayName = ALL_US_STATES.find((s) => s.code === state)?.name ?? state;
    const hasStatePaidLeave = US_STATES_SUPPORTED.includes(state);

    let weekByWeekBreakdown = "";
    const coordinationForChat: "concurrent" | "sequential" =
      employerRequiresConcurrent
        ? "concurrent"
        : coordination === "concurrent" || coordination === "sequential"
          ? coordination
          : "concurrent";
    const employerIsTopUpModeForChat = coordinationForChat === "concurrent";
    if (tl) {
      const weeklySalary = weeklySalaryNum ?? 0;
      const isCA = (state || "CA").toUpperCase() === "CA";
      const caWeeklyRate = isCA && weeklySalary > 0 ? getCAWeeklyBenefit2026(weeklySalary) : 0;
      const employerPct = parsePercent(employerLeavePayPercent);
      const stdPctForEst = parsePercent(stdPayPercent) || 60;
      const employerPreBirthPctForEst =
        parseInt(employerPreBirthPayPercent, 10) || employerPct;
      const stdPreBirthPctForEst =
        parseInt(stdPreBirthPayPercent, 10) || stdPctForEst;
      const breakdownLines: string[] = [];
      for (const w of tl.slice(0, 30)) {
        let weekSdi = 0;
        let weekPfl = 0;
        let weekEmployer = 0;
        let weekEmployerForDisplay = 0;
        let weekStd = 0;
        if (w.streams.includes("State SDI")) {
          weekSdi = isCA
            ? w.weekNumber === 1
              ? 0
              : caWeeklyRate
            : Math.min(weeklySalary * 0.7, 1620);
        }
        if (w.streams.includes("State PFL")) {
          weekPfl = isCA ? caWeeklyRate : Math.min(weeklySalary * 0.7, 1620);
        }
        if (w.streams.includes("Employer leave")) {
          const isPreBirthPhase = (w.birthRelativeWeek ?? 0) < 0;
          const employerPctThisWeek =
            employerPreBirth === "yes" && isPreBirthPhase
              ? employerPreBirthPctForEst
              : employerPct;
          weekEmployer = weeklySalary * (employerPctThisWeek / 100);
          const employerTarget = Math.min(weekEmployer, weeklySalary);
          weekEmployerForDisplay = weekEmployer;
          if (employerIsTopUpModeForChat) {
            if (weekSdi > 0) {
              weekEmployerForDisplay = Math.max(0, employerTarget - weekSdi);
            } else if (weekPfl > 0) {
              weekEmployerForDisplay = Math.max(0, employerTarget - weekPfl);
            } else {
              weekEmployerForDisplay = employerTarget;
            }
          }
        }
        if (w.streams.includes("Short‑term disability")) {
          const isPreBirthPhase = (w.birthRelativeWeek ?? 0) < 0;
          const stdPctThisWeek =
            stdPreBirth === "yes" && isPreBirthPhase
              ? stdPreBirthPctForEst
              : stdPctForEst;
          weekStd = weeklySalary * (stdPctThisWeek / 100);
        }
        let weekSfPplo = 0;
        if (w.streams.includes("SF PPLO")) {
          const baseWithoutPplo = Math.min(
            weekSdi + weekPfl + weekEmployer + weekStd,
            weeklySalary
          );
          weekSfPplo = Math.max(0, weeklySalary - baseWithoutPplo);
        }
        const totalIncome = Math.round(
          Math.min(
            weekSdi + weekPfl + weekEmployerForDisplay + weekStd + weekSfPplo,
            weeklySalary
          )
        );
        const date = w.startDateLabel ?? "";
        const payPct = Math.round(w.payPercent);
        const sourceParts: string[] = [];
        if (weekSdi > 0) sourceParts.push(`State SDI $${Math.round(weekSdi)}`);
        if (weekPfl > 0) sourceParts.push(`State PFL $${Math.round(weekPfl)}`);
        if (weekEmployerForDisplay > 0)
          sourceParts.push(`Employer leave $${Math.round(weekEmployerForDisplay)}`);
        if (weekStd > 0) sourceParts.push(`Short‑term disability $${Math.round(weekStd)}`);
        if (weekSfPplo > 0) sourceParts.push(`SF PPLO $${Math.round(weekSfPplo)}`);
        const sourcesStr =
          w.streams.length === 0 ? "None" : sourceParts.length > 0 ? sourceParts.join(", ") : "None";
        breakdownLines.push(
          `Week ${w.weekNumber} (${date}): $${totalIncome} (${payPct}%) — Sources: ${sourcesStr}`
        );
      }
      if (breakdownLines.length > 0) {
        weekByWeekBreakdown = `Week-by-week income breakdown:\n${breakdownLines.join("\n")}`;
      }
    }

    const planContext = tl ? [
      `State: ${stateDisplayName} (${state})`,
      `State paid leave program: ${hasStatePaidLeave ? "Yes, full CA program" : US_STATES_PAID_LEAVE_COMING_SOON.includes(state) ? "Yes but not yet modeled in this tool, showing FMLA + employer + STD only" : "No state program, FMLA + employer + STD only"}`,
      `Birth type: ${birthType || "not specified"}`,
      `Pre-birth leave: ${caPreBirthLeave === "yes_standard" ? "Yes, standard (<=4 weeks)" : caPreBirthLeave === "yes_extended" ? `Yes, extended (${caPreBirthWeeks} weeks)` : "None"}`,
      `SF PPLO: ${city === "San Francisco" ? "Yes" : "No"}`,
      `Employer leave: ${employerLeaveOffered === "yes" ? `Yes, ${employerLeaveWeeks} weeks at ${employerLeavePayPercent}%, ${coordination || "coordination not set"}` : employerLeaveOffered === "no" ? "None" : "Unsure"}`,
      employerIsTopUpModeForChat && employerLeaveOffered === "yes"
        ? "Employer leave coordination: top-up (concurrent). Employer only pays the difference between SDI/PFL and the employer pay target. In weeks where SDI or PFL already meets or exceeds the employer pay percentage, employer contribution is $0."
        : "",
      `Total leave weeks: ${lastActive}`,
      `Fully paid weeks: ${fullyPaid}`,
      weeklySalaryNum ? `Weekly salary: $${Math.round(weeklySalaryNum)}` : "Salary: not provided",
      incomeEstimator ? `Estimated total leave income: $${Math.round(incomeEstimator.totalLeaveIncome).toLocaleString()}` : "",
      incomeEstimator ? `Estimated shortfall: $${Math.round(incomeEstimator.shortfall).toLocaleString()}` : "",
      weekByWeekBreakdown,
    ].filter(Boolean).join("\n") : "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          planContext,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer || data.error || "Sorry, something went wrong." }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleSubmitFeedback() {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const templateId = "template_w5tr1j9";
    if (!serviceId || !publicKey) return;
    const templateParams = {
      q1: feedbackQ1 || "(skipped)",
      q2: feedbackQ2Text || "(skipped)",
      q3: feedbackQ3 || "(skipped)",
      q4: feedbackQ4 || "(skipped)",
      q5: feedbackQ5 || "(skipped)",
      submitted_at: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    };
    emailjs.send(serviceId, templateId, templateParams, { publicKey })
      .then(() => {})
      .catch(() => {});
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

  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => setFeedbackVisible(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setFeedbackVisible(false);
      setFeedbackStep(1);
      setFeedbackSubmitted(false);
      setFeedbackDone(false);
    }
  }, [step]);

  function handleNext() {
    const stepNames = ["Basics", "Birth & Recovery", "Your Income", "Legal & Employer", "Short-term Disability"];
    try {
      gtag("event", "plan_step_completed", {
        step_number: step,
        step_name: stepNames[step] ?? `Step ${step}`,
        state_code: state || "unknown",
      });
    } catch {}
    if (step === 0 && !state) {
      alert("Please select your state to continue.");
      return;
    }
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
        employerPreBirth,
        employerPreBirthWeeks,
        employerPreBirthPayPercent,
        stdWeeks,
        stdPayPercent,
        stdPreBirth,
        stdPreBirthPayPercent,
        stdCoversWaitingPeriod,
        stdCoordinatesWithEmployer,
        stdCoverage,
        coordination,
        caPreBirthLeave: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthLeave : undefined,
        caPreBirthWeeks: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthWeeks : undefined,
      });
      setTimeline(weeks);
      // When no employer leave, go straight to Results (step 5)
      if (noEmployerLeave) {
        setStep(5);
        try {
          gtag("event", "plan_completed", {
            state_code: state || "unknown",
            birth_type: birthType || "unknown",
            has_employer_leave: String(employerLeaveOffered) === "yes",
            has_std: stdCoverage === "yes",
            has_pre_birth: caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended" || employerPreBirth === "yes",
            has_sf_pplo: city === "San Francisco",
            state_has_paid_leave: US_STATES_SUPPORTED.includes(state),
          });
        } catch {}
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStep((s) => s + 1);
        if (step === 4) {
          try {
            gtag("event", "plan_completed", {
              state_code: state || "unknown",
              birth_type: birthType || "unknown",
              has_employer_leave: String(employerLeaveOffered) === "yes",
              has_std: stdCoverage === "yes",
              has_pre_birth: caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended" || employerPreBirth === "yes",
              has_sf_pplo: city === "San Francisco",
              state_has_paid_leave: US_STATES_SUPPORTED.includes(state),
            });
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (step === 3 && noEmployerLeave) {
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isLastStep) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    try {
      gtag("event", "plan_step_back", {
        from_step: step,
        state_code: state || "unknown",
      });
    } catch {}
    const noEmployerLeave = employerLeaveOffered === "no";
    if (noEmployerLeave) {
      if (step === 4 && noEmployerLeave) {
        setStep(3);
        return;
      }
      if (step === 5) {
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
      employerPreBirth,
      employerPreBirthWeeks,
      employerPreBirthPayPercent,
      stdWeeks,
      stdPayPercent,
      stdPreBirth,
      stdPreBirthPayPercent,
      stdCoversWaitingPeriod,
      stdCoordinatesWithEmployer,
      stdCoverage,
      coordination: coordinationForTimeline,
      caPreBirthLeave: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthLeave : undefined,
      caPreBirthWeeks: ["CA", "NY", "NJ", "RI"].includes(state || "") ? caPreBirthWeeks : undefined,
    });
    return result;
  }, [
    timeline,
    coordinationForTimeline,
    state,
    city,
    dueDate,
    birthType,
    fmlaEligible,
    employerLeaveWeeks,
    employerLeavePayPercent,
    stdCoverage,
    employerPreBirth,
    employerPreBirthWeeks,
    employerPreBirthPayPercent,
    stdWeeks,
    stdPayPercent,
    stdPreBirth,
    stdPreBirthPayPercent,
    stdCoversWaitingPeriod,
    stdCoordinatesWithEmployer,
    caPreBirthLeave,
    caPreBirthWeeks,
  ]);

  const activeTimelineForEstimator = useMemo(() => {
    const full = (displayTimeline ?? timeline) as WeekInfo[] | null;
    if (!full || full.length === 0) return full;
    const lastActiveWeek = Math.max(0, ...full.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
    return full.filter((w) => w.weekNumber <= lastActiveWeek);
  }, [displayTimeline, timeline]);

  const incomeEstimator = useMemo(() => {
    if (!activeTimelineForEstimator || activeTimelineForEstimator.length === 0) return null;
    const weeklySalary = weeklySalaryNum ?? 0;
    const stateCode = (state || "CA").toUpperCase();
    const isCA = stateCode === "CA";
    const sdiIncomeLabel = stateProgramLabels.sdi ?? "State disability";
    const pflIncomeLabel = stateProgramLabels.pfl ?? "State paid leave";
    const employerPct = parsePercent(employerLeavePayPercent);
    const employerWks = parseWeeks(employerLeaveWeeks);
    const stdPctForEst = parsePercent(stdPayPercent) || 60;
    const employerPreBirthPctForEst =
      parseInt(employerPreBirthPayPercent, 10) || employerPct;
    const stdPreBirthPctForEst =
      parseInt(stdPreBirthPayPercent, 10) || stdPctForEst;
    const stdWeeksNumForDisplay =
      stdCoverage === "yes" ? (parseInt(stdWeeks, 10) || 6) : 0;
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
    let sdiTotal = 0;
    let pflTotal = 0;
    let sfPploTotal = 0;
    let sfPploWeeks = 0;
    let employerTotal = 0;
    let stdTotal = 0;
    let totalLeaveIncomeCapped = 0;
    const employerIsTopUpMode = isConcurrentLike;
    const weekRows: { weekNumber: number; dateLabel: string; programs: string[]; grossPay: number; pctOfNormal: number; sources: { label: string; amount: number; pct: number }[] }[] = [];

    for (const w of activeTimelineForEstimator) {
      let weekSdi = 0;
      let weekPfl = 0;
      let weekEmployer = 0;
      let weekEmployerForDisplay = 0;
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
        const isPreBirthPhase = (w.birthRelativeWeek ?? 0) < 0;
        const employerPctThisWeek =
          employerPreBirth === "yes" && isPreBirthPhase
            ? employerPreBirthPctForEst
            : employerPct;
        weekEmployer = weeklySalary * (employerPctThisWeek / 100);
        employerPaidWeeks += 1;
        const employerTarget = Math.min(weekEmployer, weeklySalary);
        weekEmployerForDisplay = weekEmployer;
        if (employerIsTopUpMode) {
          if (weekSdi > 0) {
            weekEmployerForDisplay = Math.max(0, employerTarget - weekSdi);
          } else if (weekPfl > 0) {
            weekEmployerForDisplay = Math.max(0, employerTarget - weekPfl);
          } else {
            weekEmployerForDisplay = employerTarget;
          }
        }
        employerTotal += weekEmployerForDisplay;
      }
      if (w.streams.includes("Short‑term disability")) {
        const isPreBirthPhase = (w.birthRelativeWeek ?? 0) < 0;
        const stdPctThisWeek =
          stdPreBirth === "yes" && isPreBirthPhase
            ? stdPreBirthPctForEst
            : stdPctForEst;
        weekStd = weeklySalary * (stdPctThisWeek / 100);
        stdTotal += weekStd;
      }
      // SF PPLO tops up PFL to 100% of weekly salary
      let weekSfPplo = 0;
      if (w.streams.includes("SF PPLO")) {
        const baseWithoutPplo = Math.min(weekSdi + weekPfl + weekEmployerForDisplay + weekStd, weeklySalary);
        weekSfPplo = Math.max(0, weeklySalary - baseWithoutPplo);
        if (weekSfPplo > 0) {
          sfPploTotal += weekSfPplo;
          sfPploWeeks += 1;
        }
      }
      const grossPay = Math.min(weekSdi + weekPfl + weekEmployerForDisplay + weekStd + weekSfPplo, weeklySalary);
      const pctOfNormal = weeklySalary > 0 ? (grossPay / weeklySalary) * 100 : 0;
      const programs: string[] = [];
      if (w.streams.includes("State SDI") && weekSdi > 0) programs.push(sdiIncomeLabel);
      if (w.streams.includes("State PFL")) programs.push(pflIncomeLabel);
      if (w.streams.includes("Employer leave")) programs.push("Employer");
      if (w.streams.includes("Short‑term disability")) programs.push("STD");
      if (w.streams.includes("SF PPLO") && weekSfPplo > 0) programs.push("SF PPLO");
      totalLeaveIncomeCapped += grossPay;
      const sources: { label: string; amount: number; pct: number }[] = [];
      if (weekSdi > 0) sources.push({ label: sdiIncomeLabel, amount: weekSdi, pct: grossPay > 0 ? Math.round((weekSdi / grossPay) * 100) : 0 });
      if (weekPfl > 0) sources.push({ label: pflIncomeLabel, amount: weekPfl, pct: grossPay > 0 ? Math.round((weekPfl / grossPay) * 100) : 0 });
      if (weekEmployerForDisplay > 0) sources.push({ label: "Employer", amount: weekEmployerForDisplay, pct: grossPay > 0 ? Math.round((weekEmployerForDisplay / grossPay) * 100) : 0 });
      if (weekStd > 0) sources.push({ label: "STD", amount: weekStd, pct: grossPay > 0 ? Math.round((weekStd / grossPay) * 100) : 0 });
      if (weekSfPplo > 0) sources.push({ label: "SF PPLO", amount: weekSfPplo, pct: grossPay > 0 ? Math.round((weekSfPplo / grossPay) * 100) : 0 });
      weekRows.push({
        weekNumber: w.birthRelativeWeek ?? w.weekNumber,
        dateLabel: w.startDateLabel ?? `Week ${w.weekNumber}`,
        programs,
        grossPay,
        pctOfNormal,
        sources,
      });
    }

    const sdiWeeksForDisplay = activeTimelineForEstimator.filter((w) => w.streams.includes("State SDI")).length;
    const sdiPaidWeeksForDisplay = isCA && sdiWeeksForDisplay > 0 ? sdiWeeksForDisplay - 1 : sdiWeeksForDisplay;
    const sdiWeeklyForDisplay = isCA ? caWeeklyRate : (weeklySalary * 0.7);

    const concurrentBaseWeeks = sdiWeeksForDisplay + pflPaidWeeks;
    const sequentialBaseWeeks = concurrentBaseWeeks + employerWks;
    const leaveDurationWeeks = isConcurrentLike ? concurrentBaseWeeks : sequentialBaseWeeks;
    const totalLeaveIncome = totalLeaveIncomeCapped;
    const totalWeeks = activeTimelineForEstimator.length;
    const normalIncomeSamePeriod = weeklySalary * totalWeeks;
    const shortfall = normalIncomeSamePeriod - totalLeaveIncome;

    const stdWeeklyForDisplay =
      stdWeeksNumForDisplay > 0 && stdTotal > 0
        ? stdTotal / stdWeeksNumForDisplay
        : weeklySalary * (stdPctForEst / 100);

    return {
      sdiWeeks: sdiWeeksForDisplay,
      sdiPaidWeeks: sdiPaidWeeksForDisplay,
      sdiWeekly: sdiWeeklyForDisplay,
      sdiTotal,
      sfPploTotal,
      sfPploWeeks,
      pflWeeks: pflPaidWeeks,
      pflWeekly: isCA ? caWeeklyRate : Math.min(weeklySalary * 0.7, 1620),
      pflTotal,
      employerWeeks: employerPaidWeeks,
      employerWeekly:
        employerPaidWeeks > 0
          ? employerTotal / employerPaidWeeks
          : weeklySalary * (employerPct / 100),
      employerTotal,
      employerIsTopUpMode,
      stdWeeks: stdWeeksNumForDisplay,
      stdWeekly: stdWeeklyForDisplay,
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
    stateProgramLabels,
    employerLeavePayPercent,
    employerLeaveWeeks,
    stdPayPercent,
    stdCoverage,
    stdWeeks,
    employerPreBirth,
    employerPreBirthPayPercent,
    stdPreBirth,
    stdPreBirthPayPercent,
    coordination,
    employerRequiresConcurrent,
  ]);

  const incomeBarLegendSources = useMemo(() => {
    if (!incomeEstimator?.weekRows) return [];
    const labels = new Set<string>();
    for (const row of incomeEstimator.weekRows) {
      for (const s of row.sources) {
        if (s.amount > 0) labels.add(s.label);
      }
    }
    return [...labels].sort((a, b) => getIncomeSourceSortOrder(a) - getIncomeSourceSortOrder(b));
  }, [incomeEstimator]);

  const incomeSalaryBaseline = useMemo(() => {
    const annual = getAnnualFromSalary(salaryAmount, salaryFrequency);
    if (annual == null || annual <= 0) return null;
    const weeklyGross = Math.round(annual / 52);
    return {
      annualFormatted: annual.toLocaleString("en-US"),
      weeklyFormatted: weeklyGross.toLocaleString("en-US"),
    };
  }, [salaryAmount, salaryFrequency]);

  return (
    <main className="min-h-screen text-slate-900" style={{ background: "#F8FAFC" }}>
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

        {/* Assumptions disclaimer, shown until acknowledged */}
        {!assumptionsAcknowledged && (
          <section className="no-print mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-500 text-lg leading-none">⚠</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">This tool is currently designed for:</p>
                <div className="mt-2 space-y-1 text-xs text-amber-800">
                  {state === "CA" ? (
                    <>
                      <p>✓ W-2 employees currently employed full-time in California</p>
                      <p>✓ Birthing parents (pregnant women)</p>
                      <p>✓ People who have paid into CA SDI within the last 18 months</p>
                      <p>✓ Employees who have worked for their current employer for at least 12 months</p>
                      <p>✓ Employers with 5 or more employees</p>
                      <p>STD is estimated from the weeks and % you enter on the STD step (policies still vary — confirm with HR).</p>
                      <p className="mt-2 text-amber-700">If you were recently laid off, work part-time, are self-employed, or are a non-birthing parent — this tool may not fully apply to your situation yet. We&apos;re working on expanding coverage. <a href="https://edd.ca.gov" target="_blank" rel="noopener noreferrer" className="underline font-medium">Visit CA EDD directly</a> for the most complete information.</p>
                    </>
                  ) : state === "" ? (
                    <>
                      <p>✓ Full-time W-2 employees</p>
                      <p>✓ Birthing parents (pregnant women)</p>
                      <p>✓ Employees eligible for FMLA or state job protection</p>
                      <p>✓ Employer leave and STD estimated from your inputs</p>
                      <p className="mt-2 text-amber-700">Select your state below to see which programs apply to you.</p>
                    </>
                  ) : (
                    <>
                      <p>✓ Full-time W-2 employees</p>
                      <p>✓ Birthing parents (pregnant women)</p>
                      <p>✓ FMLA eligible employees (employer 50+ employees, 12+ months tenure, 1,250+ hours worked)</p>
                      <p>✓ Employer leave and STD estimated from your inputs</p>
                      {US_STATES_PAID_LEAVE_COMING_SOON.includes(state) ? (
                        <p className="mt-2 text-amber-700">{ALL_US_STATES.find((s) => s.code === state)?.name ?? state} has a paid leave program, but full support is not yet available in Leavigation. Results show FMLA + employer leave + STD only. <Link href="/leave-guide#notify" className="underline font-medium">Get notified when it launches →</Link></p>
                      ) : (
                        <p className="mt-2 text-amber-700">{ALL_US_STATES.find((s) => s.code === state)?.name ?? state} does not have a state paid leave program. This tool shows FMLA job protection + employer leave + STD only. <a href="https://www.dol.gov/agencies/whd/fmla" target="_blank" rel="noopener noreferrer" className="underline font-medium">Learn about FMLA at DOL.gov →</a></p>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssumptionsAcknowledged(true);
                    try {
                      gtag("event", "plan_started", { state_code: state || "unknown" });
                    } catch {}
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  This applies to me, continue →
                </button>
              </div>
            </div>
          </section>
        )}

        {scenario !== "" && (
        <section className="no-print mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-400 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
        )}

        <section className="flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {scenario === "" && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Which best describes your situation?</h2>
              <p className="mt-2 text-sm text-slate-600">We&apos;ll personalize your leave plan based on your employment status.</p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "employed_long" as const,
                    icon: "ti-briefcase",
                    badge: null,
                    color: { bg: "#E1F5EE", icon: "#0F6E56", pillBg: "#E1F5EE", pillText: "#085041", border: "#9FE1CB" },
                    title: "Employed 12+ months",
                    desc: "You're currently employed and will have been at your job for over a year by the time your baby arrives.",
                  },
                  {
                    key: "employed_short" as const,
                    icon: "ti-briefcase",
                    badge: "ti-clock",
                    color: { bg: "#EEEDFE", icon: "#534AB7", pillBg: "#EEEDFE", pillText: "#3C3489", border: "#CECBF6" },
                    title: "Employed under 12 months",
                    desc: "You're currently employed but will not have reached the 12-month mark by the time your baby arrives.",
                  },
                  {
                    key: "new_job" as const,
                    icon: "ti-calendar-plus",
                    badge: null,
                    color: { bg: "#FAEEDA", icon: "#854F0B", pillBg: "#FAEEDA", pillText: "#633806", border: "#FAC775" },
                    title: "Starting a new job soon",
                    desc: "You have a new job lined up but haven't started yet.",
                  },
                  {
                    key: "laid_off" as const,
                    icon: "ti-user-off",
                    badge: null,
                    color: { bg: "#FAECE7", icon: "#993C1D", pillBg: "#FAECE7", pillText: "#712B13", border: "#F5C4B3" },
                    title: "Laid off or not employed",
                    desc: "You were recently laid off or are not currently employed.",
                  },
                ].map((tile) => (
                  <button
                    key={tile.key}
                    type="button"
                    onClick={() => {
                      setScenario(tile.key);
                      if (tile.key === "laid_off") {
                        setFmlaEligible("no");
                        setEmployerLeaveOffered("no");
                      } else if (tile.key === "employed_long") {
                        setFmlaEligible("yes");
                      } else {
                        setFmlaEligible("no");
                      }
                    }}
                    className="flex flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                    style={{ borderColor: tile.color.border }}
                  >
                    <div className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: tile.color.bg }}>
                      <i className={`ti ${tile.icon}`} style={{ color: tile.color.icon }} aria-hidden="true" />
                      {tile.badge && (
                        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white" style={{ background: tile.color.bg }}>
                          <i className={`ti ${tile.badge}`} style={{ color: tile.color.icon, fontSize: "10px" }} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tile.title}</p>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{tile.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: tile.color.pillBg, color: tile.color.pillText }}>
                      Build my plan <i className="ti ti-arrow-right text-xs" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-400">Not sure? Start with your best guess — you can adjust later.</p>
            </div>
          )}
          {scenario !== "" && (
          <>
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
                  {state !== "" && state !== "CA" && (
                    <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      {US_STATES_PAID_LEAVE_COMING_SOON.includes(state)
                        ? <>✨ We&apos;re building full {ALL_US_STATES.find((s) => s.code === state)?.name} support now. In the meantime, your plan includes FMLA job protection, employer leave, and any private STD coverage you have. <Link href="/leave-guide#notify" className="underline font-medium hover:text-blue-900">Get notified when it launches →</Link></>
                        : <>{ALL_US_STATES.find((s) => s.code === state)?.name} doesn&apos;t have a state paid leave program — your plan is built around FMLA job protection, employer leave, and any private STD coverage you have. That&apos;s still a complete picture of your leave.</>
                      }
                    </div>
                  )}
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
                    <option value="" disabled>Select your state...</option>
                    {ALL_US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}{US_STATES_PAID_LEAVE_COMING_SOON.includes(s.code) ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {state !== "" && <StateProgramsReference stateCode={state} />}

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

                {state !== "" && hasPreBirthOption && (
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
                          <span className="text-sm text-slate-700">Yes, 4 weeks before due date or less (standard)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="caPreBirth"
                            checked={caPreBirthLeave === "yes_extended"}
                            onChange={() => setCaPreBirthLeave("yes_extended")}
                            className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
                          />
                          <span className="text-sm text-slate-700">Yes, more than 4 weeks (complications)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="caPreBirth"
                            checked={caPreBirthLeave === "no"}
                            onChange={() => setCaPreBirthLeave("no")}
                            className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
                          />
                          <span className="text-sm text-slate-700">No, I plan to start leave at birth</span>
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
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${recentMover === "yes" ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRecentMover("no"); setMoverMoveDate(""); setMoverWorkLocation(""); setMoverPayrollUpdated(""); setMoverNotifiedEmployer(""); }}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${recentMover === "no" ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
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
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${moverWorkLocation === opt.value ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
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
                                  onClick={() => { setMoverPayrollUpdated(opt.value); if (opt.value !== "no" && opt.value !== "not_sure") setMoverNotifiedEmployer(""); }}
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${moverPayrollUpdated === opt.value ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            {isMoverSelfEmployed && (
                              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                Self-employed individuals are generally not automatically covered by state paid leave programs. Some states offer voluntary enrollment, in California, you can apply for Disability Insurance Elective Coverage (DIEC) through EDD, but enrollment must happen before you need the benefit. Given your timeline, contact EDD directly to explore your options.
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
                                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition ${moverNotifiedEmployer === opt.value ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
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

          {step === 3 && (
            <div className="space-y-8">
              <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Legal protections and company policies
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                These questions help us understand what job protections and employer benefits you have.
              </p>

              <div className="mt-6 space-y-6">
                {/* FMLA ELIGIBILITY QUESTION, hidden for now, tool is scoped to full-time employees
                    TODO: Re-enable when expanding to part-time, contractor, and self-employed flows
                    When re-enabling, also re-activate employment start date input (queue item 6d)
                <div>
                  ... FMLA question JSX here ...
                </div>
                */}

                {scenario === "employed_short" && (
                  <div>
                    <div className="text-sm font-medium text-slate-700">When did you start your current job?</div>
                    <p className="mt-1 text-xs text-slate-500">We&apos;ll use this to calculate when FMLA and CFRA protections kick in relative to your due date.</p>
                    <input
                      type="date"
                      className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      value={employmentStartDate}
                      onChange={(e) => setEmploymentStartDate(e.target.value)}
                    />
                  </div>
                )}

                {scenario === "new_job" && (
                  <div>
                    <div className="text-sm font-medium text-slate-700">When do you start your new job?</div>
                    <p className="mt-1 text-xs text-slate-500">We&apos;ll use this to calculate when employer benefits and FMLA protections become available relative to your due date.</p>
                    <input
                      type="date"
                      className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      value={employmentStartDate}
                      onChange={(e) => setEmploymentStartDate(e.target.value)}
                    />
                  </div>
                )}

                {scenario === "laid_off" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">CA SDI and PFL are based on past wages, not current employment.</p>
                    <p className="mt-1 text-xs text-amber-800">You may still be eligible for CA SDI and PFL even if you were recently laid off. Your eligibility is based on wages earned in your base period. Job protection programs (FMLA, PDL, CFRA) may still apply depending on your separation terms — consult an employment attorney for your specific situation.</p>
                  </div>
                )}

                {scenario !== "laid_off" && scenario !== "new_job" && (
                <>
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

              {/* Employer leave details, show when employer leave = yes */}
              {employerLeaveOffered !== "no" && employerLeaveOffered !== "" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Employer leave details</h3>
                    <p className="mt-1 text-xs text-slate-500">Tell us about your employer&apos;s parental leave policy.</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      How many weeks of employer parental leave after birth?
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                        placeholder="e.g., 6"
                        value={employerLeaveWeeks}
                        onChange={(e) => setEmployerLeaveWeeks(e.target.value)}
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      At what % of your pay?
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                          placeholder="e.g., 100"
                          value={employerLeavePayPercent}
                          onChange={(e) => setEmployerLeavePayPercent(e.target.value.replace(/[^0-9]/g, ""))}
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-700">Does your employer allow parental leave to start before birth?</div>
                    <p className="mt-1 text-xs text-slate-500">Some employers allow you to start leave 1 to 4 weeks before your due date.</p>
                    <div className="mt-3 flex gap-3">
                      {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEmployerPreBirth(opt.value as "yes" | "no")}
                          className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                            employerPreBirth === opt.value
                              ? "border-sky-400 bg-sky-50 text-sky-900"
                              : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {employerPreBirth === "yes" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          How many weeks before your due date?
                          <input
                            type="number"
                            min={1}
                            max={8}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="e.g. 2"
                            value={employerPreBirthWeeks}
                            onChange={(e) => setEmployerPreBirthWeeks(e.target.value)}
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          At what % of your pay?
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              placeholder="e.g. 100"
                              value={employerPreBirthPayPercent}
                              onChange={(e) => setEmployerPreBirthPayPercent(e.target.value.replace(/[^0-9]/g, ""))}
                            />
                            <span className="text-sm text-slate-500">%</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      Does your employer leave run at the same time as {state === "CA" ? "state leave" : "FMLA"}, or after?
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Some employers let you stack leaves so they run one after another. Others require that they run at the same time.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setCoordination("concurrent")}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${coordination === "concurrent" ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
                      >
                        At the same time (concurrent)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoordination("sequential")}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${coordination === "sequential" ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
                      >
                        One after another (sequential)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoordination("unsure")}
                        className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${coordination === "unsure" ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"}`}
                      >
                        I&apos;m not sure
                      </button>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employerRequiresConcurrent}
                        onChange={(e) => setEmployerRequiresConcurrent(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-xs text-slate-600">My employer requires that I use my leave at the same time (I cannot run employer leave after {state === "CA" ? "state leave" : "FMLA"} ends)</span>
                    </label>
                  </div>
                </div>
              )}
                </>
                )}
              </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                What is your current pre-tax salary?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {state === "CA"
                  ? "Used to estimate your SDI, PFL, and employer leave income. This is optional. We don\u2019t store or share your salary. It stays on your device and is only used to calculate your estimated pay during leave."
                  : "Used to estimate your employer leave and STD income. This is optional. We don\u2019t store or share your salary. It stays on your device and is only used to calculate your estimated pay during leave."}
              </p>

              {/* Max benefit callout, CA only */}
              {state === "CA" && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
                  <span className="mt-0.5 shrink-0 text-sky-400">ℹ</span>
                  <div className="flex-1">
                    <span className="font-semibold">Earning $91,780+/year?</span> You&apos;ll receive the maximum CA state benefit of <span className="font-semibold">$1,765/week</span>, but we still need your actual salary to calculate SF PPLO accurately.
                  </div>
                </div>
              )}
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
              {/* SDI calculation explainer, CA only */}
              {state === "CA" && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setSdiExplainerOpen((v) => !v)}
                    className="flex items-center gap-2 text-xs font-medium text-sky-700 hover:text-sky-900 transition"
                  >
                    <span className={`transition-transform ${sdiExplainerOpen ? "rotate-90" : ""}`}>▶</span>
                    How does CA SDI calculate my benefit?
                  </button>
                  {sdiExplainerOpen && (
                    <div className="mt-3 rounded-xl border-l-4 border-sky-300 bg-sky-50 px-4 py-3 text-xs text-sky-900 space-y-2">
                      <p><span className="font-semibold">CA SDI uses your highest-earning quarter</span> from your base period (roughly the 12 months before your claim), not your current salary. If you recently changed jobs or had a gap in employment, your benefit may be lower than expected.</p>
                      <p><span className="font-semibold">Benefit rate:</span> If your weekly wage is <span className="font-semibold">$1,252 or less</span> (70% of the 2026 SAWW), you receive <span className="font-semibold">90%</span> of your weekly wage. Above that threshold, you receive <span className="font-semibold">70%</span> of your weekly wage.</p>
                      <p><span className="font-semibold">Maximum benefit:</span> $1,765/week (2026 cap). You hit this cap at roughly $91,780/year.</p>
                      <p><span className="font-semibold">Waiting period:</span> CA SDI has a 7-day unpaid waiting period. Week 1 of disability pays $0 unless your employer or STD policy covers it.</p>
                      <p className="text-sky-700 italic">This tool uses your current salary as a proxy. For the most accurate estimate, use your base period wages.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Short-term disability
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Short-term disability (STD) is private insurance that pays a portion of your salary when you can&apos;t work due to pregnancy or recovery from childbirth. It is separate from state SDI.
              </p>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Do you have short-term disability coverage?</span>
                    <button
                      type="button"
                      onClick={() => setStdExplainerOpen((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700 border border-sky-200 hover:bg-sky-100 transition"
                    >
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-600 text-white text-[9px] font-semibold">i</span>
                      What&apos;s this?
                    </button>
                  </div>
                  {stdExplainerOpen && (
                    <div className="mt-2 border-l-2 border-sky-300 bg-sky-50 rounded-r-xl px-4 py-3 text-xs text-slate-700 space-y-2">
                      <p><span className="font-semibold">Short-term disability (STD)</span> is private insurance, separate from any state program, that pays a portion of your salary when you can&apos;t work due to a medical condition, including pregnancy and childbirth recovery.</p>
                      <p>There are 2 ways you might have it: (1) your employer includes it as part of your benefits package, or (2) you purchased a policy independently through a private insurer (e.g. The Hartford, Cigna, MetLife, Unum).</p>
                      {state === "CA" && <p>CA SDI is mandatory and separate from STD. If you have both, STD often covers the 7-day CA SDI waiting period so week 1 is not $0.</p>}
                      {state !== "CA" && <p>In states without a state disability program, STD is your primary source of income during pregnancy recovery. Without it, recovery weeks are typically unpaid.</p>}
                      <p><span className="font-semibold">Not sure?</span> Check your benefits portal, offer letter, or ask HR. Search for &quot;short-term disability&quot; or &quot;income protection.&quot;</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500">This might be through your employer or a separate plan you purchased.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Not sure" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStdCoverage(option.value as "yes" | "no" | "unsure")}
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

                {stdCoverage === "yes" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        How many weeks does your STD cover after birth?
                        <input
                          type="number"
                          min={0}
                          max={26}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          placeholder="e.g. 6"
                          value={stdWeeks}
                          onChange={(e) => setStdWeeks(e.target.value)}
                        />
                        <span className="mt-1 block text-xs text-slate-400">Typically 6 to 12 weeks. Check your policy.</span>
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        At what % of your pay?
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="e.g. 60"
                            value={stdPayPercent}
                            onChange={(e) => setStdPayPercent(e.target.value.replace(/[^0-9]/g, ""))}
                          />
                          <span className="text-sm text-slate-500">%</span>
                        </div>
                        <span className="mt-1 block text-xs text-slate-400">Most STD policies pay 60% of salary.</span>
                      </label>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-slate-700">Can your STD coverage start before birth if medically necessary?</div>
                      <p className="mt-1 text-xs text-slate-500">e.g. bed rest, complications, or doctor&apos;s orders before your due date</p>
                      <div className="mt-3 flex gap-3">
                        {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStdPreBirth(opt.value as "yes" | "no")}
                            className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                              stdPreBirth === opt.value
                                ? "border-sky-400 bg-sky-50 text-sky-900"
                                : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {stdPreBirth === "yes" && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700">
                            At what % of your pay does STD cover pre-birth leave?
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                placeholder="e.g. 60"
                                value={stdPreBirthPayPercent}
                                onChange={(e) => setStdPreBirthPayPercent(e.target.value.replace(/[^0-9]/g, ""))}
                              />
                              <span className="text-sm text-slate-500">%</span>
                            </div>
                            <span className="mt-1 block text-xs text-slate-400">Often the same as your post-birth STD rate.</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-slate-700">How does your STD interact with your employer leave?</div>
                      <p className="mt-1 text-xs text-slate-500">This affects how your income is calculated when both are active at the same time.</p>
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => setStdCoordinatesWithEmployer("supplement")}
                          className={`block w-full rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                            stdCoordinatesWithEmployer === "supplement"
                              ? "border-sky-400 bg-sky-50 text-sky-900"
                              : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-medium">STD supplements employer leave, total capped at 100%</div>
                          <div className="mt-0.5 text-xs text-slate-500">Example: Employer pays 60% + STD pays up to 40% to fill the gap. You receive 100% of your salary total, not 160%.</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStdCoordinatesWithEmployer("replace")}
                          className={`block w-full rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                            stdCoordinatesWithEmployer === "replace"
                              ? "border-sky-400 bg-sky-50 text-sky-900"
                              : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-medium">STD and employer leave are independent, both pay their full amounts</div>
                          <div className="mt-0.5 text-xs text-slate-500">Example: Employer pays 60% AND STD separately pays 60%. You may receive more than 100% of your normal salary. Less common, check your policy.</div>
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Not sure? Most employer STD policies coordinate (cap at 100%). Check your benefits portal or ask HR.</p>
                    </div>

                    {state === "CA" && (
                      <div>
                        <div className="text-sm font-medium text-slate-700">Does your STD cover the CA SDI 7-day waiting period (week 1)?</div>
                        <p className="mt-1 text-xs text-slate-500">Many STD policies are designed to cover this gap so you receive income from day 1.</p>
                        <div className="mt-3 flex gap-3">
                          {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStdCoversWaitingPeriod(opt.value as "yes" | "no" | "unsure")}
                              className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                                stdCoversWaitingPeriod === opt.value
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
            </div>
          )}

          {step === 5 && (displayTimeline ?? timeline) && (
            <div className="print-results-full-width flex w-full flex-col gap-6">
              {/* Condensed assumptions reminder, visible on screen and in PDF */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                <span className="text-amber-500">⚠</span>
                <span className="font-semibold text-amber-900">Results for {ALL_US_STATES.find((s) => s.code === state)?.name ?? state}, based on these assumptions:</span>
                {state === "CA" ? (
                  <>
                    <span>Full-time {ALL_US_STATES.find((s) => s.code === state)?.name ?? state} W-2 employee</span>
                    <span className="text-amber-300">·</span>
                    <span>Paid into CA SDI in last 18 months</span>
                    <span className="text-amber-300">·</span>
                    <span>Employed 12+ months</span>
                    <span className="text-amber-300">·</span>
                    <span>Employer 5+ employees</span>
                    <span className="text-amber-300">·</span>
                    <span>Birthing parent</span>
                    <span className="text-amber-300">·</span>
                    <span>STD from your inputs when you select coverage</span>
                    <span className="text-amber-300">·</span>
                    <a href="https://edd.ca.gov" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-amber-900">Not your situation? Visit CA EDD →</a>
                  </>
                ) : (
                  <>
                    <span>Full-time {ALL_US_STATES.find((s) => s.code === state)?.name ?? state} W-2 employee</span>
                    <span className="text-amber-300">·</span>
                    <span>FMLA eligible (employer 50+ employees, 12+ months tenure, 1,250+ hours)</span>
                    <span className="text-amber-300">·</span>
                    <span>Birthing parent</span>
                    <span className="text-amber-300">·</span>
                    <span>STD from your inputs when you select coverage</span>
                    <span className="text-amber-300">·</span>
                    <a href="https://www.dol.gov/agencies/whd/fmla" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-amber-900">Not your situation? Visit DOL FMLA →</a>
                  </>
                )}
              </div>
              {state !== "CA" && US_STATES_PAID_LEAVE_COMING_SOON.includes(state) && (() => {
                const missingPrograms: Record<string, { programs: string[]; note: string }> = {
                  NY: {
                    programs: ["NY Disability Benefits Law (DBL) — 50% of wages, max $170/wk, 6–8 weeks recovery", "NY Paid Family Leave (PFL) — 67% of wages, max $1,228/wk, 12 weeks bonding"],
                    note: "Both filed through your employer's insurance carrier, not a state agency.",
                  },
                  NJ: {
                    programs: ["NJ Temporary Disability Insurance (TDI) — 85% of wages, max $1,119/wk, 6–8 weeks recovery", "NJ Family Leave Insurance (FLI) — 85% of wages, max $1,119/wk, 12 weeks bonding"],
                    note: "NJ TDI and FLI are among the most generous state programs in the US.",
                  },
                  WA: {
                    programs: ["WA Paid Family & Medical Leave — up to 90% of wages, max $1,647/wk, covers both recovery and bonding (up to 18 weeks combined)"],
                    note: "Single combined program — no separate disability and bonding claims.",
                  },
                  MA: {
                    programs: ["MA Paid Family and Medical Leave (PFML) — tiered rate up to 80%+, max $1,230/wk, up to 20 weeks medical + 12 weeks bonding"],
                    note: "Single combined program. 7-day waiting period waived for bonding if following medical leave.",
                  },
                  CT: {
                    programs: ["CT Paid Leave — up to 95% of minimum wage + 60% above, max $1,016/wk, 12 weeks bonding + medical"],
                    note: "Applies to employers with 1+ employees.",
                  },
                  CO: {
                    programs: ["CO Family and Medical Leave Insurance (FAMLI) — 90% of wages up to 50% of state avg, then 50% above, max $1,381/wk, 12 weeks"],
                    note: "Covers both medical recovery and bonding.",
                  },
                  OR: {
                    programs: ["OR Paid Leave — 60% of wages up to 65% of state avg, then 5% above, max $1,523/wk, 12 weeks bonding + 12 weeks medical"],
                    note: "Applies to employers with 25+ employees.",
                  },
                  RI: {
                    programs: ["RI Temporary Disability Insurance (TDI) — 4.62% of highest quarter wages, max $1,103/wk, up to 30 weeks recovery", "RI Temporary Caregiver Insurance (TCI) — same rate, 8 weeks bonding"],
                    note: "RI TDI was the first state disability program in the US (1942).",
                  },
                  MN: {
                    programs: ["MN Paid Leave — 3-tier rate (90%/66%/55%), max $1,423/wk, up to 12 weeks medical + 12 weeks bonding (20 weeks combined)"],
                    note: "Brand new program — launched January 2026. No waiting period.",
                  },
                  DE: {
                    programs: ["DE Paid Leave — 80% of wages, max $900/wk, 12 weeks parental leave per year"],
                    note: "Brand new program — launched January 2026. Employer-administered.",
                  },
                  MD: {
                    programs: ["MD Family and Medical Leave Insurance (FAMLI) — 90% up to 65% of state avg, then 50% above, max $1,000/wk, 12 weeks bonding + 12 weeks medical"],
                    note: "Not yet active — benefits begin January 2028.",
                  },
                  HI: {
                    programs: ["HI Temporary Disability Insurance (TDI) — 58% of wages, max $871/wk, up to 26 weeks"],
                    note: "Employer-provided through private carriers or self-insurance. No state bonding pay program.",
                  },
                };
                const info = missingPrograms[state];
                const stateName = ALL_US_STATES.find((s) => s.code === state)?.name ?? state;
                return (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-xs text-purple-900">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">⚠️</span>
                      <div className="space-y-2 flex-1">
                        <div className="font-semibold text-sm text-purple-900">
                          {stateName} has state paid leave programs not yet included in the Leavigation results below
                        </div>
                        <p className="text-purple-700">Your results below show FMLA + employer leave + STD only. The following {stateName} programs are missing from this estimate:</p>
                        {info ? (
                          <>
                            <ul className="space-y-1 mt-1">
                              {info.programs.map((p, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-400 shrink-0">•</span>
                                  <span className="font-medium">{p}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-purple-600 italic mt-1">{info.note}</p>
                          </>
                        ) : (
                          <p className="font-medium">State paid leave programs are not yet modeled for {stateName}.</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-purple-200">
                          <span className="text-purple-600">Your actual leave income will likely be higher than shown below once {stateName} state programs are built into Leavigation.</span>
                          <Link href="/leave-guide#notify" className="shrink-0 rounded-full bg-purple-500 px-3 py-1.5 text-white font-medium hover:bg-purple-600 transition">Get notified →</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {!US_STATES_SUPPORTED.includes(state) && !US_STATES_PAID_LEAVE_COMING_SOON.includes(state) && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
                  <span className="text-blue-500">ℹ</span>
                  <span className="font-semibold">{ALL_US_STATES.find((s) => s.code === state)?.name ?? state} does not have a state paid leave program.</span>
                  <span>Income during leave comes from your employer and any private STD coverage you have. FMLA provides 12 weeks of unpaid job protection only.</span>
                  <a href="https://www.dol.gov/agencies/whd/fmla" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-blue-900">Learn more at DOL.gov →</a>
                </div>
              )}
              {/* FMLA cliff warning, show when pre-birth leave causes FMLA to exhaust before PDL ends */}
              {fmlaEligible === "yes" &&
                state === "CA" &&
                (caPreBirthLeave === "yes_standard" || caPreBirthLeave === "yes_extended") && (
                <div className="no-print flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-900">
                  <span className="mt-0.5 text-orange-500 text-base leading-none shrink-0">⚠️</span>
                  <div>
                    <p className="font-semibold text-orange-900">Your FMLA protection ends earlier than you might expect.</p>
                    <p className="mt-1 text-orange-800">Because you&apos;re taking leave before your due date, your 12-week FMLA clock starts now, not at birth. Your federal job protection ends 12 weeks from your first day of leave, which may be before your pregnancy disability leave (PDL) ends. California&apos;s PDL and CFRA will continue to protect your job after FMLA ends, but it&apos;s important to know the federal protection ends early.</p>
                  </div>
                </div>
              )}

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
                  {(() => {
                    const tl = (displayTimeline ?? timeline) as WeekInfo[] | null;
                    if (!tl || tl.length === 0) return null;
                    const lastActive = Math.max(0, ...tl.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                    if (lastActive === 0) return null;
                    const fullyPaidWeeks = tl.filter((w) => w.weekNumber <= lastActive && w.payPercent >= 95).length;
                    return (
                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-6 py-3 ring-1 ring-slate-200">
                          <span className="text-3xl font-bold text-slate-900">🎉 {lastActive}</span>
                          <span className="mt-1 text-xs font-medium text-slate-500">total leave weeks</span>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-50 px-6 py-3 ring-1 ring-emerald-200">
                          <span className="text-3xl font-bold text-emerald-700">{fullyPaidWeeks}</span>
                          <span className="mt-1 text-xs font-medium text-emerald-600">fully paid weeks</span>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-rose-50 px-6 py-3 ring-1 ring-rose-200">
                          <span className="text-3xl font-bold text-rose-600">{lastActive - fullyPaidWeeks}</span>
                          <span className="mt-1 text-xs font-medium text-rose-400">weeks at reduced or no pay</span>
                        </div>
                      </div>
                    );
                  })()}
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

              {/* Gantt-style timeline */}
              <div className="w-full space-y-3">
                <div className="text-xs font-medium text-slate-700">Leave types over time</div>
                <div className="gantt-container gantt-print-area w-full overflow-x-auto">
                  <div className="w-max min-w-full rounded-xl border border-slate-200 bg-white p-3">
                    {(() => {
                      const fullTimeline = (displayTimeline ?? timeline) as WeekInfo[];
                      const lastActiveWeek = fullTimeline.length === 0 ? 0 : Math.max(0, ...fullTimeline.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                      const activeTimeline = fullTimeline.filter((w) => w.weekNumber <= lastActiveWeek);
                      const { preWeeks, postWeeks, showBirthDivider, gridStyle } =
                        getGanttWeekPartitions(activeTimeline);
                      return (
                        <>
                    <div className="gantt-header-row gantt-grid grid grid-flow-col gap-1 text-[10px] text-slate-500" style={gridStyle}>
                      <div className="gantt-label-col min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right text-[11px] font-medium text-slate-600 flex items-center overflow-hidden min-h-12 sticky left-0 bg-white z-10">
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
                      const { preWeeks, postWeeks, showBirthDivider, gridStyle } =
                        getGanttWeekPartitions(activeTimeline);
                      return (
                        <div className="mt-2 border-y border-slate-300 py-1 gantt-grid grid grid-flow-col gap-1 text-[10px]" style={gridStyle}>
                          <div className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-semibold text-[11px] text-slate-700 flex items-center overflow-hidden sticky left-0 bg-white z-10">
                            Summary
                          </div>
                          {showBirthDivider ? (
                            <>
                              {preWeeks.map((week) => (
                                <button
                                  key={`summary-pre-${week.weekNumber}`}
                                  type="button"
                                  onClick={() => setSelectedWeek(week.weekNumber)}
                                  className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryCellClassName(week, true)} ${week.isPast ? "opacity-60" : ""}`}
                                >
                                  {formatGanttWeekLabel(week, isCaSdiWaitingPeriodWeek(week, state))}
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
                                  className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryCellClassName(week, false)} ${week.isPast ? "opacity-60" : ""}`}
                                >
                                  {formatGanttWeekLabel(week, isCaSdiWaitingPeriodWeek(week, state))}
                                </button>
                              ))}
                            </>
                          ) : (
                            activeTimeline.map((week) => (
                              <button
                                key={`summary-${week.weekNumber}`}
                                type="button"
                                onClick={() => setSelectedWeek(week.weekNumber)}
                                className={`flex h-9 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${getSummaryCellClassName(week, false)} ${week.isPast ? "opacity-60" : ""}`}
                              >
                                {formatGanttWeekLabel(week, isCaSdiWaitingPeriodWeek(week, state))}
                              </button>
                            ))
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const stateLeave = getStateLeave(
                        US_STATES_PAID_LEAVE_COMING_SOON.includes(state) ? "DEFAULT" : (state || "DEFAULT")
                      );
                      const fullTimeline = (displayTimeline ?? timeline) as WeekInfo[];
                      const lastActiveWeek = fullTimeline.length === 0 ? 0 : Math.max(0, ...fullTimeline.map((w) => (w.streams.length > 0 || w.protectedByCfra ? w.weekNumber : 0)));
                      const activeTimeline = fullTimeline.filter((w) => w.weekNumber <= lastActiveWeek);
                      const { preWeeks, postWeeks, showBirthDivider, gridStyle } =
                        getGanttWeekPartitions(activeTimeline);
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
                        } else if (stateLeave.stateProtection?.available && stateLeave.hasProtectionBeyondFMLA) {
                          rows.push("CFRA");
                        } else {
                          excludedRows.push("No state protection beyond FMLA");
                        }

                        if (stateLeave.sdi?.available) {
                          rows.push("State SDI");
                        } else {
                          excludedRows.push("State SDI (no state program)");
                        }
                        if (stateLeave.pfl?.available) {
                          rows.push("State PFL");
                        } else {
                          excludedRows.push("State PFL (no state program)");
                        }

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
                      const excludedFootnoteRows = excludedRows.filter((r) => r !== "No state protection beyond FMLA");
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
                            {formatGanttWeekLabel(week, false)}
                          </button>
                        );
                      };
                      const renderStreamCell = (week: WeekInfo, isPreBirth: boolean, stream: WeekStream | "PDL") => {
                        const isPdlRow = stream === "PDL";
                        const isCfraBoundaryWeek = state === "CA" && week.weekNumber === pflStartWeek;
                        const isPdlActive = isPdlRow && week.weekNumber <= pdlEndWeek;
                        const isActive = isPdlRow
                          ? isPdlActive
                          : stream === "State PFL"
                            ? week.streams.includes("State PFL") && !week.streams.includes("State SDI")
                            : isStdGanttStream(stream)
                              ? isStdStreamActiveInGantt(week, isPreBirth, stdCoverage, stdPreBirth)
                              : week.streams.includes(stream as WeekStream);
                        const isJobProtectionRow = stream === "FMLA" || stream === "PDL";
                        const isPaidLeaveRow = !isJobProtectionRow;
                        let color = "bg-slate-100 border border-slate-200 text-slate-500";

                        if (isActive) {
                          if (isJobProtectionRow) {
                            color = "bg-purple-400/70 border border-purple-500 text-purple-950";
                          } else {
                            const isSdiFirstWeekWaitingPeriod =
                              stream === "State SDI" && isCaSdiWaitingPeriodWeek(week, state);
                            if (isSdiFirstWeekWaitingPeriod) {
                              color = "bg-emerald-50 border border-emerald-300 text-emerald-800";
                            } else if (isStdGanttStream(stream)) {
                              const stdActive = isStdStreamActiveInGantt(
                                week,
                                isPreBirth,
                                stdCoverage,
                                stdPreBirth
                              );
                              if (!stdActive) {
                                color = "bg-slate-100 border border-slate-200 text-slate-500";
                              } else {
                                color =
                                  week.payPercent > 0
                                    ? "bg-emerald-400/70 border border-emerald-500 text-emerald-950"
                                    : "bg-emerald-100/70 border border-emerald-300 text-emerald-900";
                              }
                            } else {
                              const hasPay = week.payPercent > 0;
                              const employerPayPct = parseFloat(employerLeavePayPercent) || 0;
                              const streamHasPay =
                                stream === "Employer leave" ? employerPayPct > 0 : hasPay;
                              if (stream === "State SDI" && isActive) {
                                color = "bg-emerald-400/70 border border-emerald-500 text-emerald-950";
                              } else if (streamHasPay) {
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
                        const isSdiWaitingWeek =
                          stream === "State SDI" && isCaSdiWaitingPeriodWeek(week, state);
                        const usePreBirthIndigo = !isJobProtectionRow && !isSdiWaitingWeek;
                        const preBirthInactiveBg = usePreBirthIndigo && isPreBirth && !isActive ? "bg-indigo-50" : "";
                        const preBirthActiveRing = usePreBirthIndigo && isPreBirth && isActive ? "ring-1 ring-inset ring-indigo-200/50" : "";
                        const preBirthRelativeBg =
                          usePreBirthIndigo &&
                          week.birthRelativeWeek !== undefined &&
                          week.birthRelativeWeek < 0 &&
                          !isActive
                            ? "bg-indigo-50"
                            : "";

                        return (
                          <button
                            type="button"
                            key={`${stream}-${week.weekNumber}`}
                            onClick={() => setSelectedWeek(week.weekNumber)}
                            title={cfraBoundaryTitle ?? (isPdlRow && isPdlActive ? "Job protection only; pay from SDI row" : undefined)}
                            className={`flex h-7 items-center justify-center rounded-md text-[10px] transition hover:opacity-90 ${color} ${preBirthInactiveBg} ${preBirthActiveRing} ${preBirthRelativeBg} ${cfraBoundaryClass} ${week.isPast ? "opacity-60" : ""}`}
                          >
                            {formatGanttWeekLabel(
                              week,
                              stream === "State SDI" && isCaSdiWaitingPeriodWeek(week, state)
                            )}
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
                                  <div className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-medium text-slate-600 flex items-center overflow-hidden sticky left-0 bg-white z-10">
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
                                    activeTimeline.map((week) =>
                                      renderCfraCell(week, isGanttPreBirthWeek(week))
                                    )
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
                                    className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-medium text-slate-600 flex items-center overflow-hidden sticky left-0 bg-white z-10"
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
                                    activeTimeline.map((week) =>
                                      renderStreamCell(week, isGanttPreBirthWeek(week), stream)
                                    )
                                  )}
                                </div>
                              );
                            }
                            return elements;
                          })}
                          {!stateLeave.hasProtectionBeyondFMLA && state !== "CA" && (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] text-slate-600">
                              {US_STATES_PAID_LEAVE_COMING_SOON.includes(state)
                                ? `${ALL_US_STATES.find((s) => s.code === state)?.name ?? state} has state paid leave programs not yet built into Leavigation. Results show FMLA + employer leave + STD only.`
                                : `${ALL_US_STATES.find((s) => s.code === state)?.name ?? state} does not have a state paid leave program. This view shows FMLA job protection + employer leave + STD only.`
                              }
                            </div>
                          )}
                          {city === "San Francisco" && (
                            <p className="mt-2 text-xs text-slate-500 px-1">
                              * SF Paid Parental Leave Ordinance (SF PPLO) tops up CA PFL to 100% of your weekly salary during bonding weeks where CA PFL is your only pay source. Weeks where employer leave or SDI already covers a portion of your pay may receive a partial or no top-up.
                            </p>
                          )}
                          {state === "CA" &&
                            activeTimeline.some((w) => isCaSdiWaitingPeriodWeek(w, state)) && (
                            <p className="mt-1 text-xs text-slate-500 px-1">
                              ‡ California SDI has a 7-day unpaid waiting period. SDI payments begin the week after your first week of disability leave.
                            </p>
                          )}
                          {excludedFootnoteRows.length > 0 && !US_STATES_PAID_LEAVE_COMING_SOON.includes(state) && (
                            <p className="mt-1 text-xs text-slate-400 px-1">
                              † Not shown: {excludedFootnoteRows.join(", ")}. These rows are hidden because they do not apply to your situation.
                            </p>
                          )}
                          {parseFloat(employerLeavePayPercent) === 0 && parseFloat(employerLeaveWeeks) > 0 && (
                            <p className="mt-1 text-xs text-slate-400 px-1">
                              ‡‡ Your employer leave is shown in a lighter shade because it provides job protection only, no additional pay during these weeks.
                            </p>
                          )}
                        </>
                      );
                    })()}
              </div>
              </div>
              </div>

              {/* Estimated Leave Income card, always render both prompt and breakdown in DOM; show one via visibility for reliable print */}
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
                              <td className="py-2 pr-2 text-slate-700">{stateProgramLabels.sdi ?? "State disability"} (pregnancy disability)</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.sdiPaidWeeks} weeks × ${Math.round(incomeEstimator.sdiWeekly)}/week = ${incomeEstimator.sdiTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.pflTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">{stateProgramLabels.pfl ?? "State paid leave"} (bonding)</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.pflWeeks} weeks × ${Math.round(incomeEstimator.pflWeekly)}/week = ${incomeEstimator.pflTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.sfPploTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">SF PPLO top-up</td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {incomeEstimator.sfPploWeeks} weeks × ${Math.round(incomeEstimator.sfPploTotal / incomeEstimator.sfPploWeeks)}/week = ${incomeEstimator.sfPploTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          )}
                          {incomeEstimator.employerTotal > 0 && (
                            <tr>
                              <td className="py-2 pr-2 text-slate-700">
                                {incomeEstimator.employerIsTopUpMode ? "Employer leave (top-up)" : "Employer leave"}
                              </td>
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
                        <p className="text-[11px] text-slate-500 leading-snug">Employer leave: paid as regular wages, federal and {state === "CA" ? "CA" : "applicable"} state taxes apply.</p>
                      )}
                      {incomeEstimator.stdTotal > 0 && (
                        <p className="text-[11px] text-slate-500">STD: tax treatment depends on who paid your premiums, check with HR.</p>
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
                            <div className="mb-3">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                {incomeBarLegendSources.map((label) => (
                                  <div key={label} className="flex items-center gap-1.5">
                                    <span
                                      className="shrink-0"
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        backgroundColor: getIncomeSourceBarColor(label),
                                      }}
                                    />
                                    <span className="text-xs text-slate-500">
                                      {getIncomeSourceLegendLabel(label)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center gap-1.5">
                                  <svg width="20" height="6" className="shrink-0" aria-hidden>
                                    <line
                                      x1="0"
                                      y1="3"
                                      x2="20"
                                      y2="3"
                                      stroke="#E24B4A"
                                      strokeWidth="1.5"
                                      strokeDasharray="4 3"
                                    />
                                  </svg>
                                  <span className="text-xs text-slate-500">Your normal gross pay</span>
                                </div>
                              </div>
                              {incomeSalaryBaseline && (
                                <p className="mt-2 text-xs text-slate-400">
                                  Based on your annual salary of ${incomeSalaryBaseline.annualFormatted}, we&apos;re using ${incomeSalaryBaseline.weeklyFormatted} per week as your baseline.
                                </p>
                              )}
                            </div>
                            <table className="w-full min-w-[400px] text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                  <th className="py-2 text-left font-medium">Week</th>
                                  <th className="py-2 text-left font-medium">Date</th>
                                  <th className="py-2 text-left font-medium">Funding breakdown</th>
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
                                    <td className="py-1.5 text-slate-600">
                                      {row.sources.length === 0 ? (
                                        "None"
                                      ) : (
                                        <WeekIncomeStackedBar
                                          sources={row.sources}
                                          normalWeeklyGrossPay={weeklySalaryNum ?? 1}
                                        />
                                      )}
                                    </td>
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
                          <>, a shortfall of <span className="font-semibold text-rose-600">${incomeEstimator.shortfall.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span></>
                        )}.
                      </p>
                      {state === "CA" && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          SDI and PFL amounts are gross pre-tax estimates. Your employer leave is taxed as regular income. See tax details for more.
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">{getIncomeEstimateFootnote(state)}</p>
                    </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-600">Estimated leave income based on your timeline and salary.</p>
                    )}
                  </div>
                </div>

            </div>
          )}
          </>
          )}
        </section>

        {/* Feedback floating card */}
        {step === 5 && feedbackVisible && !feedbackDone && (
          <div className="no-print fixed bottom-6 right-6 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-800">Quick feedback</span>
              <button
                type="button"
                onClick={() => setFeedbackDone(true)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="text-center py-3">
                <div className="text-2xl mb-2">🙏</div>
                <p className="text-sm font-medium text-slate-800">Thank you!</p>
                <p className="text-xs text-slate-500 mt-1">Your feedback helps us improve.</p>
              </div>
            ) : (
              <>
                {feedbackStep === 1 && (
                  <>
                    <p className="text-xs text-slate-600 mb-3">Did this help you understand your parental leave?</p>
                    <div className="flex flex-col gap-2">
                      {["Yes, exactly what I needed", "Somewhat, still have questions", "Didn't apply to my situation", "Just exploring"].map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => { setFeedbackQ1(opt); setFeedbackStep(2); }}
                          className={`text-left text-xs rounded-xl border px-3 py-2 transition ${feedbackQ1 === opt ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {feedbackStep === 2 && (
                  <>
                    <p className="text-xs text-slate-600 mb-2">What&apos;s the one thing you wished this showed you? <span className="text-slate-400">(optional)</span></p>
                    <textarea
                      value={feedbackQ2Text}
                      onChange={(e) => setFeedbackQ2Text(e.target.value)}
                      placeholder="Type anything..."
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 resize-none h-16 mb-3"
                    />
                    <button type="button" onClick={() => setFeedbackStep(3)}
                      className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 transition">
                      Next →
                    </button>
                  </>
                )}
                {feedbackStep === 3 && (
                  <>
                    <p className="text-xs text-slate-600 mb-3">How much do you trust the information shown?</p>
                    <div className="flex flex-col gap-2">
                      {["Very much, I'd use this to plan my leave", "Somewhat, I'd verify with HR or an attorney", "Not sure"].map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => { setFeedbackQ3(opt); setFeedbackStep(4); }}
                          className={`text-left text-xs rounded-xl border px-3 py-2 transition ${feedbackQ3 === opt ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {feedbackStep === 4 && (
                  <>
                    <p className="text-xs text-slate-600 mb-3">Would you pay for a version with a week-by-week action checklist and filing deadlines?</p>
                    <div className="flex flex-col gap-2">
                      {["Yes, I'd pay $10 to 20", "Yes, I'd pay $20 to 50", "Maybe, depends on price", "No, free only"].map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => { setFeedbackQ4(opt); setFeedbackStep(5); }}
                          className={`text-left text-xs rounded-xl border px-3 py-2 transition ${feedbackQ4 === opt ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {feedbackStep === 5 && (
                  <>
                    <p className="text-xs text-slate-600 mb-3">Would you share this with someone planning leave?</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {["Yes, I already have or will", "Maybe", "No"].map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => setFeedbackQ5(opt)}
                          className={`text-left text-xs rounded-xl border px-3 py-2 transition ${feedbackQ5 === opt ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => {
                        handleSubmitFeedback();
                        setFeedbackSubmitted(true);
                        setTimeout(() => setFeedbackDone(true), 3000);
                      }}
                      className="w-full text-xs font-semibold rounded-xl bg-sky-500 text-white px-3 py-2 hover:bg-sky-600 transition">
                      Submit feedback
                    </button>
                  </>
                )}
                <div className="mt-3 text-right text-[10px] text-slate-400">
                  Q{feedbackStep} of 5
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Chat Assistant */}
        {step === 5 && (displayTimeline ?? timeline) && (
          <div className="no-print mt-8">
            <div className="rounded-2xl border border-purple-200 bg-white shadow-sm overflow-hidden">
              {/* Chat header */}
              <button
                type="button"
                onClick={() => setChatOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold shrink-0">AI</div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900">Ask Leavigation AI</div>
                    <div className="text-xs text-slate-500">Get instant answers about your leave plan, powered by AI, verified for accuracy</div>
                  </div>
                </div>
                <span className={`text-slate-400 transition-transform ${chatOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {chatOpen && (
                <div className="flex flex-col">
                  {/* Suggested questions */}
                  {chatMessages.length === 0 && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="text-xs text-slate-500 mb-3">Suggested questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {chatSuggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              setChatInput(q);
                              setChatMessages([]);
                            }}
                            className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-100 transition"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {chatMessages.length > 0 && (
                    <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto border-b border-slate-100">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-purple-500 text-white rounded-br-sm" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm"}`}>
                            {msg.role === "assistant" ? (
                              <div className="space-y-2">
                                {msg.content.split("\n").map((line, j) => {
                                  if (line.startsWith("Sources:")) return <div key={j} className="mt-3 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">{line}</div>;
                                  if (line.startsWith("• ") && line.includes("http")) {
                                    const parts = line.replace("• ", "").split(" | ");
                                    return (
                                      <div key={j} className="text-xs">
                                        <span className="text-slate-600">• {parts[0]} | </span>
                                        <a href={parts[1]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">{parts[1]}</a>
                                      </div>
                                    );
                                  }
                                  return line ? <p key={j} className="leading-relaxed">{line}</p> : <br key={j} />;
                                })}
                              </div>
                            ) : msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              Verifying answer...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input */}
                  <div className="px-5 py-4 flex gap-3 items-end">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder={getChatPlaceholder(state)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 resize-none outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleChatSubmit}
                      disabled={chatLoading || !chatInput.trim()}
                      className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
                    >
                      Send
                    </button>
                  </div>
                  <div className="px-5 pb-3 text-[10px] text-slate-400">
                    AI responses are verified for accuracy but are not legal advice. Always confirm with your HR team or a qualified attorney.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
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

          {step < 5 && (
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
    <main className="min-h-screen text-slate-900" style={{ background: "linear-gradient(135deg, #E0F0FF 0%, #EDE8FD 40%, #FEF6D0 100%)", minHeight: "100vh" }}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pink-400 text-white flex items-center justify-center text-sm font-bold">
              L
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Leavigation
            </span>
          </div>
          <a
            href="/plan"
            className="text-sm font-semibold text-pink-600 hover:text-pink-900"
          >
            Build my plan
          </a>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="mb-12">
            <div className="rounded-3xl bg-white/70 px-6 py-8 shadow-sm ring-1 ring-pink-100">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Parental leave is two things.{" "}
                <span className="text-pink-600">Most people only know about one.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-700">
                Understanding how job protection and paid leave work, and how they
                interact, is the key to planning a leave that actually works for you.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="/plan"
                  className="inline-flex items-center justify-center rounded-full bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500"
                >
                  Build my leave plan →
                </a>
                <p className="text-xs text-slate-500">
                  Takes about 5 to 10 minutes. No login required.
                </p>
              </div>
            </div>
          </section>

          {/* Benefits section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Everything you need to plan your leave, in one place</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl mb-4">🤖</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">AI assistant that knows your plan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Ask any question about your specific leave, how FMLA interacts with CFRA, when to file your SDI claim, what your rights are. Get instant, verified answers with cited sources.</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-pink-100">
                <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl mb-4">📅</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Your full timeline in 5 minutes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Get a personalized week-by-week Gantt chart showing exactly which programs cover you each week. FMLA, state paid leave, employer leave, and short-term disability, all stacked correctly for your state and situation.</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-blue-100">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl mb-4">💵</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Forecasted income during leave</h3>
                <p className="text-sm text-slate-600 leading-relaxed">See exactly how much money you&apos;ll receive each week, broken down by source. Know your shortfall in advance so you can plan, save, and negotiate with confidence.</p>
              </div>
            </div>
          </section>

          {/* Social proof / trust */}
          <section className="mb-12">
            <div className="rounded-2xl bg-white/70 px-6 py-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-pink-500">Free</div>
                  <div className="text-xs text-slate-500 mt-1">No login required</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-purple-500">5 min</div>
                  <div className="text-xs text-slate-500 mt-1">To your full plan</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-blue-500">All 50 states</div>
                  <div className="text-xs text-slate-500 mt-1">FMLA + employer + state programs</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-yellow-500">AI</div>
                  <div className="text-xs text-slate-500 mt-1">Verified answers</div>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Answer a few questions", desc: "Tell us your state, due date, birth type, salary, and employer leave policy. The tool covers all 50 states plus DC. Takes 5 minutes." },
                { step: "2", title: "Get your personalized plan", desc: "See your week-by-week Gantt chart, income forecast, and key filing deadlines, all specific to your situation." },
                { step: "3", title: "Ask the AI anything", desc: "Use the built-in AI assistant to ask follow-up questions about your plan. Verified answers with cited sources." },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="h-8 w-8 rounded-full bg-pink-400 text-white flex items-center justify-center text-sm font-bold mb-3">{item.step}</div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Here is what you will get</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-pink-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Week-by-week leave timeline</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  A Gantt chart showing every program active each week, color-coded by whether you are protected, paid, both, or neither. Covers FMLA, state programs, employer leave, and STD.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
                    <div className="text-lg font-bold text-slate-800">18</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total leave weeks</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-3 ring-1 ring-emerald-200">
                    <div className="text-lg font-bold text-emerald-700">10</div>
                    <div className="text-[10px] text-emerald-700 mt-1">Fully paid weeks</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-3 ring-1 ring-amber-200">
                    <div className="text-lg font-bold text-amber-700">4</div>
                    <div className="text-[10px] text-amber-700 mt-1">Reduced or no pay</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Estimated leave income</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  A full income breakdown by source, week by week. See exactly how much comes from each program, your total estimated leave income, and your projected shortfall so you can plan ahead.
                </p>
                <table className="mt-4 w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 text-slate-600">State disability</td><td className="py-1.5 text-right font-medium text-slate-800">$12,400</td></tr>
                    <tr><td className="py-1.5 text-slate-600">State paid leave</td><td className="py-1.5 text-right font-medium text-slate-800">$9,800</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Employer leave</td><td className="py-1.5 text-right font-medium text-slate-800">$18,000</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Short-term disability</td><td className="py-1.5 text-right font-medium text-slate-800">$4,200</td></tr>
                    <tr className="border-t border-slate-200"><td className="py-2 font-semibold text-slate-800">Total</td><td className="py-2 text-right font-semibold text-emerald-700">$44,400</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Coverage by state</h2>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
              <svg width="100%" viewBox="0 0 680 420" role="img" aria-label="Leavigation coverage by state: inverted trapezoid showing three tiers">
                <polygon points="40,30 640,30 584,155 96,155" fill="#E6F1FB" stroke="none"/>
                <polygon points="96,158 584,158 529,280 151,280" fill="#EAF3DE" stroke="none"/>
                <polygon points="151,283 529,283 480,390 200,390" fill="#FCEBEB" stroke="none"/>
                <polygon points="40,30 640,30 480,390 200,390" fill="none" stroke="#B4B2A9" strokeWidth="1"/>
                <line x1="96" y1="156" x2="584" y2="156" stroke="#B4B2A9" strokeWidth="0.75"/>
                <line x1="151" y1="281" x2="529" y2="281" stroke="#B4B2A9" strokeWidth="0.75"/>
                <rect x="270" y="37" width="140" height="20" rx="10" fill="#E6F1FB" stroke="#378ADD" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="51" textAnchor="middle" fill="#185FA5">Available now</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="85" textAnchor="middle" fill="#0C447C">All 50 states + DC</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="107" textAnchor="middle" fill="#185FA5">FMLA + employer leave + short-term disability</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="127" textAnchor="middle" fill="#185FA5">No state paid program? We still show you what you have.</text>
                <rect x="264" y="164" width="152" height="20" rx="10" fill="#EAF3DE" stroke="#97C459" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="178" textAnchor="middle" fill="#27500A">Live now, fully built</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="210" textAnchor="middle" fill="#27500A">California</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="230" textAnchor="middle" fill="#3B6D11">All state and municipal programs built in</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="250" textAnchor="middle" fill="#3B6D11">SDI, PFL, PDL, CFRA, FMLA, SF PPLO</text>
                <rect x="244" y="290" width="192" height="20" rx="10" fill="#FCEBEB" stroke="#F09595" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="304" textAnchor="middle" fill="#791F1F">Being built into Leavigation</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="333" textAnchor="middle" fill="#791F1F">State PFL programs being added</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="353" textAnchor="middle" fill="#A32D2D">CO, CT, DE, DC, HI, ME, MA, MN, NJ, NY, OR, RI, VT, WA</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="373" textAnchor="middle" fill="#A32D2D">MD and VA programs launching in 2028</text>
              </svg>
            </div>
          </section>

        {/* Bottom CTA */}
        <section className="mb-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Ready to map out your leave?
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Answer a few questions and get a week-by-week breakdown of your job
            protection and pay, specific to your state, employer, and situation.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href="/plan"
              className="inline-flex items-center justify-center rounded-full bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500"
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