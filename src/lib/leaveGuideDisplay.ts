import { TIER1_PROGRAM_ROWS } from "./leaveGuidePrograms";
import { LEAVE_GUIDE_STATES, type LeaveGuideState } from "./leaveGuideStateModel";

export function getLeaveGuideStateByCode(stateCode: string): LeaveGuideState | undefined {
  return LEAVE_GUIDE_STATES.find((s) => s.code === stateCode.toUpperCase());
}

export function getStateIncomeProgramLabels(stateCode: string): {
  sdi: string | null;
  pfl: string | null;
} {
  const code = (stateCode || "").toUpperCase();
  const rows = TIER1_PROGRAM_ROWS[code];
  if (!rows) return { sdi: null, pfl: null };
  const sdiRow = rows.find((r) => r.pill === "sdi");
  const pflRow = rows.find(
    (r) => r.pill === "pfl" && !r.name.toLowerCase().includes("san francisco")
  );
  return {
    sdi: sdiRow?.name ?? null,
    pfl: pflRow?.name ?? null,
  };
}

const TIER1_SDI_STATES = new Set(["CA", "NJ", "NY", "RI", "HI"]);

export function getChatSuggestedQuestions(stateCode: string): string[] {
  const code = (stateCode || "").toUpperCase();
  const guide = getLeaveGuideStateByCode(code);
  const labels = getStateIncomeProgramLabels(code);
  const primaryProgram =
    labels.pfl?.split("(")[0]?.trim() ||
    labels.sdi?.split("(")[0]?.trim() ||
    "FMLA";

  const defaults = [
    "When does my FMLA protection start?",
    `How does my employer leave interact with ${primaryProgram}?`,
    "What is the difference between job protection and paid leave?",
    "When should I notify my employer?",
  ];

  if (!guide || guide.tier === 4) {
    return [
      ...defaults,
      "How can I maximize my employer parental leave policy?",
      "Does my employer STD cover pregnancy disability?",
    ];
  }

  if (guide.tier === 3) {
    return [
      ...defaults,
      "How can I maximize my employer parental leave policy?",
      "Does my employer STD cover pregnancy disability?",
    ];
  }

  if (guide.tier === 2) {
    return [
      ...defaults,
      "When will my state paid leave program take effect?",
      "What does FMLA cover while I wait for state benefits?",
    ].filter(Boolean);
  }

  if (TIER1_SDI_STATES.has(code)) {
    const sdiShort = code === "CA" ? "SDI" : code === "NY" ? "DBL" : code === "NJ" ? "TDI" : code === "RI" ? "TDI" : "SDI";
    return [
      `When should I file my ${sdiShort} claim?`,
      "What happens if I take leave before my due date?",
      `How does my employer leave interact with ${sdiShort}?`,
      ...defaults.slice(2),
    ];
  }

  return [
    `When should I file for ${primaryProgram}?`,
    "How does bonding leave work in my state?",
    ...defaults.slice(1),
  ];
}

export function getChatPlaceholder(stateCode: string): string {
  const name = getLeaveGuideStateByCode(stateCode)?.name ?? (stateCode || "your state");
  return `Ask anything about your leave plan or ${name} leave law...`;
}

export function getIncomeEstimateFootnote(stateCode: string): string {
  const code = (stateCode || "").toUpperCase();
  const guide = getLeaveGuideStateByCode(code);

  if (code === "CA") {
    return "Estimates are based on 2026 CA EDD rates. Actual benefits depend on your base period wages. This is not financial advice.";
  }

  if (!guide || guide.tier === 4) {
    return "Income estimates are based on your employer policy inputs. FMLA does not provide pay.";
  }

  if (guide.tier === 3) {
    return "Income estimates are based on your employer policy inputs. FMLA does not provide pay.";
  }

  if (guide.tier === 2) {
    return `Income estimates are based on your employer policy inputs until ${guide.name} state benefits begin. FMLA does not provide pay until then.`;
  }

  if (guide.tier === 1) {
    return `Estimates are based on 2026 ${guide.name} program rates. Actual benefits depend on your wages and eligibility. This is not financial advice.`;
  }

  return "Estimates are based on your employer leave and STD inputs. This is not financial advice.";
}

export function getTier3CompactMessage(stateName: string): string {
  return `${stateName} does not have a state paid leave program run by the government. State law still requires employers to treat pregnancy and postpartum recovery as a qualifying disability when they offer STD. Leavigation maps FMLA, employer leave, and any STD you enter.`;
}

export function getTier4CompactMessage(stateName: string): string {
  return `${stateName} does not have a state paid leave program. Your baseline is FMLA: up to 12 weeks of unpaid job protected leave for eligible employees. Leavigation combines FMLA with your employer leave and STD so you can see pay week by week.`;
}
