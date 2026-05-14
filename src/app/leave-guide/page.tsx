export default function LeaveGuidePage() {
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #E0F0FF 0%, #EDE8FD 40%, #FEF6D0 100%)" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
            Education
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            How parental leave works in California
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Parental leave is two things. Most people only know about one.
          </p>
        </div>

        <div className="space-y-6 text-slate-700">

          {/* Thing 1 */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pink-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 mb-3">🛡️ Job Protection</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 1: Job protection — your right to come back</h2>
            <p className="text-sm leading-relaxed mb-3">Job protection means your employer must hold your job — or an equivalent role — while you&apos;re on leave. It does <strong>not</strong> mean you get paid. The main federal law is FMLA — 12 weeks of job protection for eligible employees. Some states layer on additional weeks on top of that.</p>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">Job protection and pay are separate.</p>
              <p className="mt-1">You can be fully job-protected and still receive no income — or you can be getting paid with no legal right to return to your role.</p>
            </div>
          </div>

          {/* Thing 2 */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-3">💵 Paid Leave</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 2: Paid leave — income while you&apos;re away</h2>
            <p className="text-sm leading-relaxed mb-3">Paid leave is the money that shows up while you&apos;re out. It can come from state disability insurance (SDI), state paid family leave (PFL), employer parental leave, and short-term disability (STD). Each has its own start date, duration, and pay rate — and they can stack.</p>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
              <p className="font-semibold">Most people receive pay from 2–3 different programs.</p>
              <p className="mt-1">Each program has its own forms, deadlines, and rules. The confusing part isn&apos;t any one program — it&apos;s how they overlap.</p>
            </div>
          </div>

          {/* How they work together */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 mb-3">🔗 Job Protection + Pay</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">How they work together</h2>
            <p className="text-sm leading-relaxed mb-4">In any given week of leave, you might be job-protected but unpaid, paid but not job-protected, both, or neither. The goal is to maximize weeks where you have <strong>both protection and income</strong>. That&apos;s exactly what Leavigation helps you map out.</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-emerald-50 px-3 py-3 ring-1 ring-emerald-200">
                <p className="font-semibold text-emerald-800">✅ Protected + Paid</p>
                <p className="mt-1 text-emerald-700">The ideal: your job is protected and money is coming in.</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-3 ring-1 ring-amber-200">
                <p className="font-semibold text-amber-800">⚠️ Protected + Unpaid</p>
                <p className="mt-1 text-amber-700">Legally safe, but financially stressful — sometimes a planned gap.</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-3 ring-1 ring-orange-200">
                <p className="font-semibold text-orange-800">⚠️ Paid + Unprotected</p>
                <p className="mt-1 text-orange-700">Income without legal protection — often when employer pay extends after laws run out.</p>
              </div>
              <div className="rounded-xl bg-rose-50 px-3 py-3 ring-1 ring-rose-200">
                <p className="font-semibold text-rose-800">❌ Unprotected + Unpaid</p>
                <p className="mt-1 text-rose-700">The real cliff — no legal protection and no income. Planning helps you avoid landing here by surprise.</p>
              </div>
            </div>
          </div>

          {/* CA programs */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">California programs at a glance</h2>
            <div className="space-y-3 text-sm">
              {[
                { name: "CA SDI", desc: "State Disability Insurance — pays 60–90% of wages during pregnancy disability. Up to 8 weeks for C-section, 6 weeks for vaginal birth. 7-day waiting period.", color: "bg-blue-50 text-blue-800 ring-1 ring-blue-100" },
                { name: "CA PFL", desc: "Paid Family Leave — pays 60–90% of wages during bonding. 8 weeks available. Starts after SDI ends. Must file separately with EDD.", color: "bg-pink-50 text-pink-800 ring-1 ring-pink-100" },
                { name: "CA PDL", desc: "Pregnancy Disability Leave — up to 17.3 weeks of job protection during pregnancy. No minimum employment requirement.", color: "bg-purple-50 text-purple-800 ring-1 ring-purple-100" },
                { name: "CFRA", desc: "California Family Rights Act — 12 weeks job-protected bonding leave. Starts day after PDL ends. Requires 12 months employment.", color: "bg-purple-50 text-purple-900 ring-1 ring-purple-200" },
                { name: "FMLA", desc: "Family and Medical Leave Act — federal, 12 weeks job protection. Starts day 1 of leave. Requires 12 months + 1,250 hours + employer 50+ employees.", color: "bg-slate-50 text-slate-800 ring-1 ring-slate-100" },
                { name: "SF PPLO", desc: "San Francisco Paid Parental Leave Ordinance — tops up CA PFL to 100% of salary for SF workers. Employer must have 20+ employees.", color: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-100" },
              ].map((p) => (
                <div key={p.name} className={`rounded-xl px-4 py-3 ${p.color}`}>
                  <span className="font-semibold">{p.name}</span> — {p.desc}
                </div>
              ))}
            </div>
          </div>

          {/* Not in CA */}
          <div id="notify" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Not in California? We&apos;re expanding.</h2>
            <p className="text-sm text-slate-600 mb-4">Leavigation currently supports California. Enter your email to get notified when we add your state.</p>
            <script async src="https://subscribe-forms.beehiiv.com/embed.js"></script>
            <iframe src="https://subscribe-forms.beehiiv.com/69acb8ac-4587-41c0-92b4-df39eb8798ea" className="beehiiv-embed" data-test-id="beehiiv-embed" frameBorder={0} scrolling="no" style={{ width: "100%", maxWidth: "560px", height: "200px", margin: 0, backgroundColor: "transparent", boxShadow: "none", borderRadius: 0 }}></iframe>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #60A9DC, #9B7FD4)" }}>
            <h2 className="text-lg font-semibold mb-2">See how these all apply to you</h2>
            <p className="text-sm opacity-90 mb-4">Every situation is different. Build your personalized plan in 5 minutes.</p>
            <a href="/plan" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
              Build my free leave plan →
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
