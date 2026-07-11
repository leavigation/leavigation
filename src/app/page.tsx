import Image from "next/image";
import Link from "next/link";
import { pageBackgrounds } from "@/lib/pageBackgrounds";
import WaitlistButton from "@/app/components/WaitlistButton";

type TimelineNode = {
  icon: string | null;
  logo?: boolean;
  label: string;
  badge: { label: string; style: "explorer" | "planner" | "navigator" };
  subheading: string;
  description: string;
  cta: { label: string; href?: string; variant: "primary" | "outline" | "waitlist" };
};

const timelineNodes: TimelineNode[] = [
  {
    icon: "🌱",
    label: "First Trimester",
    badge: { label: "Explorer — Free", style: "explorer" },
    subheading: "Start with the basics",
    description:
      "Create your free Explorer account and learn exactly how maternity leave works in your state. Understand your rights, explore state and federal programs, and get a first look at your leave timeline — before you ever talk to HR.",
    cta: { label: "Start free", href: "/sign-up", variant: "primary" },
  },
  {
    icon: "🌸",
    label: "Second Trimester",
    badge: { label: "Planner — $30/year", style: "planner" },
    subheading: "Build your plan",
    description:
      "Upgrade to Planner and get your full financial picture. See a week-by-week income breakdown by funding source, model different leave scenarios, and use AI chat to get answers about your specific plan — so you walk into your HR conversation knowing exactly what you're entitled to.",
    cta: { label: "See Planner", href: "/pricing", variant: "outline" },
  },
  {
    icon: null,
    logo: true,
    label: "Third Trimester and Beyond",
    badge: { label: "Navigator — Coming soon", style: "navigator" },
    subheading: "Navigate your leave",
    description:
      "Navigator goes with you all the way through. Lock in your plan, file on time with automatic deadline reminders, share the full picture with your partner, and adjust as life changes — disability extended, return date shifted, or anything in between.",
    cta: { label: "Join the waitlist", variant: "waitlist" },
  },
];

const howItWorks = [
  {
    icon: "📋",
    heading: "Understand your leave",
    body: "Answer a few questions about your state, employer, and due date. Leavigation maps every program you qualify for — FMLA, state benefits, employer leave, and short term disability — all in one place.",
  },
  {
    icon: "💰",
    heading: "Know your paycheck",
    body: "See a week-by-week income breakdown showing exactly what you'll be paid, by which program, for every week of your leave. No more guessing.",
  },
  {
    icon: "📁",
    heading: "Plan with confidence",
    body: "Save your plan, export it as a PDF, and walk into your HR conversation prepared. Know what to ask, what to negotiate, and what you're entitled to.",
  },
  {
    icon: "🤖",
    heading: "Ask anything, anytime",
    body: "The AI chat answers questions about your specific plan — not generic advice. Whether it's 2pm or 2am, you've got support.",
  },
];

const stats = [
  {
    value: "330,000+",
    label: "People reached when we shared what moms are entitled to on leave",
  },
  {
    value: "All 50 states",
    label: "FMLA, employer leave, and short term disability covered nationwide",
  },
  {
    value: "Free",
    label: "One complete leave plan, always free, no credit card required",
  },
];

const tiers = [
  {
    name: "Explorer",
    price: "Free",
    description: "Your first leave plan, state education, and HR checklists.",
  },
  {
    name: "Planner",
    price: "$30/year",
    description: "Unlimited plans, income estimates, and AI chat for your plan.",
  },
  {
    name: "Navigator",
    price: "Coming soon",
    description: "Hands-on guidance for complex leave situations.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-slate-900">
      {/* Section 1 — Hero */}
      <section className="w-full bg-white px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "#2C3E50" }}
          >
            Your parental leave, mapped
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Create your free personalized leave plan — see exactly how long you&apos;re protected
            and what you&apos;ll get paid, week by week.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: "#F2B8CB" }}
            >
              Create my free plan — no credit card needed
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Free forever. Used by moms in all 50 states.
          </p>
        </div>
      </section>

      {/* Section 2 — Pregnancy Journey Timeline */}
      <section className="w-full px-6 py-16 sm:py-20" style={{ backgroundColor: pageBackgrounds.paleYellow }}>
        <div className="mx-auto max-w-7xl">
          <h2
            className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            The right plan for every stage of your pregnancy.
          </h2>

          <div className="mt-12 md:overflow-x-auto md:pb-4">
            <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-center md:gap-0">
              {timelineNodes.map((node, index) => (
                <div key={node.label} className="flex flex-col md:flex-row md:items-start">
                  <div className="flex w-full flex-col items-center text-center md:w-64 md:shrink-0 md:px-3 lg:w-72">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-200/60">
                      {node.logo ? (
                        <Image
                          src="/logo.png"
                          alt="Leavigation logo"
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                        />
                      ) : (
                        <span role="img" aria-hidden="true">
                          {node.icon}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">{node.label}</h3>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                        node.badge.style === "navigator"
                          ? "bg-slate-200 text-slate-500"
                          : "text-slate-900"
                      }`}
                      style={
                        node.badge.style === "explorer"
                          ? { backgroundColor: "#F2B8CB" }
                          : node.badge.style === "planner"
                            ? { backgroundColor: "#A8CCDF" }
                            : undefined
                      }
                    >
                      {node.badge.label}
                    </span>
                    <p className="mt-2 text-xs font-medium text-slate-700">{node.subheading}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{node.description}</p>
                    {node.cta.variant === "waitlist" ? (
                      <WaitlistButton className="mt-4 inline-flex rounded-full border-2 border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-400">
                        {node.cta.label}
                      </WaitlistButton>
                    ) : (
                      <Link
                        href={node.cta.href ?? "#"}
                        className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          node.cta.variant === "primary"
                            ? "text-slate-900 hover:opacity-90"
                            : "border-2 border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                        style={
                          node.cta.variant === "primary"
                            ? { backgroundColor: "#F2B8CB" }
                            : undefined
                        }
                      >
                        {node.cta.label}
                      </Link>
                    )}
                  </div>
                  {index < timelineNodes.length - 1 && (
                    <div
                      className="mx-auto my-2 h-8 w-0.5 border-l-2 border-solid md:mx-0 md:my-0 md:mt-10 md:h-0.5 md:w-8 md:border-l-0 md:border-t-2"
                      style={{ borderColor: "#F2B8CB" }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
              <div
                className="mx-auto mt-2 h-8 w-0.5 border-l-2 border-dotted md:mx-0 md:mt-10 md:h-0.5 md:w-20 md:border-l-0 md:border-t-2"
                style={{ borderColor: "#F2B8CB" }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — How It Works */}
      <section id="how-it-works" className="w-full scroll-mt-24 bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            What Leavigation does for you.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {howItWorks.map((item) => (
              <div
                key={item.heading}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8"
              >
                <div className="text-3xl" role="img" aria-hidden="true">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Social proof */}
      <section className="w-full px-6 py-16 sm:py-20" style={{ backgroundColor: "rgba(242, 184, 203, 0.2)" }}>
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            Parents who plan ahead walk out prepared
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-3xl font-bold text-slate-900 sm:text-4xl">{stat.value}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Tier preview */}
      <section className="w-full bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            No pressure, no credit card. Just your plan.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
                <p className="mt-1 text-xl font-bold text-slate-900">{tier.price}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{tier.description}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            See full pricing and features →
          </Link>
        </div>
      </section>

      {/* Section 6 — State coverage */}
      <section className="w-full bg-slate-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            Available everywhere you are.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Leavigation covers FMLA, employer leave, and short term disability for all 50 states.
            California and San Francisco municipal programs are fully built out. Additional state
            programs rolling out through 2026.
          </p>
          <Link
            href="/leave-guide"
            className="mt-6 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            See what&apos;s available in your state →
          </Link>
        </div>
      </section>

      {/* Section 7 — Bottom CTA */}
      <section className="w-full px-6 py-16 sm:py-24" style={{ backgroundColor: pageBackgrounds.paleYellow }}>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            <Image
              src="/logo.png"
              alt="Leavigation logo"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          </div>
          <h2
            className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#2C3E50" }}
          >
            Your leave plan is waiting.
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Free to start. Takes 2 minutes. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "#F2B8CB" }}
          >
            Create my free Explorer account
          </Link>
        </div>
      </section>
    </main>
  );
}
