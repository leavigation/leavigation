export default function LeaveGuidePage() {
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #E0F0FF 0%, #EDE8FD 50%, #FEF6D0 100%)" }}>
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
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-pink-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 mb-3">🛡️ Job Protection</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 1: Job protection</h2>
            <p className="text-sm leading-relaxed">Job protection means your employer must hold your job — or an equivalent role — while you&apos;re on leave. It does <strong>not</strong> mean you get paid. The main laws are FMLA (federal, 12 weeks) and CFRA (California, 12 weeks) — and in California, they can stack for up to 7 months of total job protection for birthing parents.</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-3">💵 Paid Leave</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Thing 2: Paid leave</h2>
            <p className="text-sm leading-relaxed">Paid leave means income while you&apos;re away. In California, this comes from two main sources: State Disability Insurance (SDI) during pregnancy recovery, and Paid Family Leave (PFL) during bonding. These are funded by payroll taxes — you&apos;ve already paid into them. They are separate from job protection and must be filed separately with the EDD.</p>
          </div>

          <div className="rounded-2xl p-6 ring-1 ring-yellow-200" style={{ background: "#FEF6D0" }}>
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">The most important thing to know</h2>
            <p className="text-sm leading-relaxed text-yellow-800">Job protection and pay are completely separate. You can be fully job-protected and receive no income. Or you can be getting paid with no legal right to return to your role. Understanding how your specific combination of programs interact — week by week — is what Leavigation helps you do.</p>
          </div>

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

          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #60A9DC, #9B7FD4)" }}>
            <h2 className="text-lg font-semibold mb-2">See how these all apply to you</h2>
            <p className="text-sm opacity-90 mb-4">Every situation is different. Your specific combination of programs depends on your employer, your salary, your birth type, and your leave timing.</p>
            <a href="/plan" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
              Build my free leave plan →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
