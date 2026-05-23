"use client";

import { TIER1_PROGRAM_ROWS } from "@/lib/leaveGuidePrograms";
import {
  getLeaveGuideStateByCode,
  getTier3CompactMessage,
  getTier4CompactMessage,
} from "@/lib/leaveGuideDisplay";
import { TIER_2_NOTICES, type ProgramPillKind } from "@/lib/leaveGuideStateModel";
import type { LeaveGuideProgramRow } from "@/lib/leaveGuidePrograms";

function pillClasses(pill: ProgramPillKind): string {
  switch (pill) {
    case "federal":
    case "jobProtection":
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
    case "sdi":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "pfl":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
    case "future":
      return "bg-rose-50 text-rose-900 ring-1 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
  }
}

function pillLabel(pill: ProgramPillKind): string {
  switch (pill) {
    case "federal":
      return "Federal";
    case "jobProtection":
      return "Job protection";
    case "sdi":
      return "SDI";
    case "pfl":
      return "PFL";
    case "future":
      return "Future";
    default:
      return pill;
  }
}

function ProgramsTable({ rows, compact }: { rows: LeaveGuideProgramRow[]; compact?: boolean }) {
  return (
    <div className={`overflow-x-auto rounded-xl ring-1 ring-slate-200 bg-white ${compact ? "mt-2" : "mt-6"}`}>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className={compact ? "px-3 py-2" : "px-4 py-3"}>Program</th>
            <th className={compact ? "px-3 py-2" : "px-4 py-3"}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-slate-100 last:border-0">
              <td className={`align-top ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pillClasses(row.pill)}`}
                  >
                    {pillLabel(row.pill)}
                  </span>
                  <span className={`font-semibold text-slate-900 ${compact ? "text-xs" : ""}`}>{row.name}</span>
                </div>
              </td>
              <td className={`text-slate-600 leading-relaxed ${compact ? "px-3 py-2 text-xs" : "px-4 py-3"}`}>
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StateProgramsReference({ stateCode }: { stateCode: string }) {
  const guideState = getLeaveGuideStateByCode(stateCode);
  if (!guideState) return null;

  const tier2 = TIER_2_NOTICES[guideState.code];
  const tier1Rows = TIER1_PROGRAM_ROWS[guideState.code];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Programs available in {guideState.name}
      </p>
      {guideState.tier === 1 && tier1Rows && <ProgramsTable rows={tier1Rows} compact />}
      {guideState.tier === 2 && tier2 && (
        <p className="mt-2 text-xs text-slate-700 leading-relaxed">{tier2.notice}</p>
      )}
      {guideState.tier === 3 && (
        <p className="mt-2 text-xs text-slate-700 leading-relaxed">{getTier3CompactMessage(guideState.name)}</p>
      )}
      {guideState.tier === 4 && (
        <p className="mt-2 text-xs text-slate-700 leading-relaxed">{getTier4CompactMessage(guideState.name)}</p>
      )}
    </div>
  );
}
