import Link from "next/link";

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pink-400 text-white flex items-center justify-center text-sm font-bold">
              L
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Leavigation
            </span>
          </div>
          <a
            href="/plan"
            className="text-sm font-semibold text-pink-600 hover:text-pink-900"
          >
            Build my plan
          </a>
        </header>

        <main className="flex-1">
          <div className="mb-10">
            <Link href="/" className="text-sm font-medium text-sky-600 hover:text-sky-700">
              ← Back to home
            </Link>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              What&apos;s in Leavigation today
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Everything currently live and available in your free Explorer account.
            </p>
          </div>

          {/* Hero */}
          <section className="mb-12">
            <div className="rounded-3xl bg-white/70 px-6 py-8 shadow-sm ring-1 ring-pink-100">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Parental leave is two things.{" "}
                <span className="text-pink-600">Most people only know about one.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-700">
                Understanding how job protection and paid leave work, and how they
                interact, is the key to planning a leave that actually works for you.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="/plan"
                  className="inline-flex items-center justify-center rounded-full bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500"
                >
                  Build my leave plan →
                </a>
                <p className="text-xs text-slate-500">
                  Takes about 5 to 10 minutes. No login required.
                </p>
              </div>
            </div>
          </section>

          {/* Benefits section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Everything you need to plan your leave, in one place</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl mb-4">🤖</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">AI assistant that knows your plan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Ask any question about your specific leave, how FMLA interacts with CFRA, when to file your SDI claim, what your rights are. Get instant, verified answers with cited sources.</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-pink-100">
                <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl mb-4">📅</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Your full timeline in 5 minutes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Get a personalized week-by-week Gantt chart showing exactly which programs cover you each week. FMLA, state paid leave, employer leave, and short-term disability, all stacked correctly for your state and situation.</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-blue-100">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl mb-4">💵</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Forecasted income during leave</h3>
                <p className="text-sm text-slate-600 leading-relaxed">See exactly how much money you&apos;ll receive each week, broken down by source. Know your shortfall in advance so you can plan, save, and negotiate with confidence.</p>
              </div>
            </div>
          </section>

          {/* Social proof / trust */}
          <section className="mb-12">
            <div className="rounded-2xl bg-white/70 px-6 py-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-pink-500">Free</div>
                  <div className="text-xs text-slate-500 mt-1">No login required</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-purple-500">5 min</div>
                  <div className="text-xs text-slate-500 mt-1">To your full plan</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-blue-500">All 50 states</div>
                  <div className="text-xs text-slate-500 mt-1">FMLA + employer + state programs</div>
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl font-bold text-yellow-500">AI</div>
                  <div className="text-xs text-slate-500 mt-1">Verified answers</div>
                </div>
              </div>
            </div>
          </section>

          {/* How Leavigation Works */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">How Leavigation Works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Answer a few questions", desc: "Tell us your state, due date, birth type, salary, and employer leave policy. The tool covers all 50 states plus DC. Takes 5 minutes." },
                { step: "2", title: "Get your personalized plan", desc: "See your week-by-week Gantt chart, income forecast, and key filing deadlines, all specific to your situation." },
                { step: "3", title: "Ask the AI anything", desc: "Use the built-in AI assistant to ask follow-up questions about your plan. Verified answers with cited sources." },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="h-8 w-8 rounded-full bg-pink-400 text-white flex items-center justify-center text-sm font-bold mb-3">{item.step}</div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Here is what you will get</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-pink-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Week-by-week leave timeline</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  A Gantt chart showing every program active each week, color-coded by whether you are protected, paid, both, or neither. Covers FMLA, state programs, employer leave, and STD.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
                    <div className="text-lg font-bold text-slate-800">18</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total leave weeks</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-3 ring-1 ring-emerald-200">
                    <div className="text-lg font-bold text-emerald-700">10</div>
                    <div className="text-[10px] text-emerald-700 mt-1">Fully paid weeks</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-3 ring-1 ring-amber-200">
                    <div className="text-lg font-bold text-amber-700">4</div>
                    <div className="text-[10px] text-amber-700 mt-1">Reduced or no pay</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Estimated leave income</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  A full income breakdown by source, week by week. See exactly how much comes from each program, your total estimated leave income, and your projected shortfall so you can plan ahead.
                </p>
                <table className="mt-4 w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 text-slate-600">State disability</td><td className="py-1.5 text-right font-medium text-slate-800">$12,400</td></tr>
                    <tr><td className="py-1.5 text-slate-600">State paid leave</td><td className="py-1.5 text-right font-medium text-slate-800">$9,800</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Employer leave</td><td className="py-1.5 text-right font-medium text-slate-800">$18,000</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Short-term disability</td><td className="py-1.5 text-right font-medium text-slate-800">$4,200</td></tr>
                    <tr className="border-t border-slate-200"><td className="py-2 font-semibold text-slate-800">Total</td><td className="py-2 text-right font-semibold text-emerald-700">$44,400</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">Coverage by state</h2>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
              <svg width="100%" viewBox="0 0 680 420" role="img" aria-label="Leavigation coverage by state: inverted trapezoid showing three tiers">
                <polygon points="40,30 640,30 584,155 96,155" fill="#E6F1FB" stroke="none"/>
                <polygon points="96,158 584,158 529,280 151,280" fill="#EAF3DE" stroke="none"/>
                <polygon points="151,283 529,283 480,390 200,390" fill="#FCEBEB" stroke="none"/>
                <polygon points="40,30 640,30 480,390 200,390" fill="none" stroke="#B4B2A9" strokeWidth="1"/>
                <line x1="96" y1="156" x2="584" y2="156" stroke="#B4B2A9" strokeWidth="0.75"/>
                <line x1="151" y1="281" x2="529" y2="281" stroke="#B4B2A9" strokeWidth="0.75"/>
                <rect x="270" y="37" width="140" height="20" rx="10" fill="#E6F1FB" stroke="#378ADD" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="51" textAnchor="middle" fill="#185FA5">Available now</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="85" textAnchor="middle" fill="#0C447C">All 50 states + DC</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="107" textAnchor="middle" fill="#185FA5">FMLA + employer leave + short-term disability</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="127" textAnchor="middle" fill="#185FA5">No state paid program? We still show you what you have.</text>
                <rect x="264" y="164" width="152" height="20" rx="10" fill="#EAF3DE" stroke="#97C459" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="178" textAnchor="middle" fill="#27500A">Live now, fully built</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="210" textAnchor="middle" fill="#27500A">California</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="230" textAnchor="middle" fill="#3B6D11">All state and municipal programs built in</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="250" textAnchor="middle" fill="#3B6D11">SDI, PFL, PDL, CFRA, FMLA, SF PPLO</text>
                <rect x="244" y="290" width="192" height="20" rx="10" fill="#FCEBEB" stroke="#F09595" strokeWidth="0.5"/>
                <text fontSize="12" fontFamily="inherit" x="340" y="304" textAnchor="middle" fill="#791F1F">Being built into Leavigation</text>
                <text fontSize="14" fontWeight="500" fontFamily="inherit" x="340" y="333" textAnchor="middle" fill="#791F1F">State PFL programs being added</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="353" textAnchor="middle" fill="#A32D2D">CO, CT, DE, DC, HI, ME, MA, MN, NJ, NY, OR, RI, VT, WA</text>
                <text fontSize="12" fontFamily="inherit" x="340" y="373" textAnchor="middle" fill="#A32D2D">MD and VA programs launching in 2028</text>
              </svg>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="mb-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Ready to map out your leave?
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Answer a few questions and get a week-by-week breakdown of your job
              protection and pay, specific to your state, employer, and situation.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="/plan"
                className="inline-flex items-center justify-center rounded-full bg-pink-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500"
              >
                Build my leave plan →
              </a>
              <p className="text-xs text-slate-500">
                You can tweak your answers and re-run the plan anytime.
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-snug text-slate-500">
              This tool is informational only and not legal or tax advice. Talk to your
              HR team, a lawyer, or a qualified professional before making decisions
              about your leave.
            </p>
          </section>
        </main>
      </div>
    </main>
  );
}
