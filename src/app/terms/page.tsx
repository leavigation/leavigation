import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leavigation | Terms and Conditions",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Terms and Conditions</h1>
          <a href="/plan" className="text-sm font-medium text-sky-600 hover:text-sky-700">← Back to planner</a>
        </header>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-900">
          <p className="font-semibold">Coming soon.</p>
          <p className="mt-1">Our attorneys are finalizing this document. Please check back shortly. In the meantime, please review our <a href="/legal" className="underline">Legal Disclaimer</a>.</p>
        </div>
      </div>
    </main>
  );
}
