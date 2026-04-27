import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'

const LAST_UPDATED = '27 April 2026'
const EFFECTIVE_DATE = '27 April 2026'

const sections = [
  { id: 'intro',           title: '1. Introduction' },
  { id: 'who-we-are',      title: '2. Who We Are' },
  { id: 'info-we-collect', title: '3. Information We Collect' },
  { id: 'how-we-use',      title: '4. How We Use Your Information' },
  { id: 'legal-basis',     title: '5. Legal Basis for Processing (NDPA)' },
  { id: 'how-we-share',    title: '6. How We Share Your Information' },
  { id: 'third-party',     title: '7. Third-Party Services' },
  { id: 'international',   title: '8. International Data Transfers' },
  { id: 'retention',       title: '9. Data Retention' },
  { id: 'security',        title: '10. Data Security' },
  { id: 'your-rights',     title: '11. Your Rights Under NDPA' },
  { id: 'cookies',         title: '12. Cookies and Tracking' },
  { id: 'children',        title: "13. Children's Privacy" },
  { id: 'changes',         title: '14. Changes to This Policy' },
  { id: 'contact',         title: '15. Contact Us' },
]

// ── Reusable styled atoms matching the AdChasser theme ──────────
const H2 = ({ children }) => (
  <h2 style={{
    fontSize: 'clamp(22px,3.5vw,32px)',
    fontFamily: F.display,
    fontWeight: 700,
    color: C.text,
    marginBottom: '20px',
    letterSpacing: '-0.3px',
  }}>{children}</h2>
)

const H3 = ({ children }) => (
  <h3 style={{
    fontSize: 'clamp(15px,2vw,18px)',
    fontFamily: F.sans,
    fontWeight: 600,
    color: C.gold,
    marginTop: '28px',
    marginBottom: '12px',
  }}>{children}</h3>
)

const P = ({ children, style = {} }) => (
  <p style={{
    fontSize: 'clamp(14px,1.6vw,15px)',
    color: C.textSoft,
    lineHeight: 1.85,
    marginBottom: '14px',
    ...style,
  }}>{children}</p>
)

const UL = ({ children }) => (
  <ul style={{ paddingLeft: 0, margin: '12px 0 18px', listStyle: 'none' }}>{children}</ul>
)

const LI = ({ children }) => (
  <li style={{
    fontSize: 'clamp(14px,1.6vw,15px)',
    color: C.textSoft,
    lineHeight: 1.85,
    marginBottom: '10px',
    paddingLeft: '22px',
    position: 'relative',
  }}>
    <span style={{
      position: 'absolute',
      left: 0,
      top: '0.6em',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: C.gold,
    }} />
    {children}
  </li>
)

const Strong = ({ children }) => (
  <strong style={{ color: C.text, fontWeight: 600 }}>{children}</strong>
)

const A = ({ href, children, external = false }) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noreferrer' : undefined}
    style={{
      color: C.gold,
      textDecoration: 'none',
      borderBottom: `1px solid ${C.gold}40`,
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderBottomColor = C.gold)}
    onMouseLeave={e => (e.currentTarget.style.borderBottomColor = C.gold + '40')}
  >{children}</a>
)

const Section = ({ id, children }) => (
  <section id={id} style={{ marginBottom: '56px', scrollMarginTop: '90px' }}>
    {children}
  </section>
)

const Callout = ({ children }) => (
  <div style={{
    padding: '18px 22px',
    background: C.goldDim,
    border: `1px solid ${C.gold}30`,
    borderLeft: `3px solid ${C.gold}`,
    borderRadius: '10px',
    fontSize: 'clamp(13px,1.5vw,14px)',
    color: C.textSoft,
    lineHeight: 1.75,
    margin: '20px 0',
  }}>
    {children}
  </div>
)

export default function PrivacyPage({ user }) {
  useEffect(() => {
    document.title = 'Privacy Policy — AdChasser'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{
        padding: 'clamp(60px,9vw,100px) 5% clamp(40px,6vw,64px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(500px,90vw)',
          height: '220px',
          background: `radial-gradient(ellipse,${C.gold}10,transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '5px 13px',
          borderRadius: '20px',
          background: C.goldDim,
          border: `1px solid ${C.gold}30`,
          marginBottom: '20px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.gold }} />
          <span style={{ fontSize: '11px', color: C.gold, fontWeight: 600, letterSpacing: '0.5px' }}>Legal</span>
        </div>
        <h1 style={{
          fontSize: 'clamp(32px,6vw,58px)',
          fontFamily: F.display,
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '18px',
          letterSpacing: '-0.5px',
          position: 'relative',
        }}>
          Privacy{' '}
          <span style={{
            background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Policy</span>
        </h1>
        <p style={{
          fontSize: 'clamp(13px,1.7vw,15px)',
          color: C.muted,
          maxWidth: '600px',
          margin: '0 auto 8px',
          lineHeight: 1.75,
        }}>
          Effective date: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
        </p>
        <p style={{
          fontSize: 'clamp(14px,1.8vw,16px)',
          color: C.textSoft,
          maxWidth: '680px',
          margin: '20px auto 0',
          lineHeight: 1.8,
        }}>
          How AdChasser collects, uses, shares, and protects your personal information,
          in compliance with the Nigeria Data Protection Act, 2023.
        </p>
      </section>

      {/* Body */}
      <section style={{ padding: '0 5% clamp(80px,10vw,120px)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* Table of contents */}
          <div style={{
            padding: '24px 28px',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            marginBottom: '48px',
          }}>
            <p style={{
              fontSize: '11px',
              letterSpacing: '3px',
              color: C.gold,
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>Table of Contents</p>
            <ol style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
              gap: '8px 24px',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    style={{
                      fontSize: '13px',
                      color: C.textSoft,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      display: 'block',
                      padding: '4px 0',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.textSoft)}
                  >{s.title}</a>
                </li>
              ))}
            </ol>
          </div>

          <Section id="intro">
            <H2>1. Introduction</H2>
            <P>
              AdChasser is a product owned and operated by <Strong>Chase Metro Integrated Resources Ltd</Strong>{' '}
              ("we," "us," or "our"), a private limited company incorporated in the Federal Republic of Nigeria.
              AdChasser is a brand campaign intelligence platform that connects brands and advertisers with
              Nigerian respondents through paid surveys.
            </P>
            <P>This Privacy Policy describes how we collect, use, store, share, and protect personal information from:</P>
            <UL>
              <LI>Visitors to adchasser.com</LI>
              <LI>Respondents who participate in surveys through our panel</LI>
              <LI>Brands, advertisers, and clients who use our platform</LI>
            </UL>
            <P>By accessing or using AdChasser, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use our services.</P>
          </Section>

          <Section id="who-we-are">
            <H2>2. Who We Are</H2>
            <P>
              AdChasser is owned and operated by <Strong>Chase Metro Integrated Resources Ltd</Strong>,
              a company registered in Nigeria under the Corporate Affairs Commission
              (RC Number: <Strong>1425342</Strong>), with its registered office at{' '}
              <Strong>No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria</Strong>.
            </P>
            <P>
              For the purposes of the Nigeria Data Protection Act, 2023, Chase Metro Integrated Resources Ltd
              (operating as AdChasser) is the <Strong>Data Controller</Strong> for personal data collected through
              our platform. This means we determine the purposes and means of processing your personal data.
            </P>
            <Callout>
              <Strong>Data Protection Officer (DPO):</Strong> All data protection inquiries can be directed to{' '}
              <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>.
            </Callout>
          </Section>

          <Section id="info-we-collect">
            <H2>3. Information We Collect</H2>
            <P>We collect personal information in the following categories:</P>

            <H3>a. Account Information</H3>
            <UL>
              <LI>Full name</LI>
              <LI>Email address</LI>
              <LI>Phone number</LI>
              <LI>Password (stored as a secure hash, not in plain text)</LI>
              <LI>Profile photo (if provided)</LI>
            </UL>

            <H3>b. Demographic Information (Respondents)</H3>
            <P>When you complete onboarding as a respondent, we ask for demographic details so we can match you with relevant surveys. This may include:</P>
            <UL>
              <LI>Date of birth and age range</LI>
              <LI>Gender</LI>
              <LI>Location (state, city, region in Nigeria)</LI>
              <LI>Education level</LI>
              <LI>Occupation and industry</LI>
              <LI>Income range</LI>
              <LI>Household composition</LI>
              <LI>Other lifestyle and consumer preference indicators</LI>
            </UL>

            <H3>c. Survey Responses</H3>
            <P>Answers you provide to brand surveys, including text responses, ratings, selections, and any other data you choose to submit.</P>

            <H3>d. Payment Information</H3>
            <P>To process withdrawals, we collect:</P>
            <UL>
              <LI>Bank name and bank code</LI>
              <LI>Account number and account name</LI>
              <LI>Withdrawal history and transaction records</LI>
            </UL>
            <P>Payment processing is handled by Paystack, a licensed Nigerian payment processor. AdChasser does not store full payment card details.</P>

            <H3>e. Authentication Data</H3>
            <P>If you sign in using Google, we receive your Google profile information (name, email address, profile picture, and Google account ID) through the OAuth authentication flow. We do not receive your Google password.</P>

            <H3>f. Technical Information</H3>
            <UL>
              <LI>IP address</LI>
              <LI>Browser type and version</LI>
              <LI>Device type, operating system, and screen resolution</LI>
              <LI>Pages visited, time spent, and click patterns</LI>
              <LI>Referrer URL</LI>
              <LI>Date and time of access</LI>
            </UL>

            <H3>g. Quality and Behavioural Data</H3>
            <P>We measure how respondents complete surveys (response time, consistency, completion patterns) to score response quality, prevent fraud, and maintain panel integrity. This is essential to our service.</P>
          </Section>

          <Section id="how-we-use">
            <H2>4. How We Use Your Information</H2>
            <P>We use the information we collect to:</P>
            <UL>
              <LI>Create, maintain, and secure your account</LI>
              <LI>Match respondents with relevant surveys based on demographics</LI>
              <LI>Process survey completions and credit earnings to your wallet</LI>
              <LI>Process withdrawal requests and disburse payments via Paystack</LI>
              <LI>Verify identity and prevent fraud, abuse, and duplicate accounts</LI>
              <LI>Score response quality and maintain panel integrity</LI>
              <LI>Provide aggregated and anonymised insights to brands and advertisers</LI>
              <LI>Communicate service updates, payment notifications, and support replies</LI>
              <LI>Improve and develop our platform and features</LI>
              <LI>Comply with legal, tax, and regulatory obligations in Nigeria</LI>
              <LI>Enforce our Terms of Service</LI>
            </UL>
          </Section>

          <Section id="legal-basis">
            <H2>5. Legal Basis for Processing (NDPA)</H2>
            <P>Under the Nigeria Data Protection Act, 2023, we process your personal data only when we have a lawful basis to do so. The bases we rely on are:</P>
            <UL>
              <LI><Strong>Consent:</Strong> When you create an account and complete onboarding, you consent to the collection and processing of your personal data for the purposes described in this policy. You may withdraw consent at any time.</LI>
              <LI><Strong>Contract:</Strong> Processing is necessary to fulfil our service agreement with you (e.g., paying out earnings, delivering surveys).</LI>
              <LI><Strong>Legal obligation:</Strong> Processing is necessary to comply with Nigerian law, including tax, anti-money-laundering (AML), and "know-your-customer" (KYC) requirements.</LI>
              <LI><Strong>Legitimate interest:</Strong> Processing is necessary for our legitimate business interests, such as fraud prevention, platform security, and service improvement, where these are not overridden by your rights.</LI>
            </UL>
          </Section>

          <Section id="how-we-share">
            <H2>6. How We Share Your Information</H2>
            <P>We do not sell your personal data. We share information only in the following circumstances:</P>

            <H3>a. With Brands and Advertisers</H3>
            <P>When you complete a brand survey, your responses are shared with the brand that commissioned the study. By default, your responses are aggregated and anonymised before being delivered to brands. Personally identifiable information (name, email, phone) is not shared unless you have given explicit, additional consent for a specific study.</P>

            <H3>b. With Service Providers</H3>
            <P>We share data with trusted third parties who help us operate the platform:</P>
            <UL>
              <LI><Strong>Supabase</Strong> — database, authentication, and backend infrastructure</LI>
              <LI><Strong>Vercel</Strong> — website hosting and content delivery</LI>
              <LI><Strong>Paystack</Strong> — payment processing and withdrawals</LI>
              <LI><Strong>Google</Strong> — OAuth authentication when you sign in with Google</LI>
              <LI>Email and messaging providers for transactional communications</LI>
              <LI>Customer support and analytics tools</LI>
            </UL>
            <P>These providers are bound by contractual obligations to handle your data securely and only for the purposes we specify.</P>

            <H3>c. For Legal Reasons</H3>
            <P>We may disclose personal data when required to do so by Nigerian law, court order, or government request, or when necessary to protect our rights, property, or safety, or that of our users or the public.</P>

            <H3>d. Business Transfers</H3>
            <P>If AdChasser is involved in a merger, acquisition, or sale of assets, your personal data may be transferred as part of that transaction. We will notify you of any such change and your continuing rights.</P>
          </Section>

          <Section id="third-party">
            <H2>7. Third-Party Services</H2>
            <P>Our website and platform integrate with third-party services that have their own privacy practices. We encourage you to review them:</P>
            <UL>
              <LI><A href="https://supabase.com/privacy" external>Supabase Privacy Policy</A></LI>
              <LI><A href="https://vercel.com/legal/privacy-policy" external>Vercel Privacy Policy</A></LI>
              <LI><A href="https://paystack.com/privacy/merchant" external>Paystack Privacy Policy</A></LI>
              <LI><A href="https://policies.google.com/privacy" external>Google Privacy Policy</A></LI>
            </UL>
          </Section>

          <Section id="international">
            <H2>8. International Data Transfers</H2>
            <P>Some of our service providers (Supabase, Vercel, Google) host data outside Nigeria, including in the United States and the European Union. When we transfer personal data internationally, we ensure that appropriate safeguards are in place, in line with Section 41 of the NDPA. This includes contractual protections, recognised adequacy decisions, or your explicit consent where required.</P>
          </Section>

          <Section id="retention">
            <H2>9. Data Retention</H2>
            <P>We retain your personal data only for as long as necessary to provide our services and comply with legal obligations:</P>
            <UL>
              <LI><Strong>Active accounts:</Strong> data is retained while your account is open</LI>
              <LI><Strong>Closed accounts:</Strong> data is retained for up to 24 months after closure to handle disputes, fraud investigation, and tax records, then deleted or anonymised</LI>
              <LI><Strong>Survey responses:</Strong> retained indefinitely in anonymised form for analytics and panel insights</LI>
              <LI><Strong>Payment records:</Strong> retained for the period required by Nigerian tax and anti-money-laundering regulations (typically 7 years)</LI>
              <LI><Strong>Marketing communications:</Strong> retained until you unsubscribe</LI>
            </UL>
          </Section>

          <Section id="security">
            <H2>10. Data Security</H2>
            <P>We take the security of your personal data seriously and apply technical and organisational measures, including:</P>
            <UL>
              <LI>HTTPS / TLS encryption for all data in transit</LI>
              <LI>Encrypted storage of passwords using industry-standard hashing</LI>
              <LI>Role-based access controls and database-level grants</LI>
              <LI>Regular security reviews of our infrastructure</LI>
              <LI>Limited access to personal data by authorised personnel only</LI>
              <LI>Vendor due diligence on all third-party processors</LI>
            </UL>
            <P>No system is perfectly secure. While we work hard to protect your information, we cannot guarantee absolute security. If we detect a breach affecting your personal data, we will notify you and the Nigeria Data Protection Commission (NDPC) within the timelines required by law.</P>
          </Section>

          <Section id="your-rights">
            <H2>11. Your Rights Under NDPA</H2>
            <P>The Nigeria Data Protection Act, 2023 grants you the following rights over your personal data:</P>
            <UL>
              <LI><Strong>Right to be informed</Strong> about how your data is used</LI>
              <LI><Strong>Right of access</Strong> — request a copy of the personal data we hold about you</LI>
              <LI><Strong>Right to rectification</Strong> — correct inaccurate or incomplete data</LI>
              <LI><Strong>Right to erasure</Strong> — request deletion of your data, subject to legal exceptions</LI>
              <LI><Strong>Right to restrict processing</Strong> in certain circumstances</LI>
              <LI><Strong>Right to data portability</Strong> — receive your data in a structured, machine-readable format</LI>
              <LI><Strong>Right to object</Strong> to processing based on legitimate interest or for direct marketing</LI>
              <LI><Strong>Right to withdraw consent</Strong> at any time, without affecting prior lawful processing</LI>
              <LI><Strong>Right to lodge a complaint</Strong> with the Nigeria Data Protection Commission (NDPC)</LI>
            </UL>
            <P>To exercise any of these rights, email <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>. We will respond within 30 days, in line with NDPA requirements.</P>
            <P style={{ fontSize: '13px', color: C.muted }}>If you believe we have not handled your data correctly, you may contact the Nigeria Data Protection Commission at <A href="https://ndpc.gov.ng" external>ndpc.gov.ng</A>.</P>
          </Section>

          <Section id="cookies">
            <H2>12. Cookies and Tracking</H2>
            <P>We use cookies and similar technologies to keep you logged in, remember your preferences, secure your session, and understand how the site is used. Categories include:</P>
            <UL>
              <LI><Strong>Strictly necessary:</Strong> required for the site to function (e.g., authentication)</LI>
              <LI><Strong>Functional:</Strong> remember preferences such as language and region</LI>
              <LI><Strong>Analytics:</Strong> help us understand site usage so we can improve the service</LI>
            </UL>
            <P>You can control cookies through your browser settings. Disabling strictly necessary cookies may prevent you from using the site.</P>
          </Section>

          <Section id="children">
            <H2>13. Children's Privacy</H2>
            <P>AdChasser is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from children. If we learn that we have collected personal data from a person under 18 without parental consent, we will delete that information promptly. If you believe a child has provided us with personal data, please contact <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>.</P>
          </Section>

          <Section id="changes">
            <H2>14. Changes to This Policy</H2>
            <P>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and/or by posting a prominent notice on the platform before the changes take effect. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of AdChasser after a change indicates your acceptance of the updated policy.</P>
          </Section>

          <Section id="contact">
            <H2>15. Contact Us</H2>
            <P>If you have questions about this Privacy Policy or how we handle your personal data, please contact us:</P>
            <div style={{
              padding: '24px 28px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              marginTop: '12px',
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: C.text, marginBottom: '10px' }}>
                Chase Metro Integrated Resources Ltd
              </p>
              <p style={{ fontSize: '14px', color: C.textSoft, lineHeight: 1.85, margin: '4px 0' }}>
                Email: <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>
              </p>
              <p style={{ fontSize: '14px', color: C.textSoft, lineHeight: 1.85, margin: '4px 0' }}>
                Address: No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria
              </p>
              <p style={{ fontSize: '14px', color: C.textSoft, lineHeight: 1.85, margin: '4px 0' }}>
                RC Number: 1425342
              </p>
            </div>
          </Section>

          {/* Cross-link footer */}
          <div style={{
            marginTop: '64px',
            padding: '24px 28px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <span style={{ fontSize: '14px', color: C.textSoft }}>
              See also our <Link to="/terms" style={{ color: C.gold, textDecoration: 'none', borderBottom: `1px solid ${C.gold}40` }}>Terms of Service</Link>.
            </span>
            <Link to="/" style={{
              fontSize: '13px',
              color: C.text,
              textDecoration: 'none',
              padding: '10px 18px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
            }}>← Back to Home</Link>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
