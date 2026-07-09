"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

function BetaSup() {
  return <sup style={{ fontSize: "9px" }}>BETA</sup>;
}

export default function PricingPage() {
  const { user } = useUser();

  async function handleUpgrade() {
    if (!user) {
      window.location.href = "/sign-up";
      return;
    }
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
          <p className="mt-2 text-sm text-slate-600">Choose the plan that fits your leave planning needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Explorer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <h2 className="text-xl font-semibold text-slate-900">Explorer</h2>
            <p className="mt-1 text-2xl font-bold text-slate-900">Free</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700 flex-1">
              <li>✓ Personalized timeline of leave programs</li>
              <li>✓ HR checklist</li>
              <li>✓ 1 saved plan</li>
              <li className="text-slate-400">Weekly income estimate by funding source</li>
              <li className="text-slate-400">
                AI chat assistant customized to your plan <BetaSup />
              </li>
            </ul>
            <Link
              href="/plan"
              className="mt-6 block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Get started free
            </Link>
          </div>

          {/* Planner */}
          <div className="relative rounded-2xl border-2 border-sky-500 bg-white p-6 shadow-md flex flex-col">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
            <h2 className="text-xl font-semibold text-slate-900">Planner</h2>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              $30<span className="text-sm font-normal text-slate-500">/year</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700 flex-1">
              <li>✓ Everything in Explorer</li>
              <li>✓ Weekly income estimate by funding source</li>
              <li>
                ✓ AI chat assistant customized to your plan <BetaSup />
              </li>
              <li>✓ Make and compare unlimited leave plans</li>
            </ul>
            <button
              type="button"
              onClick={handleUpgrade}
              className="mt-6 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
            >
              Upgrade to Planner
            </button>
          </div>

          {/* Navigator */}
          <div className="rounded-2xl border border-slate-400 bg-slate-200 p-6 shadow-sm flex flex-col opacity-90">
            <span className="self-start rounded-full bg-slate-500 px-3 py-0.5 text-xs font-semibold text-white mb-2">
              Coming soon
            </span>
            <h2 className="text-xl font-semibold text-slate-600">Navigator</h2>
            <p className="mt-1 text-2xl font-bold text-slate-600">
              $100<span className="text-sm font-normal text-slate-500">/year</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-500 flex-1">
              <li>✓ Everything in Planner</li>
              <li>✓ Family planning view</li>
              <li>✓ Filing deadline alerts</li>
              <li>✓ All expanded features</li>
            </ul>
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl border border-slate-400 bg-slate-300 py-2.5 text-sm font-semibold text-slate-500"
            >
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
