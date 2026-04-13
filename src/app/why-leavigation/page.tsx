export default function WhyLeavigationPage() {
  const items = [
    { emoji: "📅", title: "Week-by-week clarity", desc: "Most resources tell you how many weeks you're entitled to. Leavigation shows you exactly what happens each week — which programs are active, whether you're job protected, and how much money you'll receive.", color: "ring-pink-100" },
    { emoji: "💵", title: "Real dollar estimates", desc: "We calculate your actual estimated SDI, PFL, and employer leave income based on your salary and California's 2026 benefit rates — so you can plan your finances, not just your calendar.", color: "ring-yellow-100" },
    { emoji: "🧩", title: "Everything stacked correctly", desc: "FMLA, PDL, CFRA, SDI, PFL, employer leave, and SF PPLO all interact in complex ways. Leavigation handles the stacking logic automatically — so you don't have to.", color: "ring-purple-100" },
    { emoji: "🔒", title: "No login required", desc: "Your information stays on your device. No account, no email required to use the tool. Just answers.", color: "ring-blue-100" },
    { emoji: "🆓", title: "Free", desc: "The core leave planning tool is completely free. We believe every parent deserves access to this information regardless of their ability to pay.", color: "ring-pink-100" },
    { emoji: "🐣", title: "Built by someone who needed it", desc: "Leavigation was built by a working mom who went through the confusion of planning her own leave. This isn't a generic HR tool — it's the product of a real frustration with a real solution.", color: "ring-yellow-100" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #E0F0FF 0%, #EDE8FD 40%, #FEF6D0 100%)" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
            Why us
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Why Leavigation?
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            There are other ways to figure out your maternity leave. Here&apos;s why we think this one is better.
          </p>
        </div>

        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.title} className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ${item.color}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #E8679A, #9B7FD4)" }}>
            <h2 className="text-lg font-semibold mb-2">Ready to see your plan?</h2>
            <p className="text-sm opacity-90 mb-4">Takes 5 minutes. No login required. Free.</p>
            <a href="/plan" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition">
              Build my free leave plan →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
