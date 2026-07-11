import { pageBackgrounds } from "@/lib/pageBackgrounds";

export default function WhyLeavigationPage() {
  const rows = [
    {
      feature: "Free to use",
      leavigation: { check: true, note: "Always free for the core plan" },
      consultants: { check: false, note: "Typically $200 to 500/session" },
      hr: { check: true, note: "Free but limited to employer policy" },
      tools: { check: false, note: "Many charge for full access" },
    },
    {
      feature: "Week-by-week visual timeline",
      leavigation: { check: true, note: "Personalized Gantt chart showing every week" },
      consultants: { check: false, note: "Verbal or written summary only" },
      hr: { check: false, note: "Not typically provided" },
      tools: { check: false, note: "Most show totals, not week-by-week" },
    },
    {
      feature: "Real dollar income estimates",
      leavigation: { check: true, note: "SDI, PFL, employer pay broken down by week" },
      consultants: { check: true, note: "Can estimate but based on general knowledge" },
      hr: { check: false, note: "Employer pay only, won't calculate state benefits" },
      tools: { check: false, note: "Rarely include state benefit calculations" },
    },
    {
      feature: "State and federal leave stacking logic",
      leavigation: { check: true, note: "FMLA, state paid leave, employer leave, and STD all stacked correctly for your state" },
      consultants: { check: true, note: "Knowledgeable but expensive for ongoing questions" },
      hr: { check: false, note: "HR knows employer policy, not state benefit interactions" },
      tools: { check: false, note: "Most don't handle CA-specific stacking complexity" },
    },
    {
      feature: "No login or account required",
      leavigation: { check: true, note: "Your data stays on your device" },
      consultants: { check: true, note: "No account, but requires scheduling" },
      hr: { check: true, note: "No account needed" },
      tools: { check: false, note: "Most require signup to see results" },
    },
    {
      feature: "Available 24/7, instant results",
      leavigation: { check: true, note: "Results in 5 minutes, any time" },
      consultants: { check: false, note: "Requires scheduling, often weeks out" },
      hr: { check: false, note: "Business hours only, response time varies" },
      tools: { check: true, note: "Usually instant but results may be generic" },
    },
    {
      feature: "Covers state + federal + municipal",
      leavigation: { check: true, note: "FMLA, state programs for all 50 states plus DC, and municipal ordinances where applicable" },
      consultants: { check: true, note: "Comprehensive but at a cost" },
      hr: { check: false, note: "Focused on employer policy, not all legal layers" },
      tools: { check: false, note: "Usually federal only or single-state" },
    },
    {
      feature: "Personalized to your situation",
      leavigation: { check: true, note: "Built from your specific inputs, salary, birth type, employer policy" },
      consultants: { check: true, note: "Highly personalized, the main value of a consultant" },
      hr: { check: false, note: "Company-wide policies, not tailored to you" },
      tools: { check: false, note: "Often generic calculators, not scenario-specific" },
    },
    {
      feature: "Keeps up with CA law changes",
      leavigation: { check: true, note: "Monitored via Google Alerts, updated regularly" },
      consultants: { check: true, note: "Good consultants stay current" },
      hr: { check: false, note: "HR teams may lag on state benefit updates" },
      tools: { check: false, note: "Update schedules vary, often unclear" },
    },
    {
      feature: "Built by a mom who needed it",
      leavigation: { check: true, note: "Real frustration, real solution" },
      consultants: { check: false, note: "Professional expertise, not lived experience" },
      hr: { check: false, note: "Corporate perspective, not personal" },
      tools: { check: false, note: "Typically built by HR tech companies" },
    },
    {
      feature: "AI assistant that knows your plan",
      leavigation: { check: true, note: "Ask questions about your specific leave plan, answered instantly, verified for accuracy, with sources" },
      consultants: { check: false, note: "Available during scheduled sessions only" },
      hr: { check: false, note: "Not available, HR answers general policy questions" },
      tools: { check: false, note: "No other tools offer plan-specific AI Q&A" },
    },
  ];

  const cols = [
    { key: "leavigation", label: "Leavigation", highlight: true },
    { key: "consultants", label: "Parental Leave Consultants", highlight: false },
    { key: "hr", label: "Company HR", highlight: false },
    { key: "tools", label: "Other Online Tools", highlight: false },
  ];

  return (
    <main className="min-h-screen" style={{ backgroundColor: pageBackgrounds.paleYellow }}>
      <div className="mx-auto max-w-5xl px-6 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
            Why us
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Why Leavigation?
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
            There are other ways to figure out your maternity leave. Each one has real value. Here&apos;s how Leavigation fits in, and where it fills the gaps.
          </p>
        </div>

        {/* Comparison table, desktop */}
        <div className="hidden md:block rounded-2xl overflow-hidden shadow-sm ring-1 ring-purple-100 mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="bg-white px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-48">Feature</th>
                {cols.map((col) => (
                  <th key={col.key} className={`px-5 py-4 text-center text-sm font-semibold ${col.highlight ? "bg-pink-400 text-white" : "bg-white text-slate-700"}`} style={col.highlight ? { boxShadow: "inset 0 0 0 2px #f9a8d4" } : {}}>
                    {col.highlight && <div className="text-xs font-normal opacity-80 mb-0.5">⭐ Our pick</div>}
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-5 py-4 font-medium text-slate-800 text-sm">{row.feature}</td>
                  {cols.map((col) => {
                    const val = row[col.key as keyof typeof row] as { check: boolean; note: string };
                    return (
                      <td key={col.key} className={`px-5 py-4 text-center align-top ${col.highlight ? "bg-pink-100" : ""}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-lg ${val.check ? "text-emerald-500" : "text-rose-400"}`}>
                            {val.check ? "✓" : "✕"}
                          </span>
                          <span className="text-xs text-slate-500 leading-snug max-w-[140px]">{val.note}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison cards, mobile */}
        <div className="md:hidden space-y-4 mb-12">
          {rows.map((row) => (
            <div key={row.feature} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-purple-100">
              <h3 className="font-semibold text-slate-900 mb-3">{row.feature}</h3>
              <div className="space-y-2">
                {cols.map((col) => {
                  const val = row[col.key as keyof typeof row] as { check: boolean; note: string };
                  return (
                    <div key={col.key} className={`flex items-start gap-3 rounded-xl px-3 py-2 ${col.highlight ? "bg-pink-50 ring-1 ring-pink-100" : "bg-slate-50"}`}>
                      <span className={`text-base mt-0.5 shrink-0 ${val.check ? "text-emerald-500" : "text-rose-400"}`}>
                        {val.check ? "✓" : "✕"}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-slate-700">{col.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{val.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="rounded-2xl bg-white/70 p-6 ring-1 ring-purple-100 text-center mb-8">
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            <span className="font-semibold text-slate-900">A note on consultants:</span> Parental leave consultants are genuinely valuable, especially for complex situations, negotiations with employers, or legal questions. Leavigation doesn&apos;t replace them. We help you show up to that conversation informed, so you get more out of every minute you pay for.
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-white text-center" style={{ background: "linear-gradient(135deg, #F472B6, #A78BFA)" }}>
          <h2 className="text-2xl font-bold mb-2">Ready to see your plan?</h2>
          <p className="text-sm opacity-90 mb-6">Takes 5 minutes. No login required. Free.</p>
          <a href="/plan" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition">
            Build my free leave plan →
          </a>
        </div>

      </div>
    </main>
  );
}
