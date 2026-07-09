"use client";

export default function NavigatorComingSoonBanner() {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-slate-600">
        Coming soon — Navigator ($100/year) — Family view, filing deadline alerts, and all expanded features
      </p>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).beehiiv) {
            (window as unknown as Record<string, { open: () => void }>).beehiiv.open();
          }
        }}
        className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        Get notified
      </button>
    </div>
  );
}
