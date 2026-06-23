export default function LegalPage() {
  const appName = "Leavigation";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Legal Disclaimer</h1>
          <a href="/" className="text-sm font-medium text-sky-600 hover:text-sky-700">
            ← Back to planner
          </a>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-slate-800">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. General disclaimer</h2>
            <p className="mt-2">
              {appName} is an informational tool designed to help individuals understand how parental leave
              programs may apply to their situation. The information provided by this tool does not constitute
              legal, financial, employment, or benefits advice. It is intended for general informational
              purposes only.
            </p>
            <p className="mt-2">
              Nothing on this website should be relied upon as a substitute for consultation with a qualified
              attorney, HR professional, financial advisor, or benefits specialist. Every individual&apos;s
              situation is unique, and leave entitlements depend on factors including but not limited to
              employer size, employer policies, tenure, hours worked, state of employment, and applicable
              collective bargaining agreements.
            </p>
            <p className="mt-2">
              Use of this tool does not create any professional&ndash;client relationship between you and {appName} or
              its creators.
            </p>
            <p className="mt-2">
              Your use of {appName} and this website is at your own risk. Any reliance on information provided
              by {appName} or on this website is solely at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Accuracy of information</h2>
            <p className="mt-2">
              We make every effort to keep the information on this site current and accurate. However, {appName} does not guarantee
              that all information is complete, accurate, or up to date at the time of your use.
            </p>
            <p className="mt-2">
              Always verify current rules directly with your state&apos;s administering agency, your
              employer&apos;s HR department, and a qualified professional before making leave decisions.
            </p>
            <p className="mt-2">
              Links to official agency websites are provided where available to help you access the most
              current information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. No guarantee of benefits</h2>
            <p className="mt-2">
              The leave entitlements, dollar estimates, and timelines shown by this tool are estimates only.
              Actual benefits you receive will depend on your specific eligibility, your employer&apos;s
              policies, your claims history, and determinations made by your employer and/or state agency.
            </p>
            <p className="mt-2">
              Estimated dollar amounts shown are approximations based on the information you provide and
              publicly available benefit rates. They do not account for taxes, benefit coordination rules
              specific to your employer&apos;s plan, or individual eligibility determinations. Actual amounts
              may be higher or lower than estimated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. State and municipal law variations</h2>
            <p className="mt-2">
              This tool covers federal law (FMLA) and selected state and municipal leave programs. It does not
              cover every applicable law in every jurisdiction. Municipal and local ordinances vary widely and
              change frequently. State and local paid leave programs, benefit rates, weekly caps, and
              eligibility rules are updated, revised, amended, rescinded, or otherwise changed regularly by
              applicable government agencies. The information on this website may not reflect the most recent
              legislative changes. If you work in a city or county not covered by this tool, additional
              protections or benefits may apply.
            </p>
            <p className="mt-2">
              This tool is designed for use by employees in the United States only. It does not cover leave
              laws in any other country.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 uppercase">5. Disclaimer of representations and warranties</h2>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              LEAVIGATION MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, REGARDING
              THE COMPLETENESS, ACCURACY, RELIABILITY, SUITABILITY, OR AVAILABILITY OF ANY INFORMATION
              PROVIDED ON THIS WEBSITE. LEAVIGATION EXPRESSLY DISCLAIMS ANY RESPONSIBILITY OR LIABILITY FOR
              ERRORS OR OMISSIONS IN SUCH INFORMATION, AND DOES NOT WARRANT THAT THE INFORMATION PROVIDED IS
              ACCURATE, COMPLETE, OR CURRENT. ANY RELIANCE PLACED ON SUCH INFORMATION IS STRICTLY AT THE RISK
              OF THE RECIPIENT. LEAVIGATION PROVIDES THIS WEBSITE AND ALL INFORMATION PROVIDED ON THIS WEBSITE
              &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT ANY WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. LEAVIGATION DOES NOT
              WARRANT THAT THIS WEBSITE OR ANY INFORMATION PROVIDED ON THIS WEBSITE WILL MEET YOUR
              REQUIREMENTS OR THAT THIS WEBSITE WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Data and privacy</h2>
            <p className="mt-2">
              This tool does not store your personal information. The information you enter, including your
              state, due date, employer details, and salary, is used only to generate your personalized
              timeline and is not saved, sold, or shared with any third party.
            </p>
            <p className="mt-2">
              If you use the Share Link feature, your inputs are encoded in the URL itself. Do not share your
              link with anyone you would not want to have access to that information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Updates to this disclaimer</h2>
            <p className="mt-2">
              We reserve the right to update this disclaimer at any time. Continued use of the tool following
              any update constitutes acceptance of the revised terms. This disclaimer was last updated:{" "}
              June 2026.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Contact</h2>
            <p className="mt-2">
              If you believe any information on this site is inaccurate or out of date, please contact us at{" "}
              <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">
                leavigation@gmail.com
              </a>.
              We take accuracy seriously and will review all flagged information promptly.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
