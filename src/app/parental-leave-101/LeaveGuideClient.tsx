"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { pageBackgrounds } from "@/lib/pageBackgrounds";
import type { ExplorerAccessState } from "@/lib/explorerAccess";
import { TIER1_PROGRAM_ROWS, type LeaveGuideProgramRow } from "@/lib/leaveGuidePrograms";
import {
  getLeaveGuideStateBySlug,
  LEAVE_GUIDE_STATES,
  TIER_2_NOTICES,
  type ProgramPillKind,
} from "@/lib/leaveGuideStateModel";

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

function ProgramsTable({ rows }: { rows: LeaveGuideProgramRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="px-4 py-3">Program</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pillClasses(row.pill)}`}
                  >
                    {pillLabel(row.pill)}
                  </span>
                  <span className="font-semibold text-slate-900">{row.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 leading-relaxed">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CtaBlock() {
  return (
    <div className="rounded-2xl p-6 text-white mt-8" style={{ background: "linear-gradient(135deg, #60A9DC, #9B7FD4)" }}>
      <h2 className="text-lg font-semibold mb-2">See how these all apply to you</h2>
      <p className="text-sm opacity-90 mb-4">Every situation is different. Build your personalized plan in 5 minutes.</p>
      <a
        href="/plan"
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
      >
        Build my free leave plan →
      </a>
    </div>
  );
}

export default function LeaveGuideClient({
  initialSlug = "",
  initialAccess = { isSignedIn: false, hasExplorerAccess: false },
}: {
  initialSlug?: string;
  initialAccess?: ExplorerAccessState;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [hasExplorerAccess, setHasExplorerAccess] = useState(initialAccess.hasExplorerAccess);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAccess.isSignedIn);
  const [accessChecked, setAccessChecked] = useState(initialAccess.hasExplorerAccess);

  useEffect(() => {
    if (!isLoaded) return;

    const clerkId = user?.id;
    if (!isSignedIn || !clerkId) {
      setIsAuthenticated(false);
      setHasExplorerAccess(false);
      setAccessChecked(true);
      return;
    }

    setIsAuthenticated(true);

    async function checkAccess() {
      try {
        const res = await fetch(`/api/get-user-tier?clerkId=${clerkId}`);
        const data = await res.json();
        setHasExplorerAccess(data.tier === "explorer" || data.tier === "planner");
      } catch {
        setHasExplorerAccess(initialAccess.hasExplorerAccess);
      } finally {
        setAccessChecked(true);
      }
    }

    checkAccess();
  }, [isLoaded, isSignedIn, user?.id, initialAccess.hasExplorerAccess]);

  const effectiveAccess = accessChecked ? hasExplorerAccess : initialAccess.hasExplorerAccess;
  const checkingAccess = !accessChecked && !initialAccess.hasExplorerAccess && (initialAccess.isSignedIn || isSignedIn);

  const slug = useMemo(() => {
    if (pathname === "/parental-leave-101" || pathname === "/parental-leave-101/") return "";
    const m = pathname.match(/^\/parental-leave-101\/([^/]+)/);
    return m?.[1] ?? initialSlug;
  }, [pathname, initialSlug]);

  useEffect(() => {
    if (!accessChecked || effectiveAccess || !slug) return;
    router.replace("/parental-leave-101", { scroll: false });
  }, [accessChecked, effectiveAccess, slug, router]);

  const state = slug && effectiveAccess ? getLeaveGuideStateBySlug(slug) : undefined;

  const tier2 = state ? TIER_2_NOTICES[state.code] : undefined;
  const tier1Rows = state ? TIER1_PROGRAM_ROWS[state.code] : undefined;

  const tier3Body = state
    ? `${state.name} does not have a state paid leave program run by the government. However, state law requires your employer to treat pregnancy and postpartum recovery as a qualifying disability. If your employer offers a private short term disability (STD) plan, it must cover your recovery, typically 6 to 8 weeks depending on delivery type.\n\nThe good news: many employers in ${state.name} offer parental leave and STD coverage that can be combined with FMLA to create a real, paid leave plan. Leavigation can map that out for you. Just enter your due date and employer benefits, and we will show you exactly what your leave can look like week by week.`
    : "";

  const tier4Body = state
    ? `${state.name} does not have a state paid leave program. Your baseline protection is FMLA: 12 weeks of unpaid, job protected leave if your employer has 50+ employees.\n\nBut unpaid does not have to mean unplanned. Many employers offer parental leave policies and short term disability coverage that can turn those 12 weeks into partially or fully paid leave. Leavigation combines your federal protections with your employer benefits to show you a complete picture, week by week, dollar by dollar.`
    : "";

  if (slug && effectiveAccess && !state) return null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: pageBackgrounds.lightPurple }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
            Education
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {state ? `How parental leave works in ${state.name}` : "How parental leave works"}
          </h1>
          <p className="mt-4 text-lg text-slate-600">Parental leave is two things. Most people only know about one.</p>
        </div>

        <div className="space-y-6 text-slate-700">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pink-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 mb-3">
              🛡️ Job Protection
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 1: Job protection, your right to come back</h2>
            <p className="text-sm leading-relaxed mb-3">
              Job protection means your employer must hold your job, or an equivalent role, while you are on leave. It does <strong>not</strong> mean you get paid. The main federal law is FMLA, 12 weeks of job protection for eligible employees. Some states layer on additional weeks on top of that.
            </p>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">Job protection and pay are separate.</p>
              <p className="mt-1">
                You can be fully job protected and still receive no income, or you can be getting paid with no legal right to return to your role.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-3">
              💵 Paid Leave
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 2: Paid leave, income while you are away</h2>
            <p className="text-sm leading-relaxed mb-3">
              Paid leave is the money that shows up while you are out. It can come from state disability insurance (SDI), state paid family leave (PFL), employer parental leave, and short term disability (STD). Each has its own start date, duration, and pay rate, and they can stack.
            </p>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
              <p className="font-semibold">Most people receive pay from 2 to 3 different programs.</p>
              <p className="mt-1">
                Each program has its own forms, deadlines, and rules. The confusing part is not any one program, it is how they overlap.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 mb-3">
              🔗 Job Protection + Pay
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">How they work together</h2>
            <p className="text-sm leading-relaxed mb-4">
              In any given week of leave, you might be job protected but unpaid, paid but not job protected, both, or neither. The goal is to maximize weeks where you have <strong>both protection and income</strong>. That is exactly what Leavigation helps you map out.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-200">
                <p className="font-semibold text-emerald-800">✅ Protected + Paid</p>
                <p className="mt-1 text-emerald-700">The ideal: your job is protected and money is coming in.</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-3 ring-1 ring-amber-200">
                <p className="font-semibold text-amber-800">⚠️ Protected + Unpaid</p>
                <p className="mt-1 text-amber-700">Legally safe, but financially stressful, sometimes a planned gap.</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-3 ring-1 ring-orange-200">
                <p className="font-semibold text-orange-800">⚠️ Paid + Unprotected</p>
                <p className="mt-1 text-orange-700">Income without legal protection, often when employer pay extends after laws run out.</p>
              </div>
              <div className="rounded-xl bg-rose-50 px-3 py-3 ring-1 ring-rose-200">
                <p className="font-semibold text-rose-800">❌ Unprotected + Unpaid</p>
                <p className="mt-1 text-rose-700">
                  The real cliff: no legal protection and no income. Planning helps you avoid landing here by surprise.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Select your state</h2>
            <p className="text-sm text-slate-600 mb-4">See every program available to you</p>
            <div className="mx-auto w-full max-w-[400px]">
              <label htmlFor="leave-guide-state" className="sr-only">
                State
              </label>
              {checkingAccess ? (
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Loading your account…
                </div>
              ) : effectiveAccess ? (
                <select
                  id="leave-guide-state"
                  value={slug}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!next) {
                      router.replace("/parental-leave-101", { scroll: false });
                      return;
                    }
                    router.replace(`/parental-leave-101/${next}`, { scroll: false });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select your state</option>
                  {LEAVE_GUIDE_STATES.map((s) => (
                    <option key={s.code} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-4">
                  <select
                    id="leave-guide-state"
                    disabled
                    aria-disabled="true"
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-base font-medium text-slate-400 shadow-sm opacity-60"
                  >
                    <option value="">Select your state</option>
                    {LEAVE_GUIDE_STATES.map((s) => (
                      <option key={s.code} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {isAuthenticated ? (
                    <Link
                      href="/sign-up?redirect=/parental-leave-101"
                      className="block w-full rounded-full py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
                      style={{ backgroundColor: "#F2B8CB" }}
                    >
                      Accept terms to view leave resources in your state
                    </Link>
                  ) : (
                    <Link
                      href="/sign-up?reason=leave-education&redirect=/parental-leave-101"
                      className="block w-full rounded-full py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
                      style={{ backgroundColor: "#F2B8CB" }}
                    >
                      Create a free account to learn about leave resources in your state
                    </Link>
                  )}
                </div>
              )}
            </div>

            {slug && state && effectiveAccess && (
              <div className="mt-8">
                {state.tier === 1 && tier1Rows && (
                  <>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Programs at a glance</h3>
                    <p className="text-sm text-slate-600 mb-2">Each row lists the program type, full name, and what it does in plain language.</p>
                    <ProgramsTable rows={tier1Rows} />
                  </>
                )}

                {state.tier === 2 && tier2 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950 ring-1 ring-rose-100">
                      <p className="font-semibold text-rose-900 mb-2">Coming soon</p>
                      <p className="leading-relaxed">{tier2.notice}</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{tier2.goodNews}</p>
                  </div>
                )}

                {state.tier === 3 && (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{tier3Body}</p>
                )}

                {state.tier === 4 && (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{tier4Body}</p>
                )}

                <CtaBlock />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
