import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Leavigation | Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">LEAVIGATION Privacy Policy</h1>
          <a href="/plan" className="text-sm font-medium text-sky-600 hover:text-sky-700">
            ← Back to planner
          </a>
        </header>
        <p className="text-xs text-slate-400 mb-8">Last updated: August 3, 2026</p>
        <div className="space-y-6 text-sm leading-relaxed text-slate-800">
          <section>
            <p>
              Leavigation LLC (the &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respect your privacy
              and are committed to protecting it through our compliance with this policy. This policy
              describes how we collect, process, retain, and disclose personal data about you when
              providing services to you through our websites, applications, products, and/or services
              (collectively, our &ldquo;Services&rdquo;) and our practices for using, maintaining, protecting, and
              disclosing that information.
            </p>
            <p className="mt-2">This policy applies only to information we collect:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Through the Services.</li>
              <li>
                In communications, including email, text, chat, and other electronic messages, between
                you and the Services.
              </li>
            </ul>
            <p className="mt-2">
              This policy does not apply to information collected by any third party, including through
              any application or content (including advertising) that may link to or be accessible from
              or through the Services.
            </p>
            <p className="mt-2">
              Please read this policy carefully to understand our policies and practices regarding your
              information and how we treat it. Your use of our Services is also governed by our{" "}
              <Link href="/terms" className="text-sky-600 hover:text-sky-700">
                Terms of Use
              </Link>
              , which is incorporated herein by reference. By interacting with our Services or providing
              us with your information, you agree to the collection, use, and sharing of your
              information as described in this privacy policy. This policy may change from time to time
              (see Changes to Our Privacy Policy). Your continued use of the Services after we make
              changes as described here is deemed to be acceptance of those changes, so please check the
              policy periodically for updates.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Children&apos;s and Minors&apos; Data</h2>
            <p className="mt-2">
              Our Services are not intended for, and we do not knowingly collect any personal data from,
              children under the age of 18. If we learn we have collected or received personal data from
              a child under 18 years old without verification of parental consent, we will delete that
              information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              The Personal Data That We Collect or Process
            </h2>
            <p className="mt-2">The types and categories of personal data we may collect or process include:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Account and contact information, including name, address, email address, phone number,
                username, and other contact information you provide us.
              </li>
              <li>
                Demographic information, including your age, gender, income level, or marital status.
              </li>
              <li>
                Other information relevant to determining your parental leave benefits, including your
                due date, birth type, and information about your employer&apos;s leave policy.
              </li>
              <li>
                Location information, including general geographic location such as country, state or
                province, or city.
              </li>
              <li>
                Device information, including your IP address, device identifiers, operating system and
                version, preferred language, hardware identifiers, browser type and settings, and other
                device information.
              </li>
            </ul>
            <p className="mt-2">We may also collect:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Statistics or aggregated information.</strong> Statistical or aggregated data
                does not directly identify a specific person, but we may derive non-personal statistical
                or aggregated data from personal data. For example, we may aggregate personal data to
                calculate the percentage of users accessing a specific Services feature.
              </li>
              <li>
                <strong>Technical information.</strong> Technical information includes information about
                your internet connection and usage details about your interactions with the Services,
                such as clickstream information to, through, and from our Services (including date and
                time), products that you view or search for; page response times, download errors,
                length of your visits to certain pages, page interaction information (such as scrolling,
                clicks, and mouse-overs), or methods used to browse away from a page.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              How We Collect Your Personal and Other Data
            </h2>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">You Provide Information to Us</h3>
            <p className="mt-2">
              We collect information about you when you interact with our Services, including
              information you input or provide to us through our website or mobile application.
            </p>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Automatically Through Our Services
            </h3>
            <p className="mt-2">
              As you navigate through and interact with our Services, we may use automatic data
              collection technologies to collect information that may include personal data. Information
              collected automatically may include usage details, IP addresses, operating system, and
              browser type, and information collected through cookies, web beacons, and other tracking
              technologies including details of your interactions with our Services, such as traffic
              data, location data, logs, and other communication data, and which resources and Services
              features that you access and use.
            </p>
            <p className="mt-2">
              Using automatic collection technologies helps us to improve our Services and to deliver a
              better and more personalized experience.
            </p>
            <p className="mt-2">The technologies we use for this automatic data collection may include:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Cookies.</strong> A cookie is a small file placed on your device when you
                interact with the Services. You may refuse to accept or disable cookies by activating
                the appropriate setting on your browser or device. However, if you select this setting,
                you may be unable to access certain features of the Services.
              </li>
              <li>
                <strong>Web Beacons.</strong> Some parts of the Services may contain small electronic
                files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel
                gifs) that permit the Company, for example, to count users who have visited those parts
                or opened an email and for other related statistics (for example, recording the
                popularity of certain content and verifying system and server integrity).
              </li>
            </ul>
            <p className="mt-2">
              When you interact with the Services, there are third parties that may use automatic
              collection technologies to collect information about your or your device. These third
              parties may include:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Advertisers, ad networks, and ad servers.</li>
              <li>Analytics companies.</li>
            </ul>
            <p className="mt-2">
              These third parties may use tracking technologies to collect information about you when
              you use the Services. The information they collect may be associated with your personal
              data or they may collect information, including personal data, about your online
              activities over time and across different websites, apps, platforms, and other online
              services. They may use this information to provide you with interest-based (behavioral)
              advertising or other targeted content.
            </p>
            <p className="mt-2">
              The third-party service providers we currently use, and to whom information collected by
              cookies, pixel tags, web beacons, or other similar technologies include:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Google Analytics (
                <a
                  href="https://policies.google.com/technologies/cookies?hl=en-US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-700"
                >
                  https://policies.google.com/technologies/cookies?hl=en-US
                </a>
                )
              </li>
              <li>
                Beehiiv (
                <a href="https://www.beehiiv.com/privacy" className="text-sky-600 hover:text-sky-700">
                  https://www.beehiiv.com/privacy
                </a>
                )
              </li>
              <li>
                Anthropic (
                <a href="https://www.anthropic.com/privacy" className="text-sky-600 hover:text-sky-700">
                  https://www.anthropic.com/privacy
                </a>
                )
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">How We Use Your Information</h2>
            <p className="mt-2">
              We use information that we collect about you or that you provide to us, including any
              personal data, to:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Provide you with the Services and any contents, features, information, products, or
                services that we make available through the Services.
              </li>
              <li>Fulfill any other purpose for which you provide it.</li>
              <li>Provide you with notices about your account.</li>
              <li>
                Improve our Services, and to develop, maintain, analyze, improve, optimize, measure, and
                report on our Services and their features and how users interact with them. Our analysis
                may include the use of technology like machine learning and large language models, which
                may include training these models or sharing with third parties for model training.
              </li>
              <li>
                Carry out our obligations and enforce our rights arising from any contracts entered into
                between you and us.
              </li>
              <li>
                Notify you when Services updates are available and about changes to any products or
                services we offer or provide though them.
              </li>
              <li>In any other way we may describe when you provide the information.</li>
              <li>For any other purpose with your consent.</li>
            </ul>
            <p className="mt-2">
              The usage information we collect, whether connected to your personal data or not, helps us
              improve our Services and deliver a better and more personalized experience by enabling us
              to:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Estimate our audience sizes and usage patterns.</li>
              <li>
                Store information about your preferences, allowing us to customize the Services
                according to your individual needs and interests.
              </li>
              <li>Speed up your searches.</li>
              <li>Recognize you when you return to our Services.</li>
            </ul>
            <p className="mt-2">
              We may also use your information to contact you about our goods and services that may be
              of interest to you, with other promotions, or with other general information about our
              Services such as newsletters or blogs. If you do not wish to receive these communications,
              please email us at{" "}
              <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">
                leavigation@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              Who We Disclose Your Information To
            </h2>
            <p className="mt-2">
              We may disclose personal data that we collect or you provide as described in this privacy
              policy:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                To contractors, service providers, and other third parties we use to support our
                organization and who are bound by contractual obligations to keep personal data
                confidential and use it only for the purposes for which we disclose it to them.
              </li>
              <li>
                To a buyer or other successor in the event of a merger, divestiture, restructuring,
                reorganization, dissolution, or other sale or transfer of some or all of the
                Company&apos;s assets, whether as a going concern or as part of bankruptcy, liquidation, or
                similar proceeding, in which personal data held by the Company is among the assets
                transferred.
              </li>
              <li>To fulfill the purpose for which you provide it.</li>
              <li>For any other purpose disclosed by us when you provide the information.</li>
              <li>With your consent.</li>
            </ul>
            <p className="mt-2">We may also disclose your personal data:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                To comply with any court order, law, or legal process, including to respond to any
                government or regulatory request.
              </li>
              <li>
                To enforce or apply our{" "}
                <Link href="/terms" className="text-sky-600 hover:text-sky-700">
                  Terms of Use
                </Link>
                .
              </li>
              <li>
                If we believe disclosure is necessary or appropriate to protect the rights, property, or
                safety of our organization, our users, or others.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              Your Rights and Choices About Your Information
            </h2>
            <p className="mt-2">
              This section describes mechanisms you can use to control certain uses and disclosures of
              your information and rights you may have under state law, depending on where you live.
            </p>
            <p className="mt-2">
              <strong>Advertising, marketing, cookies, and other tracking technologies choices:</strong>
            </p>
            <p className="mt-2">
              <strong>Cookies and Other Tracking Technologies.</strong> You can set your browser to
              refuse all or some browser cookies or other tracking technology files, or to alert you
              when these files are being sent. If you disable or refuse cookies or similar tracking
              files, some Services features may be inaccessible or not function properly. Some browsers
              include a &ldquo;Do Not Track&rdquo; (DNT) setting that can send a signal to the online services you
              visit indicating you do not wish to be tracked. Our Services do not respond to DNT
              signals.
            </p>
            <p className="mt-2">
              <strong>Location data choices:</strong>
            </p>
            <p className="mt-2">
              <strong>Location Data.</strong> You can choose whether or not to allow the Services to
              collect and use real-time information about your device&apos;s location through your
              device&apos;s privacy settings. If you block the use of location information, some Services
              features may become inaccessible or not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              How We Protect Your Personal Data
            </h2>
            <p className="mt-2">
              We use commercially reasonable administrative, physical, and technical measures designed
              to protect your personal data from accidental loss or destruction and from unauthorized
              access, use, alteration, and disclosure. However, no website, mobile application, system,
              electronic storage, or online service is completely secure, and we cannot guarantee the
              security of your personal data transmitted to, through, using, or in connection with the
              Services. In particular, email, texts, and chats sent to or from the Services may not be
              secure, and you should carefully decide what information you send to us via such
              communications channels. Any transmission of personal data is at your own risk.
            </p>
            <p className="mt-2">
              The safety and security of your information also depends on you. You are responsible for
              taking steps to protect your personal data against unauthorized use, disclosure, and
              access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">How We Retain Your Personal Data</h2>
            <p className="mt-2">
              We keep the categories of personal data described in this policy for as long as reasonably
              necessary to fulfill the purposes described or for as otherwise legally permitted or
              required, such as maintaining the Services, operating our organization, complying with our
              legal obligations, resolving disputes, and for safety, security, and fraud prevention.
              This means that we consider our legal and business obligations, potential risks of harm,
              and nature of the information when deciding how long to retain personal data. At the end
              of the retention period, personal data will be deleted, destroyed, or deidentified.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Changes to Our Privacy Policy</h2>
            <p className="mt-2">
              We may update this policy from time to time, and we will provide notice of any such
              changes to the policy as required by law. The date the privacy policy was last updated is
              identified at the top of the page. We will notify you of changes to this policy by
              updating the &ldquo;last updated&rdquo; date and posting the updated policy on our website, mobile
              application, or any other location where we make our Services available. We may email or
              otherwise communicate reminders about this policy, but you should check our Services
              periodically to see the current policy and any changes we have made to it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">Contact Information</h2>
            <p className="mt-2">
              To exercise your rights or ask questions or comment about this privacy policy or our
              privacy practices, contact us at:
            </p>
            <p className="mt-2">
              <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">
                leavigation@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
