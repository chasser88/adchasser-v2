import React, { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * PrivacyPage — adchasser.com/privacy
 *
 * IMPORTANT: This is a starting draft tailored for AdChasser (Nigeria, NDPA 2023).
 * Have a Nigerian lawyer review before going live with real payments via Paystack.
 *
 * Placeholders to update before going live:
 *   - Chase Metro Integrated Resources Ltd — your registered Ltd/LLC name (e.g., "AdChasser Limited")
 *   - 1425342 — your CAC registration number
 *   - No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria — your registered office address in Nigeria
 *   - LAST_UPDATED — already set to today; update on future revisions
 */

const LAST_UPDATED = "27 April 2026";
const EFFECTIVE_DATE = "27 April 2026";

const sections = [
  { id: "intro", title: "1. Introduction" },
  { id: "who-we-are", title: "2. Who We Are" },
  { id: "info-we-collect", title: "3. Information We Collect" },
  { id: "how-we-use", title: "4. How We Use Your Information" },
  { id: "legal-basis", title: "5. Legal Basis for Processing (NDPA)" },
  { id: "how-we-share", title: "6. How We Share Your Information" },
  { id: "third-party", title: "7. Third-Party Services" },
  { id: "international", title: "8. International Data Transfers" },
  { id: "retention", title: "9. Data Retention" },
  { id: "security", title: "10. Data Security" },
  { id: "your-rights", title: "11. Your Rights Under NDPA" },
  { id: "cookies", title: "12. Cookies and Tracking" },
  { id: "children", title: "13. Children's Privacy" },
  { id: "changes", title: "14. Changes to This Policy" },
  { id: "contact", title: "15. Contact Us" },
];

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy — AdChasser";
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
            <Link to="/terms" className="hover:text-gray-900">Terms</Link>
            <Link to="/privacy" className="text-gray-900 font-medium">Privacy</Link>
            <Link to="/" className="hover:text-gray-900">Home</Link>
          </nav>
        </div>
      </header>

      {/* Title */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-sm text-gray-600">
            Effective date: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-6 text-base text-gray-700 leading-relaxed">
            This Privacy Policy explains how AdChasser collects, uses, shares, and
            protects your personal information when you use our website and services.
            We are committed to handling your data responsibly and in compliance with
            the Nigeria Data Protection Act, 2023 (NDPA) and related regulations.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
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

          {/* 1. Introduction */}
          <section id="intro">
            <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
            <p>
              AdChasser is a product owned and operated by{" "}
              <strong>Chase Metro Integrated Resources Ltd</strong> ("we," "us," or
              "our"), a private limited company incorporated in the Federal Republic
              of Nigeria. AdChasser is a brand campaign intelligence platform that
              connects brands and advertisers with Nigerian respondents through paid
              surveys. This Privacy Policy describes
              how we collect, use, store, share, and protect personal information from:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Visitors to adchasser.com</li>
              <li>Respondents who participate in surveys through our panel</li>
              <li>Brands, advertisers, and clients who use our platform</li>
            </ul>
            <p className="mt-3">
              By accessing or using AdChasser, you agree to the practices described in
              this Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          {/* 2. Who We Are */}
          <section id="who-we-are">
            <h2 className="text-2xl font-bold mb-3">2. Who We Are</h2>
            <p>
              AdChasser is owned and operated by{" "}
              <strong>Chase Metro Integrated Resources Ltd</strong>, a company
              registered in Nigeria under the Corporate Affairs Commission (RC Number:
              <strong> 1425342</strong>), with its registered office at{" "}
              <strong>No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria</strong>.
            </p>
            <p className="mt-3">
              For the purposes of the Nigeria Data Protection Act, 2023, Chase Metro
              Integrated Resources Ltd (operating as AdChasser) is the{" "}
              <strong>Data Controller</strong> for personal data collected through our
              platform. This means we determine the purposes and means of processing
              your personal data.
            </p>
            <div className="mt-4 rounded border-l-4 border-blue-500 bg-blue-50 p-4 text-sm">
              <strong>Data Protection Officer (DPO):</strong> All data protection
              inquiries can be directed to{" "}
              <a href="mailto:privacy@adchasser.com" className="text-blue-700 underline">
                privacy@adchasser.com
              </a>
              .
            </div>
          </section>

          {/* 3. Information We Collect */}
          <section id="info-we-collect">
            <h2 className="text-2xl font-bold mb-3">3. Information We Collect</h2>
            <p>We collect personal information in the following categories:</p>

            <h3 className="text-lg font-semibold mt-5">a. Account Information</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Password (stored as a secure hash, not in plain text)</li>
              <li>Profile photo (if provided)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-5">b. Demographic Information (Respondents)</h3>
            <p className="mt-2">
              When you complete onboarding as a respondent, we ask for demographic
              details so we can match you with relevant surveys. This may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Date of birth and age range</li>
              <li>Gender</li>
              <li>Location (state, city, region in Nigeria)</li>
              <li>Education level</li>
              <li>Occupation and industry</li>
              <li>Income range</li>
              <li>Household composition</li>
              <li>Other lifestyle and consumer preference indicators</li>
            </ul>

            <h3 className="text-lg font-semibold mt-5">c. Survey Responses</h3>
            <p className="mt-2">
              Answers you provide to brand surveys, including text responses, ratings,
              selections, and any other data you choose to submit.
            </p>

            <h3 className="text-lg font-semibold mt-5">d. Payment Information</h3>
            <p className="mt-2">
              To process withdrawals, we collect:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Bank name and bank code</li>
              <li>Account number and account name</li>
              <li>Withdrawal history and transaction records</li>
            </ul>
            <p className="mt-3">
              Payment processing is handled by Paystack, a licensed Nigerian payment
              processor. AdChasser does not store full payment card details.
            </p>

            <h3 className="text-lg font-semibold mt-5">e. Authentication Data</h3>
            <p className="mt-2">
              If you sign in using Google, we receive your Google profile information
              (name, email address, profile picture, and Google account ID) through the
              OAuth authentication flow. We do not receive your Google password.
            </p>

            <h3 className="text-lg font-semibold mt-5">f. Technical Information</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type, operating system, and screen resolution</li>
              <li>Pages visited, time spent, and click patterns</li>
              <li>Referrer URL</li>
              <li>Date and time of access</li>
            </ul>

            <h3 className="text-lg font-semibold mt-5">g. Quality and Behavioural Data</h3>
            <p className="mt-2">
              We measure how respondents complete surveys (response time, consistency,
              completion patterns) to score response quality, prevent fraud, and
              maintain panel integrity. This is essential to our service.
            </p>
          </section>

          {/* 4. How We Use Your Information */}
          <section id="how-we-use">
            <h2 className="text-2xl font-bold mb-3">4. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Create, maintain, and secure your account</li>
              <li>Match respondents with relevant surveys based on demographics</li>
              <li>Process survey completions and credit earnings to your wallet</li>
              <li>Process withdrawal requests and disburse payments via Paystack</li>
              <li>Verify identity and prevent fraud, abuse, and duplicate accounts</li>
              <li>Score response quality and maintain panel integrity</li>
              <li>Provide aggregated and anonymised insights to brands and advertisers</li>
              <li>Communicate service updates, payment notifications, and support replies</li>
              <li>Improve and develop our platform and features</li>
              <li>Comply with legal, tax, and regulatory obligations in Nigeria</li>
              <li>Enforce our Terms of Service</li>
            </ul>
          </section>

          {/* 5. Legal Basis */}
          <section id="legal-basis">
            <h2 className="text-2xl font-bold mb-3">5. Legal Basis for Processing (NDPA)</h2>
            <p>
              Under the Nigeria Data Protection Act, 2023, we process your personal data
              only when we have a lawful basis to do so. The bases we rely on are:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>
                <strong>Consent:</strong> When you create an account and complete
                onboarding, you consent to the collection and processing of your personal
                data for the purposes described in this policy. You may withdraw consent
                at any time.
              </li>
              <li>
                <strong>Contract:</strong> Processing is necessary to fulfil our service
                agreement with you (e.g., paying out earnings, delivering surveys).
              </li>
              <li>
                <strong>Legal obligation:</strong> Processing is necessary to comply with
                Nigerian law, including tax, anti-money-laundering (AML), and
                "know-your-customer" (KYC) requirements.
              </li>
              <li>
                <strong>Legitimate interest:</strong> Processing is necessary for our
                legitimate business interests, such as fraud prevention, platform
                security, and service improvement, where these are not overridden by
                your rights.
              </li>
            </ul>
          </section>

          {/* 6. How We Share */}
          <section id="how-we-share">
            <h2 className="text-2xl font-bold mb-3">6. How We Share Your Information</h2>
            <p>
              We do not sell your personal data. We share information only in the
              following circumstances:
            </p>

            <h3 className="text-lg font-semibold mt-5">a. With Brands and Advertisers</h3>
            <p className="mt-2">
              When you complete a brand survey, your responses are shared with the brand
              that commissioned the study. By default, your responses are aggregated and
              anonymised before being delivered to brands. Personally identifiable
              information (name, email, phone) is not shared unless you have given
              explicit, additional consent for a specific study (e.g., follow-up
              interviews).
            </p>

            <h3 className="text-lg font-semibold mt-5">b. With Service Providers</h3>
            <p className="mt-2">
              We share data with trusted third parties who help us operate the platform:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Supabase</strong> — database, authentication, and backend infrastructure</li>
              <li><strong>Vercel</strong> — website hosting and content delivery</li>
              <li><strong>Paystack</strong> — payment processing and withdrawals</li>
              <li><strong>Google</strong> — OAuth authentication when you sign in with Google</li>
              <li>Email and messaging providers for transactional communications</li>
              <li>Customer support and analytics tools</li>
            </ul>
            <p className="mt-3">
              These providers are bound by contractual obligations to handle your data
              securely and only for the purposes we specify.
            </p>

            <h3 className="text-lg font-semibold mt-5">c. For Legal Reasons</h3>
            <p className="mt-2">
              We may disclose personal data when required to do so by Nigerian law,
              court order, or government request, or when necessary to protect our
              rights, property, or safety, or that of our users or the public.
            </p>

            <h3 className="text-lg font-semibold mt-5">d. Business Transfers</h3>
            <p className="mt-2">
              If AdChasser is involved in a merger, acquisition, or sale of assets, your
              personal data may be transferred as part of that transaction. We will
              notify you of any such change and your continuing rights.
            </p>
          </section>

          {/* 7. Third-party services */}
          <section id="third-party">
            <h2 className="text-2xl font-bold mb-3">7. Third-Party Services</h2>
            <p>
              Our website and platform integrate with third-party services that have
              their own privacy practices. We encourage you to review them:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>
                <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Supabase Privacy Policy</a>
              </li>
              <li>
                <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Vercel Privacy Policy</a>
              </li>
              <li>
                <a href="https://paystack.com/privacy/merchant" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Paystack Privacy Policy</a>
              </li>
              <li>
                <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Google Privacy Policy</a>
              </li>
            </ul>
          </section>

          {/* 8. International Transfers */}
          <section id="international">
            <h2 className="text-2xl font-bold mb-3">8. International Data Transfers</h2>
            <p>
              Some of our service providers (Supabase, Vercel, Google) host data outside
              Nigeria, including in the United States and the European Union. When we
              transfer personal data internationally, we ensure that appropriate
              safeguards are in place, in line with Section 41 of the NDPA. This
              includes contractual protections, recognised adequacy decisions, or your
              explicit consent where required.
            </p>
          </section>

          {/* 9. Retention */}
          <section id="retention">
            <h2 className="text-2xl font-bold mb-3">9. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to provide our
              services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>
                <strong>Active accounts:</strong> data is retained while your account is
                open
              </li>
              <li>
                <strong>Closed accounts:</strong> data is retained for up to 24 months
                after closure to handle disputes, fraud investigation, and tax records,
                then deleted or anonymised
              </li>
              <li>
                <strong>Survey responses:</strong> retained indefinitely in anonymised
                form for analytics and panel insights
              </li>
              <li>
                <strong>Payment records:</strong> retained for the period required by
                Nigerian tax and anti-money-laundering regulations (typically 7 years)
              </li>
              <li>
                <strong>Marketing communications:</strong> retained until you unsubscribe
              </li>
            </ul>
          </section>

          {/* 10. Security */}
          <section id="security">
            <h2 className="text-2xl font-bold mb-3">10. Data Security</h2>
            <p>
              We take the security of your personal data seriously and apply technical
              and organisational measures, including:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>HTTPS / TLS encryption for all data in transit</li>
              <li>Encrypted storage of passwords using industry-standard hashing</li>
              <li>Role-based access controls and database-level grants</li>
              <li>Regular security reviews of our infrastructure</li>
              <li>Limited access to personal data by authorised personnel only</li>
              <li>Vendor due diligence on all third-party processors</li>
            </ul>
            <p className="mt-3">
              No system is perfectly secure. While we work hard to protect your
              information, we cannot guarantee absolute security. If we detect a breach
              affecting your personal data, we will notify you and the Nigeria Data
              Protection Commission (NDPC) within the timelines required by law.
            </p>
          </section>

          {/* 11. Your Rights */}
          <section id="your-rights">
            <h2 className="text-2xl font-bold mb-3">11. Your Rights Under NDPA</h2>
            <p>
              The Nigeria Data Protection Act, 2023 grants you the following rights over
              your personal data:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li><strong>Right to be informed</strong> about how your data is used</li>
              <li><strong>Right of access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data</li>
              <li><strong>Right to erasure</strong> — request deletion of your data, subject to legal exceptions</li>
              <li><strong>Right to restrict processing</strong> in certain circumstances</li>
              <li><strong>Right to data portability</strong> — receive your data in a structured, machine-readable format</li>
              <li><strong>Right to object</strong> to processing based on legitimate interest or for direct marketing</li>
              <li><strong>Right to withdraw consent</strong> at any time, without affecting prior lawful processing</li>
              <li><strong>Right to lodge a complaint</strong> with the Nigeria Data Protection Commission (NDPC)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">
                privacy@adchasser.com
              </a>
              . We will respond within 30 days, in line with NDPA requirements.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              If you believe we have not handled your data correctly, you may contact
              the Nigeria Data Protection Commission at{" "}
              <a href="https://ndpc.gov.ng" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                ndpc.gov.ng
              </a>
              .
            </p>
          </section>

          {/* 12. Cookies */}
          <section id="cookies">
            <h2 className="text-2xl font-bold mb-3">12. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to keep you logged in, remember
              your preferences, secure your session, and understand how the site is
              used. Categories include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li><strong>Strictly necessary:</strong> required for the site to function (e.g., authentication)</li>
              <li><strong>Functional:</strong> remember preferences such as language and region</li>
              <li><strong>Analytics:</strong> help us understand site usage so we can improve the service</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling strictly
              necessary cookies may prevent you from using the site.
            </p>
          </section>

          {/* 13. Children */}
          <section id="children">
            <h2 className="text-2xl font-bold mb-3">13. Children's Privacy</h2>
            <p>
              AdChasser is not intended for use by anyone under the age of 18. We do not
              knowingly collect personal data from children. If we learn that we have
              collected personal data from a person under 18 without parental consent,
              we will delete that information promptly. If you believe a child has
              provided us with personal data, please contact{" "}
              <a href="mailto:privacy@adchasser.com" className="text-blue-600 hover:underline">
                privacy@adchasser.com
              </a>
              .
            </p>
          </section>

          {/* 14. Changes */}
          <section id="changes">
            <h2 className="text-2xl font-bold mb-3">14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material
              changes, we will notify you by email and/or by posting a prominent notice
              on the platform before the changes take effect. The "Last updated" date at
              the top of this page reflects the most recent revision. Continued use of
              AdChasser after a change indicates your acceptance of the updated policy.
            </p>
          </section>

          {/* 15. Contact */}
          <section id="contact">
            <h2 className="text-2xl font-bold mb-3">15. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your
              personal data, please contact us:
            </p>
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
