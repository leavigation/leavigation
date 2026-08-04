import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Leavigation | Terms of Use" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Leavigation Terms of Use</h1>
          <a href="/plan" className="text-sm font-medium text-sky-600 hover:text-sky-700">
            ← Back to planner
          </a>
        </header>
        <p className="text-xs text-slate-400 mb-8">Last Modified: August 3, 2026</p>
        <div className="space-y-6 text-sm leading-relaxed text-slate-800">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Acceptance of the Terms of Use</h2>
            <p className="mt-2">
              These terms of use are entered into by and between you and Leavigation, LLC, a New Mexico
              limited liability company (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;). The following terms and
              conditions, together with any documents expressly incorporated by reference (collectively,
              &ldquo;Terms of Use&rdquo;), govern your access to and use of the Leavigation platform, including any
              content, functionality, and services offered on or through www.leavigation.com website
              (collectively, the &ldquo;Website&rdquo;).
            </p>
            <p className="mt-2">
              Please read the Terms of Use carefully before you start to use the Website. By using the
              Website, you accept and agree to be bound and abide by these Terms of Use. If you do not
              want to agree to these Terms of Use, you must not access or use the Website.
            </p>
            <p className="mt-2">
              This Website is offered and available to users who are 18 years of age or older, and
              reside in the United States or any of its territories or possessions. By using this
              Website, you represent and warrant that you are of legal age to form a binding contract
              with the Company and reside in the United States or its territories or possessions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Changes to the Terms of Use</h2>
            <p className="mt-2">
              We may revise and update these Terms of Use from time to time in our sole discretion. All
              changes are effective immediately when we post them, and apply to all access to and use of
              the Website thereafter. However, any changes to the dispute resolution provisions set out
              in Sections 12 and 13 will not apply to any disputes for which the parties have actual
              notice before the date the change is posted on the Website.
            </p>
            <p className="mt-2">
              Your continued use of the Website following the posting of revised Terms of Use means that
              you accept and agree to the changes. You are expected to check this page from time to time
              so you are aware of any changes, as they are binding on you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Accessing and Using the Website</h2>
            <p className="mt-2">
              We reserve the right to withdraw or amend this Website, and any service or material we
              provide on the Website, in our sole discretion without notice. We will not be liable if
              for any reason all or any part of the Website is unavailable at any time or for any
              period. From time to time, we may restrict user access, to some parts of the Website or
              the entire Website.
            </p>
            <p className="mt-2">
              We may update the content on this Website from time to time, but its content is not
              necessarily complete or up-to-date. Any of the material on the Website may be out of date
              at any given time, and we are under no obligation to update such material.
            </p>
            <p className="mt-2">
              To access the Website or some of the resources it offers, you may be asked to provide
              certain personal information. It is a condition of your use of the Website that all the
              information you provide on the Website is correct, current, and complete. All information
              you provide to us through the Website or otherwise, including, but not limited to,
              through the use of any interactive features on the Website, is governed by our{" "}
              <Link href="/privacy" className="text-sky-600 hover:text-sky-700">
                Privacy Policy
              </Link>
              , and you consent to all actions we take with respect to your information that is
              consistent with our Privacy Policy.
            </p>
            <p className="mt-2">
              We have the right to disable, terminate, or suspend your use of the Website if, in our
              opinion, you have violated any provision of these Terms of Use.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Intellectual Property Rights</h2>
            <p className="mt-2">
              The Website and its entire contents, features, and functionality (including but not
              limited to all information, software, text, displays, images, video, and audio, and the
              design, selection, and arrangement thereof) are owned by the Company, its licensors, or
              other providers of such material and are protected by United States and international
              copyright, trademark, patent, trade secret, and other intellectual property or proprietary
              rights laws.
            </p>
            <p className="mt-2">
              These Terms of Use permit you to use the Website for your personal, non-commercial use
              only. You must not reproduce, distribute, modify, create derivative works of, publicly
              display, publicly perform, republish, download, store, or transmit any of the material on
              our Website, except as follows:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Your computer may temporarily store copies of such materials in RAM incidental to your
                accessing and viewing those materials.
              </li>
              <li>
                You may store files that are automatically cached by your Web browser for display
                enhancement purposes.
              </li>
              <li>
                You may print or download a reasonable number of copies of a reasonable number of pages
                of the Website for your own personal, non-commercial use and not for further
                reproduction, publication, or distribution.
              </li>
              <li>
                If we provide desktop, mobile, or other applications for download, you may download a
                single copy to your computer or mobile device solely for your own personal,
                non-commercial use, provided you agree to be bound by our end user license agreement for
                such applications.
              </li>
            </ul>
            <p className="mt-2">You must not:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Modify copies of any materials from this site.</li>
              <li>
                Use any illustrations, photographs, video or audio sequences, or any graphics separately
                from the accompanying text.
              </li>
              <li>
                Delete or alter any copyright, trademark, or other proprietary rights notices from
                copies of materials from this site.
              </li>
              <li>
                Use for any commercial purposes any part of the Website or any services or materials
                available through the Website.
              </li>
              <li>
                Reverse engineer, decompile, disassemble, attempt to discover, or create derivative
                works from the Website or any portion thereof, including without limitation any software
                component of the Website.
              </li>
            </ul>
            <p className="mt-2">
              If you wish to make any use of material on the Website other than that set out in this
              Section 4, please address your request to:{" "}
              <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">
                leavigation@gmail.com
              </a>
              .
            </p>
            <p className="mt-2">
              If you print, copy, modify, download, or otherwise use or provide any other person with
              access to any part of the Website in breach of the Terms of Use, your right to use the
              Website will stop immediately and you must, at our option, return or destroy any copies of
              the materials you have made. No right, title, or interest in or to the Website or any
              content on the Website is transferred to you, and all rights not expressly granted are
              reserved by the Company. Any use of the Website not expressly permitted by these Terms of
              Use is a breach of these Terms of Use and may violate copyright, trademark, and other
              laws.
            </p>
            <p className="mt-2">
              <strong>Trademarks.</strong> The Company name, the term LEAVIGATION, and all related
              names, logos, product and service names, designs, and slogans are trademarks of the
              Company or its affiliates or licensors. You must not use such marks without the prior
              written permission of the Company. All other names, logos, product and service names,
              designs, and slogans on this Website are the trademarks of their respective owners.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Prohibited Uses</h2>
            <p className="mt-2">
              You may use the Website only for lawful purposes and in accordance with these Terms of
              Use. You agree not to use the Website:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                In any way that violates any applicable federal, state, local, or international law or
                regulation (including, without limitation, any laws regarding the export of data or
                software to and from the US or other countries).
              </li>
              <li>
                For the purpose of exploiting, harming, or attempting to exploit or harm minors in any
                way by exposing them to inappropriate content, asking for personally identifiable
                information, or otherwise.
              </li>
              <li>
                To transmit, or procure the sending of, any advertising or promotional material,
                including any &ldquo;junk mail,&rdquo; &ldquo;chain letter,&rdquo; &ldquo;spam,&rdquo; or any other similar
                solicitation.
              </li>
              <li>
                To impersonate or attempt to impersonate the Company, a Company employee, another user,
                or any other person or entity (including, without limitation, by using email addresses
                associated with any of the foregoing).
              </li>
              <li>
                To engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of
                the Website, or which, as determined by us, may harm the Company or users of the
                Website, or expose them to liability.
              </li>
            </ul>
            <p className="mt-2">Additionally, you agree not to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Use the Website in any manner that could disable, overburden, damage, or impair the site
                or interfere with any other party&apos;s use of the Website, including their ability to
                engage in real time activities through the Website.
              </li>
              <li>
                Use any robot, spider, or other automatic device, process, or means to access the
                Website for any purpose, including monitoring or copying any of the material on the
                Website.
              </li>
              <li>
                Use any manual process to monitor or copy any of the material on the Website, or for any
                other purpose not expressly authorized in these Terms of Use, without our prior written
                consent.
              </li>
              <li>Use any device, software, or routine that interferes with the proper working of the Website.</li>
              <li>
                Introduce any viruses, Trojan horses, worms, logic bombs, or other material that is
                malicious or technologically harmful.
              </li>
              <li>
                Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of
                the Website, the server on which the Website is stored, or any server, computer, or
                database connected to the Website.
              </li>
              <li>
                Attack the Website via a denial-of-service attack or a distributed denial-of-service
                attack.
              </li>
              <li>Otherwise attempt to interfere with the proper working of the Website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              6. Monitoring and Enforcement; Termination
            </h2>
            <p className="mt-2">We have the right to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Take any action with respect to your use of the Website that we deem necessary or
                appropriate in our sole discretion, including if we believe that your use of the
                violates the Terms of Use, infringes any intellectual property right or other right of
                any person or entity, threatens the personal safety of users of the Website or the
                public, or could create liability for the Company.
              </li>
              <li>
                Disclose your identity or other information about you to any third party who claims that
                material posted by you violates their rights, including their intellectual property
                rights or their right to privacy.
              </li>
              <li>
                Take appropriate legal action, including without limitation, referral to law
                enforcement, for any illegal or unauthorized use of the Website.
              </li>
              <li>
                Terminate or suspend your access to all or part of the Website for any violation of
                these Terms of Use.
              </li>
            </ul>
            <p className="mt-2">
              Without limiting the foregoing, we have the right to cooperate fully with any law
              enforcement authorities or court order requesting or directing us to disclose the identity
              or other information of anyone posting any materials on or through the Website. YOU WAIVE
              AND HOLD HARMLESS THE COMPANY AND ITS AFFILIATES, LICENSEES, AND SERVICE PROVIDERS FROM
              ANY CLAIMS RESULTING FROM ANY ACTION TAKEN BY ANY OF THE FOREGOING PARTIES DURING, OR
              TAKEN AS A CONSEQUENCE OF, INVESTIGATIONS BY EITHER SUCH PARTIES OR LAW ENFORCEMENT
              AUTHORITIES.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Reliance on Information Posted</h2>
            <p className="mt-2">
              This Website is provided as an informational tool designed to help individuals understand
              how parental leave programs may apply to their situation. The information provided on this
              Website does not constitute legal, financial, employment, or benefits advice. It is
              intended for general informational purposes only. We do not warrant the accuracy,
              completeness, or usefulness of this information. Any reliance you place on such
              information is strictly at your own risk. We disclaim all liability and responsibility
              arising from any reliance placed on such materials by you or any other visitor to the
              Website, or by anyone who may be informed of any of its contents.
            </p>
            <p className="mt-2">
              Nothing on this Website should be relied upon as a substitute for consultation with a
              qualified attorney, human resources professional, financial advisor, or benefits
              specialist. Every individual&apos;s situation is unique, and leave entitlements depend on
              factors including but not limited to employer size, employer policies, tenure, hours
              worked, state of employment, and applicable collective bargaining agreements.
            </p>
            <p className="mt-2">
              The leave entitlements, dollar estimates, timelines and other related information provided
              to you through your use of this Website are estimates only. Estimated dollar amounts shown
              are approximations based on the information you provide to us, as well as publicly
              available benefit rates. Such estimated dollar amounts do not account for taxes, benefit
              coordination rules specific to your employer&apos;s plan, or individual eligibility
              determinations. Actual amounts may be higher or lower than estimated. Actual benefits you
              receive will depend on your specific eligibility, your employer&apos;s policies, your claims
              history, and determinations made by your employer and/or state agency.
            </p>
            <p className="mt-2">
              This Website covers federal law (FMLA) and selected state and municipal leave programs. It
              does not cover every applicable law in every jurisdiction. Municipal and local ordinances
              vary widely and change frequently. State and local paid leave programs, benefit rates,
              weekly caps, and eligibility rules are updated, revised, amended, rescinded, or otherwise
              changed regularly by applicable government agencies. The information on this Website may
              not reflect the most recent legislative changes. If you work in a city or county not
              covered by this Website, additional protections, benefits, restrictions, or conditions may
              apply.
            </p>
            <p className="mt-2">
              Use of this Website does not create any professional-client relationship between you and
              the Company, its affiliates, or its licensors.
            </p>
            <p className="mt-2">
              We make every effort to keep the information on this Website current and accurate.
              However, we do not guarantee that all information is complete, accurate, or up to date at
              the time of your use. Always verify current rules directly with your state&apos;s
              administering agency, your employer&apos;s human resources department, and a qualified
              professional before making leave decisions.
            </p>
            <p className="mt-2">
              This Website may include content provided by third parties, including links to third party
              website such as official agency websites. All statements and/or opinions expressed in
              these materials, and all articles and responses to questions and other content, other than
              the content provided by the Company, are solely the opinions and the responsibility of the
              person or entity providing those materials. These materials do not necessarily reflect the
              opinion of the Company. We are not responsible, or liable to you or any third party, for
              the content or accuracy of any materials provided by any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Disclaimer of Warranties</h2>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              TO THE FULLEST EXTENT PROVIDED BY LAW, WE WILL NOT BE LIABLE FOR ANY LOSS OR DAMAGE CAUSED
              BY A DISTRIBUTED DENIAL-OF-SERVICE ATTACK, VIRUSES, OR OTHER TECHNOLOGICALLY HARMFUL
              MATERIAL THAT MAY INFECT YOUR COMPUTER EQUIPMENT, COMPUTER PROGRAMS, DATA, OR OTHER
              PROPRIETARY MATERIAL DUE TO YOUR USE OF THE WEBSITE OR ANY SERVICES OR ITEMS OBTAINED
              THROUGH THE WEBSITE OR YOUR DOWNLOADING OF ANY MATERIAL POSTED ON IT, OR ON ANY WEBSITE
              LINKED TO IT.
            </p>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              YOUR USE OF THE WEBSITE, ITS CONTENT, AND ANY SERVICES OR ITEMS OBTAINED THROUGH THE
              WEBSITE IS AT YOUR OWN RISK. THE WEBSITE, ITS CONTENT, AND ANY SERVICES OR ITEMS OBTAINED
              THROUGH THE WEBSITE ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT ANY
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER THE COMPANY NOR ANY PERSON
              ASSOCIATED WITH THE COMPANY MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE
              COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE WEBSITE.
              WITHOUT LIMITING THE FOREGOING, NEITHER THE COMPANY NOR ANYONE ASSOCIATED WITH THE
              COMPANY REPRESENTS OR WARRANTS THAT THE WEBSITE, ITS CONTENT, OR ANY SERVICES OR ITEMS
              OBTAINED THROUGH THE WEBSITE WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT
              DEFECTS WILL BE CORRECTED, THAT OUR SITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF
              VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT THE WEBSITE OR ANY SERVICES OR ITEMS OBTAINED
              THROUGH THE WEBSITE WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
            </p>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              TO THE FULLEST EXTENT PROVIDED BY LAW, THE COMPANY HEREBY DISCLAIMS ALL WARRANTIES OF ANY
              KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO
              ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
            </p>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              THE FOREGOING DOES NOT AFFECT ANY WARRANTIES THAT CANNOT BE EXCLUDED OR LIMITED UNDER
              APPLICABLE LAW.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. Limitation on Liability</h2>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO EVENT WILL THE COMPANY, ITS AFFILIATES, OR
              THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE
              FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR
              USE, OR INABILITY TO USE, THE WEBSITE, ANY WEBSITES LINKED TO IT, ANY CONTENT ON THE
              WEBSITE OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN
              AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR
              ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY
              TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
            </p>
            <p className="mt-2">
              The limitation of liability set out above does not apply to liability resulting from our
              gross negligence or willful misconduct.
            </p>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              THE FOREGOING DOES NOT AFFECT ANY LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER
              APPLICABLE LAW.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">10. Indemnification</h2>
            <p className="mt-2">
              You agree to defend, indemnify, and hold harmless the Company, its affiliates, licensors,
              and service providers, and its and their respective officers, directors, employees,
              contractors, agents, licensors, suppliers, successors, and assigns from and against any
              claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees
              (including reasonable attorneys&apos; fees) arising out of or relating to your violation of
              these Terms of Use or your use of the Website, including, but not limited to your use of
              any information obtained from the Website.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              11. Governing Law and Jurisdiction
            </h2>
            <p className="mt-2">
              All matters relating to the Website and these Terms of Use, and any dispute or claim
              arising therefrom or related thereto (in each case, including non-contractual disputes or
              claims), shall be governed by and construed in accordance with the internal laws of the
              State of New Mexico without giving effect to any choice or conflict of law provision or
              rule (whether of the New Mexico or any other jurisdiction).
            </p>
            <p className="mt-2">
              Any legal suit, action, or proceeding arising out of, or related to, these Terms of Use or
              the Website shall be instituted exclusively in the federal courts of the United States or
              the courts of the State of New Mexico, in each case located in the County of Bernalillo,
              although we retain the right to bring any suit, action, or proceeding against you for
              breach of these Terms of Use in your country of residence or any other relevant country.
              You waive any and all objections to the exercise of jurisdiction over you by such courts
              and to venue in such courts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">12. Arbitration</h2>
            <p className="mt-2">
              At Company&apos;s sole discretion, it may require you to submit any disputes arising from these
              Terms of Use or use of the Website, including disputes arising from or concerning their
              interpretation, violation, invalidity, non-performance, or termination, to final and
              binding arbitration under the Rules of Arbitration of the American Arbitration Association
              applying the Commercial Arbitration Rules to be conducted in Bernalillo County, New
              Mexico.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              13. Limitation on Time to File Claims
            </h2>
            <p className="mt-2 uppercase text-xs leading-relaxed">
              ANY CAUSE OF ACTION OR CLAIM YOU MAY HAVE ARISING OUT OF OR RELATING TO THESE TERMS OF USE
              OR THE WEBSITE MUST BE COMMENCED WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES;
              OTHERWISE, SUCH CAUSE OF ACTION OR CLAIM IS PERMANENTLY BARRED.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">14. Waiver and Severability</h2>
            <p className="mt-2">
              No waiver by the Company of any term or condition set out in these Terms of Use shall be
              deemed a further or continuing waiver of such term or condition or a waiver of any other
              term or condition, and any failure of the Company to assert a right or provision under
              these Terms of Use shall not constitute a waiver of such right or provision.
            </p>
            <p className="mt-2">
              If any provision of these Terms of Use is held by a court or other tribunal of competent
              jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall
              be eliminated or limited to the minimum extent such that the remaining provisions of the
              Terms of Use will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">15. Entire Agreement</h2>
            <p className="mt-2">
              The Terms of Use and our{" "}
              <Link href="/privacy" className="text-sky-600 hover:text-sky-700">
                Privacy Policy
              </Link>{" "}
              constitute the sole and entire agreement between you and the Company regarding the Website
              and supersede all prior and contemporaneous understandings, agreements, representations,
              and warranties, both written and oral, regarding the Website.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">16. Your Comments and Concerns</h2>
            <p className="mt-2">
              This Website is operated by Leavigation, LLC with an address of 6300 Riverside Plaza Ln.
              NW, Ste 118 #569571, Albuquerque, NM 87120.
            </p>
            <p className="mt-2">
              All other feedback, comments, requests for technical support, and other communications
              relating to the Website should be directed to:{" "}
              <a href="mailto:leavigation@gmail.com" className="text-sky-600 hover:text-sky-700">
                leavigation@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
