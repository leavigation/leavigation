export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
            Our story
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Built by a mom, for moms.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Leavigation started with one frustrating experience — and a spreadsheet.
          </p>
        </div>

        <div className="space-y-8 text-slate-700">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">The problem I couldn&apos;t solve</h2>
            <p className="text-sm leading-relaxed">
              When I started planning my own maternity leave, I had no idea what I was doing. I went back and forth with HR for weeks trying to figure out how FMLA, California SDI, PFL, and my employer leave all worked together. Nobody could give me a clear, complete answer — not HR, not my doctor, not the EDD website. And I&apos;m an engineer at a major tech company. I can figure things out. But this was genuinely confusing.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">So I built the tool I wished existed</h2>
            <p className="text-sm leading-relaxed">
              Leavigation takes the complexity of parental leave — the overlapping federal laws, state programs, employer policies, and municipal ordinances — and turns it into a clear, personalized, week-by-week plan. No law degree required. No hours on hold with EDD. Just answers.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Who we are</h2>
            <p className="text-sm leading-relaxed">
              Leavigation is an early-stage product built by a solo founder based in San Francisco. We&apos;re currently focused on California, with plans to expand to other states. We believe every parent deserves to understand their rights — and that the information shouldn&apos;t be locked behind a law firm or an HR department.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">We&apos;re just getting started</h2>
            <p className="text-sm leading-relaxed text-amber-800">
              Leavigation launched in April 2026. We&apos;re actively building, listening to users, and improving every week. If you have feedback, a story to share, or want to get involved — we&apos;d love to hear from you.
            </p>
            <a href="mailto:leavigation@gmail.com" className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition">
              Get in touch →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
