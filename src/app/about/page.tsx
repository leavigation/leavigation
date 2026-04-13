export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #FDE8EF 0%, #EDE8FD 50%, #E0F0FF 100%)" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-200">
            Our story
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Built by a mom, for moms.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Leavigation started with one frustrating experience — and a lot of wasted hours.
          </p>
        </div>

        <div className="space-y-8 text-slate-700">

          {/* Founder card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pink-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img
                src="/audrey-headshot.jpg"
                alt="Audrey, founder of Leavigation"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-pink-100 shrink-0"
              />
              <div>
                <p className="text-base font-semibold text-slate-900 mb-1">Audrey</p>
                <p className="text-xs text-slate-500 mb-3">Founder, Leavigation · San Francisco, CA</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  Mom, tech professional, and the person who spent way too many hours trying to figure out her own maternity leave so you don&apos;t have to.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">The problem I couldn&apos;t solve</h2>
            <p className="text-sm leading-relaxed">
              When I was planning my own maternity leave, I had no idea what I was doing. I went back and forth with HR for weeks trying to figure out how FMLA, SDI, PFL, and my employer leave all worked together. Nobody could give me a clear answer. And I work in tech — I&apos;m used to quickly solving problems. But this was genuinely confusing and I wasted hours and hours researching and learning everything I could about leave. And if it was confusing for me and many of my tech friends, then I knew it would be confusing for every other mom out there, too.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">So I built the tool I wished existed</h2>
            <p className="text-sm leading-relaxed">
              Leavigation takes the complexity of parental leave — the overlapping federal laws, state programs, employer policies, and municipal ordinances — and turns it into a clear, personalized, week-by-week plan. No law degree required. No hours on hold with EDD. Just answers.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-yellow-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Where we are today</h2>
            <p className="text-sm leading-relaxed">
              Leavigation launched in April 2026. We&apos;re currently focused on California — one of the most complex and generous parental leave states in the country — with plans to expand. We&apos;re actively building, listening to users, and improving every week. This is a product built in spare time, driven entirely by feedback from real moms.
            </p>
          </div>

          <div className="rounded-2xl p-6 ring-1 ring-pink-200" style={{ background: "linear-gradient(135deg, #FDE8EF, #EDE8FD)" }}>
            <h2 className="text-lg font-semibold text-pink-900 mb-3">Have feedback or a story to share?</h2>
            <p className="text-sm leading-relaxed text-pink-800 mb-4">
              Every message gets read personally. If you tried the tool, have a suggestion, or just want to share your leave story — reach out.
            </p>
            <a href="mailto:leavigation@gmail.com" className="inline-flex items-center gap-2 rounded-full bg-pink-400 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500 transition">
              Get in touch →
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
