"use client";

import Link from "next/link";

export default function PlanLimitModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <p className="text-sm text-slate-700 leading-relaxed">
          You&apos;ve used your free plan. Upgrade to Planner for unlimited saved plans.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/pricing"
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
          >
            View pricing
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
