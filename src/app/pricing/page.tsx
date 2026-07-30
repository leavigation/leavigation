"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { pageBackgrounds } from "@/lib/pageBackgrounds";
import { openBeehiivWaitlist } from "@/lib/beehiiv";

const PLANNER_PRICE_ID = "price_1Tr3EsPI7TYvz6kGfZTqAIoW";

const explorerFeatures = [
  "High level leave education library for all 50 states",
  "One free personalized leave plan (visual leave timeline)",
  "Save and export plan as PDF to share with HR",
  "General leave planning checklist",
];

const plannerFeatures = [
  "Everything in Explorer",
  "Week-by-week income breakdown by funding source",
  "AI chat — answers based on your specific plan",
  "Unlimited saved plans",
];

const navigatorFeatures = [
  "Everything in Explorer and Planner",
  "Automatic filing deadline reminders",
  "Family and partner leave view",
  "Adjust plan after baby arrives",
  "First access to every new feature in BETA",
];

type TierKey = "explorer" | "planner" | "navigator";

const comparisonRows: { feature: string; tiers: Record<TierKey, boolean> }[] = [
  {
    feature: "High level leave education library for all 50 states",
    tiers: { explorer: true, planner: true, navigator: true },
  },
  {
    feature: "One free personalized leave plan (visual leave timeline)",
    tiers: { explorer: true, planner: true, navigator: true },
  },
  {
    feature: "Save and export plan as PDF to share with HR",
    tiers: { explorer: true, planner: true, navigator: true },
  },
  {
    feature: "General leave planning checklist",
    tiers: { explorer: true, planner: true, navigator: true },
  },
  {
    feature: "Week-by-week income breakdown by funding source",
    tiers: { explorer: false, planner: true, navigator: true },
  },
  {
    feature: "AI chat — answers based on your specific plan",
    tiers: { explorer: false, planner: true, navigator: true },
  },
  {
    feature: "Unlimited saved plans",
    tiers: { explorer: false, planner: true, navigator: true },
  },
  {
    feature: "Automatic filing deadline reminders",
    tiers: { explorer: false, planner: false, navigator: true },
  },
  {
    feature: "Family and partner leave view",
    tiers: { explorer: false, planner: false, navigator: true },
  },
  {
    feature: "Adjust plan after baby arrives",
    tiers: { explorer: false, planner: false, navigator: true },
  },
  {
    feature: "First access to every new feature in BETA",
    tiers: { explorer: false, planner: false, navigator: true },
  },
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes. Explorer is free. You will always have access to one leave plan timeline and a planning checklist with no credit card required. Simply make a free Explorer account to access these resources.",
  },
  {
    q: "What is the difference between Explorer and Planner?",
    a: "Explorer gives you an introduction to the visual timeline with one free leave plan, tools to understand what rights you might have, programs you may be eligible for, and how to communicate your leave with your employer. With Explorer, you're exploring what leave might look like for you! Planner adds the actionable layer — week-by-week income breakdown, AI chat for plan-specific questions, and unlimited planning scenarios so you can see how leave changes when you change your inputs (change jobs, stay and your employer, split your leave up into different sections of time, move states, etc.).",
  },
  {
    q: "Can I use Leavigation if I am not in California?",
    a: "Yes. Leavigation covers FMLA, employer leave, and private short term disability policies in all 50 states. California and San Francisco municipal programs for employees paying into the CA SDI program are fully built out with other state-specific programs rolling out over time.",
  },
  {
    q: "Is Leavigation built for state and federal employees?",
    a: "Coming soon! This is on the roadmap.",
  },
  {
    q: "What if I'm not eligible for FMLA?",
    a: (
      <>
        Leavigation is currently built for employees who are eligible for FMLA. To determine if you
        are eligible, please visit{" "}
        <a
          href="https://www.dol.gov/general/topic/benefits-leave/fmla"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sky-700 underline hover:text-sky-900"
        >
          the U.S. Department of Labor FMLA page
        </a>
        .
      </>
    ),
  },
  {
    q: 'What does "locking in my plan" mean in Navigator?',
    a: "Once you have aligned on your leave plan with HR Navigator lets you lock one plan as your official leave strategy, and Leavigation takes over from there! Then all you have to do is let us know when your little one has arrived, and we will automatically navigate your leave and update your leave timeline (because babies are rarely born on their due date!).",
  },
  {
    q: "When is Navigator launching?",
    a: "Navigator is in active development. Join the waitlist to be first in line!",
  },
];

function CheckIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">
        ✓
      </span>
    );
  }
  return <span className="text-slate-300">—</span>;
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex-1 space-y-2.5 text-sm leading-relaxed text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-0.5 shrink-0 text-emerald-600">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  async function handlePlannerCheckout() {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      window.location.href = "/sign-up?redirect=/pricing";
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          priceId: PLANNER_PRICE_ID,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Unable to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const openWaitlist = openBeehiivWaitlist;

  return (
    <main className="min-h-screen text-slate-900" style={{ color: "#2C3E50", backgroundColor: pageBackgrounds.lightBlue }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#2C3E50" }}>
            Pricing
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Start free. Upgrade when you need income estimates, AI chat, and unlimited plans.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Explorer */}
          <div
            className="flex flex-col rounded-2xl border border-slate-200 p-6 shadow-sm sm:p-8"
            style={{ backgroundColor: "#FFF5C2" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "#2C3E50" }}>
              Explorer
            </h2>
            <p className="mt-2 text-2xl font-bold" style={{ color: "#2C3E50" }}>
              Free — always
            </p>
            <FeatureList items={explorerFeatures} />
            <Link
              href="/sign-up"
              className="mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#F2B8CB" }}
            >
              Start for free — no credit card needed
            </Link>
          </div>

          {/* Planner */}
          <div
            className="relative flex flex-col rounded-2xl border-2 p-6 shadow-md sm:p-8"
            style={{ backgroundColor: "#A8CCDF", borderColor: "#2C3E50" }}
          >
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#2C3E50" }}
            >
              Most popular
            </span>
            <h2 className="text-xl font-semibold" style={{ color: "#2C3E50" }}>
              Planner
            </h2>
            <p className="mt-2 text-2xl font-bold" style={{ color: "#2C3E50" }}>
              $30 <span className="text-base font-normal text-slate-700">/ year</span>
            </p>
            <FeatureList items={plannerFeatures} />
            <button
              type="button"
              onClick={handlePlannerCheckout}
              disabled={checkoutLoading || !isLoaded}
              className="mt-8 w-full rounded-full py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#2C3E50" }}
            >
              {checkoutLoading ? "Redirecting to checkout…" : "Start Planner — $30/year"}
            </button>
            {checkoutError && (
              <p className="mt-3 text-center text-xs text-rose-700">{checkoutError}</p>
            )}
            <p className="mt-3 text-center text-xs text-slate-700">
              Less than a single HR consultation.
            </p>
          </div>

          {/* Navigator */}
          <div className="flex flex-col rounded-2xl border border-slate-300 bg-slate-100 p-6 opacity-95 shadow-sm sm:p-8">
            <span className="self-start rounded-full bg-slate-500 px-3 py-0.5 text-xs font-semibold text-white">
              Coming soon
            </span>
            <h2 className="mt-3 text-xl font-semibold text-slate-600">Navigator</h2>
            <p className="mt-2 text-2xl font-bold text-slate-600">Coming soon</p>
            <FeatureList items={navigatorFeatures} />
            <button
              type="button"
              onClick={openWaitlist}
              className="mt-8 w-full rounded-full border-2 border-slate-400 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Join the waitlist
            </button>
          </div>
        </div>

        {/* Comparison table */}
        <section className="mt-16 sm:mt-20">
          <h2 className="text-center text-2xl font-bold" style={{ color: "#2C3E50" }}>
            Compare plans
          </h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-900 sm:px-6">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 sm:px-6">Explorer</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 sm:px-6">Planner</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900 sm:px-6">Navigator</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-700 sm:px-6">{row.feature}</td>
                    <td className="px-4 py-3 text-center sm:px-6">
                      <CheckIcon included={row.tiers.explorer} />
                    </td>
                    <td className="px-4 py-3 text-center sm:px-6">
                      <CheckIcon included={row.tiers.planner} />
                    </td>
                    <td className="px-4 py-3 text-center sm:px-6">
                      <CheckIcon included={row.tiers.navigator} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 sm:mt-20">
          <h2 className="text-center text-2xl font-bold" style={{ color: "#2C3E50" }}>
            Frequently asked questions
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <span className="shrink-0 text-slate-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="mt-16 rounded-2xl px-6 py-12 text-center sm:mt-20 sm:px-10 sm:py-14"
          style={{ backgroundColor: "#FFF5C2" }}
        >
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#2C3E50" }}>
            Start your free plan today
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            No credit card. No commitment. Just clarity.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "#F2B8CB" }}
          >
            Create my free Explorer account
          </Link>
        </section>
      </div>
    </main>
  );
}
