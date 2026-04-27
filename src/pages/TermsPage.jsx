import React, { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * TermsPage — adchasser.com/terms
 *
 * IMPORTANT: This is a starting draft tailored for AdChasser (Nigeria, Lagos jurisdiction).
 * Have a Nigerian lawyer review before going live with real payments via Paystack.
 *
 * Placeholders to update before going live:
 *   - Chase Metro Integrated Resources Ltd — your registered Ltd/LLC name
 *   - 1425342 — your CAC registration number
 *   - No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria — your registered office address
 *   - MIN_WITHDRAWAL — the minimum withdrawal amount in NGN
 *   - WITHDRAWAL_FEE — withdrawal fees if any
 *
 * Numbers in this draft are placeholders. Adjust to match your actual platform rules.
 */

const LAST_UPDATED = "27 April 2026";
const EFFECTIVE_DATE = "27 April 2026";

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "definitions", title: "2. Definitions" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "accounts", title: "4. Accounts and Registration" },
  { id: "respondents", title: "5. Terms for Respondents" },
  { id: "earnings", title: "6. Earnings, Withdrawals, and Payments" },
  { id: "brands", title: "7. Terms for Brands and Advertisers" },
  { id: "acceptable-use", title: "8. Acceptable Use" },
  { id: "ip", title: "9. Intellectual Property" },
  { id: "data-rights", title: "10. Survey Response Rights" },
  { id: "fraud", title: "11. Fraud, Quality, and Account Suspension" },
  { id: "disclaimers", title: "12. Disclaimers" },
  { id: "liability", title: "13. Limitation of Liability" },
  { id: "indemnification", title: "14. Indemnification" },
  { id: "termination", title: "15. Termination" },
  { id: "changes", title: "16. Changes to These Terms" },
  { id: "governing-law", title: "17. Governing Law and Dispute Resolution" },
  { id: "general", title: "18. General Provisions" },
  { id: "contact", title: "19. Contact" },
];

export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms of Service — AdChasser";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            AdChasser
          </Link>
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link to="/terms" className="text-gray-900 font-medium">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link to="/" className="hover:text-gray-900">Home</Link>
          </nav>
        </div>
      </header>

      {/* Title */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-sm text-gray-600">
            Effective date: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-6 text-base text-gray-700 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of AdChasser.
            By creating an account or using the platform, you agree to be bound by these
            Terms and our Privacy Policy. Please read them carefully.
          </p>
          <div className="mt-6 rounded border-l-4 border-amber-500 bg-amber-50 p-4 text-sm">
            <strong>Important:</strong> By using AdChasser, you confirm that you are at
            least 18 years old, that you reside in Nigeria, and that you have read and
            understood these Terms.
          </div>
        </div>
      </section>

      {/* TOC */}
      <aside className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Table of Contents
          </h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-blue-600 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Body */}
      <main className="mx-auto max-w-4xl px-6 pb-24">
        <article className="prose prose-gray max-w-none space-y-10 text-gray-800 leading-relaxed">

          {/* 1. Acceptance */}
          <section id="acceptance">
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p>
              These Terms form a legally binding agreement between you and{" "}
              <strong>Chase Metro Integrated Resources Ltd</strong> (operating as
              "AdChasser," "we," "us," or "our"), a company registered in Nigeria
              under the Corporate Affairs Commission (RC Number:{" "}
              <strong>1425342</strong>), with its registered office at No 51 Street
              Oladipo Obateye, Ikeja GRA, Lagos, Nigeria. AdChasser is a product owned
              and operated by Chase Metro Integrated Resources Ltd. By accessing or
              using our website or any service offered through adchasser.com, you
              agree to comply with and be bound by these Terms. If you do not agree,
              you must not use AdChasser.
            </p>
          </section>

          {/* 2. Definitions */}
          <section id="definitions">
            <h2 className="text-2xl font-bold mb-3">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>"Platform"</strong> — the AdChasser website and all services made available through it.</li>
              <li><strong>"User"</strong> — any person who accesses or uses the Platform, including Respondents and Brands.</li>
              <li><strong>"Respondent"</strong> — a User who registers to participate in surveys for compensation.</li>
              <li><strong>"Brand"</strong> or <strong>"Advertiser"</strong> — a User who commissions surveys or accesses insights through the Platform.</li>
              <li><strong>"Survey"</strong> — any questionnaire, study, or research instrument made available on the Platform.</li>
              <li><strong>"Earnings"</strong> — credits accrued in a Respondent's wallet through verified survey completions.</li>
              <li><strong>"Withdrawal"</strong> — the transfer of Earnings to a Respondent's bank account.</li>
            </ul>
          </section>

          {/* 3. Eligibility */}
          <section id="eligibility">
            <h2 className="text-2xl font-bold mb-3">3. Eligibility</h2>
            <p>To use AdChasser, you must:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Be at least 18 years of age</li>
              <li>Be a resident of Nigeria with a valid Nigerian bank account (for Respondents who wish to withdraw)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be barred from using AdChasser under Nigerian law or by previous suspension or termination by us</li>
            </ul>
            <p className="mt-3">
              By registering, you represent and warrant that all information you
              provide is true, accurate, current, and complete.
            </p>
          </section>

          {/* 4. Accounts */}
          <section id="accounts">
            <h2 className="text-2xl font-bold mb-3">4. Accounts and Registration</h2>
            <p>
              You may register using a valid email address and password, or through
              Google sign-in. You agree to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information when it changes</li>
              <li>Be responsible for all activity that occurs under your account</li>
              <li>Notify us immediately of any unauthorised access at <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">privacy@adchasser.com</a></li>
            </ul>
            <p className="mt-3">
              You may only operate one account. Creating multiple accounts to claim
              additional rewards is prohibited and grounds for immediate termination
              and forfeiture of Earnings.
            </p>
          </section>

          {/* 5. Respondents */}
          <section id="respondents">
            <h2 className="text-2xl font-bold mb-3">5. Terms for Respondents</h2>
            <p>If you participate as a Respondent, you agree that:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>You will provide truthful, considered answers to all surveys</li>
              <li>You will complete onboarding demographic information accurately</li>
              <li>You understand that Survey availability depends on your demographic profile and Brand requirements</li>
              <li>You may be screened out of a Survey at any point, including before completion, if you do not match the Survey's target audience</li>
              <li>Survey rewards are credited only after the response passes our quality checks</li>
              <li>Falsifying answers, rushing through Surveys, providing inconsistent or low-quality responses, or using bots or scripts will void your Earnings and may result in account termination</li>
              <li>You will not share your account or sell access to it</li>
            </ul>
          </section>

          {/* 6. Earnings, Withdrawals, Payments */}
          <section id="earnings">
            <h2 className="text-2xl font-bold mb-3">6. Earnings, Withdrawals, and Payments</h2>

            <h3 className="text-lg font-semibold mt-3">a. Earning Credits</h3>
            <p className="mt-2">
              When you complete a Survey, the associated reward is added to your wallet
              as a "pending" balance. After our automated quality review (typically
              within 24 hours), Earnings are moved to your "approved" balance, which is
              available for withdrawal. We may extend the review window for Surveys
              flagged for further inspection.
            </p>

            <h3 className="text-lg font-semibold mt-5">b. Quality Review</h3>
            <p className="mt-2">
              Earnings may be voided if a response is found to be of insufficient
              quality, inconsistent with prior responses, completed unusually fast, or
              otherwise non-compliant with these Terms. Decisions on quality are at our
              reasonable discretion.
            </p>

            <h3 className="text-lg font-semibold mt-5">c. Withdrawals</h3>
            <p className="mt-2">
              Withdrawals are processed through Paystack to a verified Nigerian bank
              account that you provide. The minimum withdrawal amount, applicable fees,
              and processing times are displayed in your wallet at the time of request
              and may be updated from time to time. You are responsible for providing
              accurate bank details; AdChasser is not liable for funds sent to incorrect
              accounts due to information you provided.
            </p>

            <h3 className="text-lg font-semibold mt-5">d. Currency and Taxes</h3>
            <p className="mt-2">
              All Earnings and Withdrawals are denominated in Nigerian Naira (NGN). You
              are responsible for any taxes, levies, or charges applicable to Earnings
              under Nigerian law. We may be required to withhold or report amounts in
              line with Nigerian tax obligations.
            </p>

            <h3 className="text-lg font-semibold mt-5">e. Forfeiture</h3>
            <p className="mt-2">
              Earnings are forfeited and not payable in the event of:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Account termination for violation of these Terms</li>
              <li>Confirmed fraud, multiple accounts, or bot activity</li>
              <li>Account inactivity for more than 12 consecutive months (after notice and opportunity to withdraw)</li>
            </ul>
          </section>

          {/* 7. Brands */}
          <section id="brands">
            <h2 className="text-2xl font-bold mb-3">7. Terms for Brands and Advertisers</h2>
            <p>If you use AdChasser as a Brand or Advertiser, you agree that:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>You will use insights and Survey responses solely for the purposes agreed at the time of commissioning</li>
              <li>You will not attempt to identify, contact, or target individual Respondents using data obtained from the Platform</li>
              <li>Surveys you commission must comply with Nigerian law, advertising standards, and these Terms</li>
              <li>You may not commission Surveys that are misleading, deceptive, defamatory, or that promote illegal goods or services</li>
              <li>Fees, billing, and credit terms are governed by your separate commercial agreement with AdChasser</li>
              <li>You retain ownership of brief content you supply, but grant us the licence necessary to deliver the Survey on the Platform</li>
            </ul>
          </section>

          {/* 8. Acceptable Use */}
          <section id="acceptable-use">
            <h2 className="text-2xl font-bold mb-3">8. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Use the Platform for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to gain unauthorised access to any part of the Platform, other accounts, or our systems</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
              <li>Use automated tools (bots, scrapers, scripts) to interact with the Platform without our written consent</li>
              <li>Interfere with or disrupt the Platform, servers, or networks</li>
              <li>Upload or transmit viruses, malware, or other harmful code</li>
              <li>Impersonate another person or misrepresent your identity</li>
              <li>Harass, threaten, or harm other Users</li>
              <li>Collect, store, or share other Users' personal information without their consent</li>
              <li>Use the Platform to send spam or unsolicited messages</li>
            </ul>
          </section>

          {/* 9. IP */}
          <section id="ip">
            <h2 className="text-2xl font-bold mb-3">9. Intellectual Property</h2>
            <p>
              The AdChasser name, logo, website design, software, content, and all
              related intellectual property are owned by AdChasser or our licensors and
              are protected by copyright, trademark, and other applicable laws. You are
              granted a limited, non-exclusive, non-transferable, revocable licence to
              access and use the Platform for its intended purpose. No other rights or
              licences are granted, expressly or by implication.
            </p>
          </section>

          {/* 10. Data Rights */}
          <section id="data-rights">
            <h2 className="text-2xl font-bold mb-3">10. Survey Response Rights</h2>
            <p>
              By submitting Survey responses, you grant AdChasser a perpetual,
              worldwide, royalty-free, sub-licensable licence to use, store, reproduce,
              modify, aggregate, anonymise, and share those responses for the purposes
              of:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Delivering insights to the commissioning Brand</li>
              <li>Improving the Platform and our services</li>
              <li>Generating aggregated, anonymised research and benchmarks</li>
            </ul>
            <p className="mt-3">
              We will not publicly attribute responses to you by name or share
              personally identifiable response data with Brands without your additional,
              specific consent. See our{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>{" "}
              for details.
            </p>
          </section>

          {/* 11. Fraud */}
          <section id="fraud">
            <h2 className="text-2xl font-bold mb-3">11. Fraud, Quality, and Account Suspension</h2>
            <p>
              We use automated and manual systems to detect fraud, low-quality
              responses, duplicate accounts, and abuse. We may, at our sole discretion
              and without prior notice:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Suspend or terminate accounts</li>
              <li>Void Earnings, including those previously approved, where fraud is detected</li>
              <li>Reverse Withdrawals where required by Paystack or our risk policies</li>
              <li>Refuse withdrawal requests pending additional verification</li>
              <li>Require KYC documentation (e.g., government-issued ID) before approving high-value Withdrawals</li>
            </ul>
            <p className="mt-3">
              You may appeal a decision by emailing{" "}
              <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">privacy@adchasser.com</a>
              . We will review appeals in good faith but reserve the right to make final
              determinations.
            </p>
          </section>

          {/* 12. Disclaimers */}
          <section id="disclaimers">
            <h2 className="text-2xl font-bold mb-3">12. Disclaimers</h2>
            <p>
              The Platform is provided on an "as is" and "as available" basis. To the
              maximum extent permitted by law, AdChasser disclaims all warranties,
              whether express, implied, statutory, or otherwise, including warranties
              of merchantability, fitness for a particular purpose, non-infringement,
              and uninterrupted or error-free operation.
            </p>
            <p className="mt-3">
              We do not guarantee:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>That Surveys will be available at all times</li>
              <li>That you will qualify for any particular Survey</li>
              <li>The accuracy, reliability, or completeness of Survey content</li>
              <li>Specific earning levels or income from using the Platform</li>
              <li>Continuous, uninterrupted, or secure access to the Platform</li>
            </ul>
          </section>

          {/* 13. Liability */}
          <section id="liability">
            <h2 className="text-2xl font-bold mb-3">13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Nigerian law, AdChasser, its
              directors, employees, agents, and affiliates shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              including loss of profits, data, goodwill, or other intangible losses
              arising from or related to your use of the Platform.
            </p>
            <p className="mt-3">
              Our total aggregate liability to you for any claim arising under or in
              connection with these Terms shall not exceed the greater of (a) the
              total amount of Earnings paid to you in the 12 months preceding the
              claim, or (b) NGN 50,000.
            </p>
            <p className="mt-3">
              Nothing in these Terms limits or excludes liability that cannot be
              limited or excluded under Nigerian law, including liability for fraud or
              wilful misconduct.
            </p>
          </section>

          {/* 14. Indemnification */}
          <section id="indemnification">
            <h2 className="text-2xl font-bold mb-3">14. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless AdChasser, its
              directors, officers, employees, and affiliates from and against any
              claims, liabilities, damages, losses, and expenses (including reasonable
              legal fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of any third party</li>
              <li>Any content or data you submit to the Platform</li>
            </ul>
          </section>

          {/* 15. Termination */}
          <section id="termination">
            <h2 className="text-2xl font-bold mb-3">15. Termination</h2>
            <p>
              You may terminate your account at any time by contacting{" "}
              <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">privacy@adchasser.com</a>
              . Upon termination, your access to the Platform will end and any
              approved Earnings, subject to our quality review and these Terms, may be
              withdrawn before closure.
            </p>
            <p className="mt-3">
              We may suspend or terminate your account immediately, without notice or
              liability, if you breach these Terms, engage in fraud, or for any other
              reason at our reasonable discretion. Sections that by their nature
              should survive termination (including Intellectual Property, Limitation
              of Liability, Indemnification, and Governing Law) shall continue to
              apply after termination.
            </p>
          </section>

          {/* 16. Changes */}
          <section id="changes">
            <h2 className="text-2xl font-bold mb-3">16. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material
              changes, we will notify you by email and post a notice on the Platform
              before the changes take effect. The "Last updated" date at the top of
              this page reflects the most recent revision. Your continued use of the
              Platform after the effective date constitutes acceptance of the revised
              Terms.
            </p>
          </section>

          {/* 17. Governing Law */}
          <section id="governing-law">
            <h2 className="text-2xl font-bold mb-3">17. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of
              the Federal Republic of Nigeria, without regard to conflict-of-law
              principles.
            </p>
            <p className="mt-3">
              Any dispute arising out of or in connection with these Terms shall first
              be addressed by good-faith negotiation between the parties. If
              unresolved within 30 days, the dispute shall be referred to mediation
              before a mediator agreed by both parties. If mediation fails, the
              dispute shall be finally resolved by the competent courts of Lagos
              State, Nigeria.
            </p>
          </section>

          {/* 18. General */}
          <section id="general">
            <h2 className="text-2xl font-bold mb-3">18. General Provisions</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Entire agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and AdChasser regarding the Platform.</li>
              <li><strong>Severability:</strong> If any provision is held invalid or unenforceable, the remaining provisions remain in full force.</li>
              <li><strong>No waiver:</strong> Our failure to enforce any right or provision is not a waiver of that right or provision.</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our prior written consent. We may assign our rights and obligations to any affiliate or successor.</li>
              <li><strong>Force majeure:</strong> We are not liable for delays or failures in performance caused by events beyond our reasonable control.</li>
              <li><strong>Notices:</strong> We may send notices to the email address associated with your account. Notices to us must be sent to privacy@adchasser.com.</li>
            </ul>
          </section>

          {/* 19. Contact */}
          <section id="contact">
            <h2 className="text-2xl font-bold mb-3">19. Contact</h2>
            <p>For questions about these Terms, please contact us:</p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <p className="font-semibold">Chase Metro Integrated Resources Ltd</p>
              <p className="text-sm text-gray-700 mt-1">
                Email:{" "}
                <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">
                  privacy@adchasser.com
                </a>
              </p>
              <p className="text-sm text-gray-700">Address: No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria</p>
              <p className="text-sm text-gray-700">RC Number: 1425342</p>
            </div>
          </section>

        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} Chase Metro Integrated Resources Ltd. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">AdChasser is a product of Chase Metro Integrated Resources Ltd (RC 1425342).</p>
          </div>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
