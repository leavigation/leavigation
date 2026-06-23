import type { Metadata } from "next";
export const metadata: Metadata = { title: "Leavigation | Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
          <a href="/plan" className="text-sm font-medium text-sky-600 hover:text-sky-700">← Back to planner</a>
        </header>
        <p className="text-xs text-slate-400 mb-8">Last updated: June 2026</p>
        <div className="space-y-6 text-sm leading-relaxed text-slate-800">

          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Overview</h2>
            <p className="mt-2">Leavigation (leavigation.com) is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.</p>
            <p className="mt-2">By using Leavigation, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Information We Collect</h2>
            <p className="mt-2"><strong>Tool inputs:</strong> When you use the Leavigation planning tool, you may enter information such as your state, due date, employment details, and salary. This information is used only to generate your personalized leave plan and is processed locally in your browser.</p>
            <p className="mt-2"><strong>Email address:</strong> If you choose to receive your plan by email or sign up for updates, we collect your email address. This is voluntary.</p>
            <p className="mt-2"><strong>Analytics:</strong> We use Google Analytics to collect anonymized usage data such as pages visited, session duration, and general location by region. This data does not identify you personally.</p>
            <p className="mt-2"><strong>Cookies:</strong> We may use cookies for analytics and session management. You can disable cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. How We Use Your Information</h2>
            <p className="mt-2">Tool inputs are used solely to generate your leave plan. They are not stored on our servers, sold, or shared with any third party.</p>
            <p className="mt-2">Email addresses collected are used to send you your plan, product updates, and relevant educational content about parental leave. You can unsubscribe at any time.</p>
            <p className="mt-2">Analytics data is used to understand how people use the tool and to improve the product.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Data Storage and Security</h2>
            <p className="mt-2">Tool inputs are processed in your browser and are not stored on Leavigation servers.</p>
            <p className="mt-2">If you use the Share Link feature, your inputs are encoded in the URL. Do not share your link with anyone you would not want to have access to that information.</p>
            <p className="mt-2">Email addresses are stored securely by Beehiiv in accordance with their privacy policy at beehiiv.com/privacy.</p>
            <p className="mt-2">We implement reasonable security measures to protect any data we do collect, but no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Third-Party Services</h2>
            <p className="mt-2"><strong>Google Analytics:</strong> We use Google Analytics for anonymized usage analytics. See Google&apos;s privacy policy at policies.google.com/privacy.</p>
            <p className="mt-2"><strong>Beehiiv:</strong> We use Beehiiv for email capture and newsletter delivery. See Beehiiv&apos;s privacy policy at beehiiv.com/privacy.</p>
            <p className="mt-2"><strong>Anthropic:</strong> The AI chat assistant on the results page is powered by Anthropic&apos;s Claude API. Conversations may be processed by Anthropic in accordance with their privacy policy at anthropic.com/privacy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Your Rights</h2>
            <p className="mt-2">You may request deletion of your email address from our mailing list at any time by clicking the unsubscribe link in any email or contacting us at leavigation@gmail.com.</p>
            <p className="mt-2">If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA). Please contact us at leavigation@gmail.com to exercise your rights.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Children&apos;s Privacy</h2>
            <p className="mt-2">This tool is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Changes to This Policy</h2>
            <p className="mt-2">We reserve the right to update this Privacy Policy at any time. We will notify users of significant changes by posting a notice on the site. Continued use of the tool following any update constitutes your acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. Contact</h2>
            <p className="mt-2">If you have questions about this Privacy Policy, please contact us at <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">leavigation@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
