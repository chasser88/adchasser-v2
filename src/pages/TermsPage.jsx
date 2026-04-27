import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'

const LAST_UPDATED = '27 April 2026'
const EFFECTIVE_DATE = '27 April 2026'

const sections = [
  { id: 'acceptance',     title: '1. Acceptance of Terms' },
  { id: 'definitions',    title: '2. Definitions' },
  { id: 'eligibility',    title: '3. Eligibility' },
  { id: 'accounts',       title: '4. Accounts and Registration' },
  { id: 'respondents',    title: '5. Terms for Respondents' },
  { id: 'earnings',       title: '6. Earnings, Withdrawals, and Payments' },
  { id: 'brands',         title: '7. Terms for Brands and Advertisers' },
  { id: 'acceptable-use', title: '8. Acceptable Use' },
  { id: 'ip',             title: '9. Intellectual Property' },
  { id: 'data-rights',    title: '10. Survey Response Rights' },
  { id: 'fraud',          title: '11. Fraud, Quality, and Account Suspension' },
  { id: 'disclaimers',    title: '12. Disclaimers' },
  { id: 'liability',      title: '13. Limitation of Liability' },
  { id: 'indemnification',title: '14. Indemnification' },
  { id: 'termination',    title: '15. Termination' },
  { id: 'changes',        title: '16. Changes to These Terms' },
  { id: 'governing-law',  title: '17. Governing Law and Dispute Resolution' },
  { id: 'general',        title: '18. General Provisions' },
  { id: 'contact',        title: '19. Contact' },
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

const Callout = ({ children, color = C.gold }) => (
  <div style={{
    padding: '18px 22px',
    background: `${color}12`,
    border: `1px solid ${color}30`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '10px',
    fontSize: 'clamp(13px,1.5vw,14px)',
    color: C.textSoft,
    lineHeight: 1.75,
    margin: '20px 0',
  }}>
    {children}
  </div>
)

export default function TermsPage({ user }) {
  useEffect(() => {
    document.title = 'Terms of Service — AdChasser'
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
          Terms of{' '}
          <span style={{
            background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Service</span>
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
          By creating an account or using the platform, you agree to be bound by these Terms.
          Please read them carefully.
        </p>
      </section>

      {/* Body */}
      <section style={{ padding: '0 5% clamp(80px,10vw,120px)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* Important callout */}
          <Callout color={C.gold}>
            <Strong>Important:</Strong> By using AdChasser, you confirm that you are at least
            18 years old, that you reside in Nigeria, and that you have read and understood
            these Terms.
          </Callout>

          {/* TOC */}
          <div style={{
            padding: '24px 28px',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '14px',
            marginBottom: '48px',
            marginTop: '24px',
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
              gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
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

          <Section id="acceptance">
            <H2>1. Acceptance of Terms</H2>
            <P>
              These Terms form a legally binding agreement between you and{' '}
              <Strong>Chase Metro Integrated Resources Ltd</Strong> (operating as "AdChasser,"
              "we," "us," or "our"), a company registered in Nigeria under the Corporate Affairs
              Commission (RC Number: <Strong>1425342</Strong>), with its registered office at
              No 51 Street Oladipo Obateye, Ikeja GRA, Lagos, Nigeria. AdChasser is a product
              owned and operated by Chase Metro Integrated Resources Ltd. By accessing or using
              our website or any service offered through adchasser.com, you agree to comply with
              and be bound by these Terms. If you do not agree, you must not use AdChasser.
            </P>
          </Section>

          <Section id="definitions">
            <H2>2. Definitions</H2>
            <UL>
              <LI><Strong>"Platform"</Strong> — the AdChasser website and all services made available through it.</LI>
              <LI><Strong>"User"</Strong> — any person who accesses or uses the Platform, including Respondents and Brands.</LI>
              <LI><Strong>"Respondent"</Strong> — a User who registers to participate in surveys for compensation.</LI>
              <LI><Strong>"Brand"</Strong> or <Strong>"Advertiser"</Strong> — a User who commissions surveys or accesses insights through the Platform.</LI>
              <LI><Strong>"Survey"</Strong> — any questionnaire, study, or research instrument made available on the Platform.</LI>
              <LI><Strong>"Earnings"</Strong> — credits accrued in a Respondent's wallet through verified survey completions.</LI>
              <LI><Strong>"Withdrawal"</Strong> — the transfer of Earnings to a Respondent's bank account.</LI>
            </UL>
          </Section>

          <Section id="eligibility">
            <H2>3. Eligibility</H2>
            <P>To use AdChasser, you must:</P>
            <UL>
              <LI>Be at least 18 years of age</LI>
              <LI>Be a resident of Nigeria with a valid Nigerian bank account (for Respondents who wish to withdraw)</LI>
              <LI>Have the legal capacity to enter into binding contracts</LI>
              <LI>Not be barred from using AdChasser under Nigerian law or by previous suspension or termination by us</LI>
            </UL>
            <P>By registering, you represent and warrant that all information you provide is true, accurate, current, and complete.</P>
          </Section>

          <Section id="accounts">
            <H2>4. Accounts and Registration</H2>
            <P>You may register using a valid email address and password, or through Google sign-in. You agree to:</P>
            <UL>
              <LI>Provide accurate, current, and complete information during registration</LI>
              <LI>Maintain the security of your account credentials</LI>
              <LI>Promptly update your account information when it changes</LI>
              <LI>Be responsible for all activity that occurs under your account</LI>
              <LI>Notify us immediately of any unauthorised access at <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A></LI>
            </UL>
            <P>You may only operate one account. Creating multiple accounts to claim additional rewards is prohibited and grounds for immediate termination and forfeiture of Earnings.</P>
          </Section>

          <Section id="respondents">
            <H2>5. Terms for Respondents</H2>
            <P>If you participate as a Respondent, you agree that:</P>
            <UL>
              <LI>You will provide truthful, considered answers to all surveys</LI>
              <LI>You will complete onboarding demographic information accurately</LI>
              <LI>You understand that Survey availability depends on your demographic profile and Brand requirements</LI>
              <LI>You may be screened out of a Survey at any point, including before completion, if you do not match the Survey's target audience</LI>
              <LI>Survey rewards are credited only after the response passes our quality checks</LI>
              <LI>Falsifying answers, rushing through Surveys, providing inconsistent or low-quality responses, or using bots or scripts will void your Earnings and may result in account termination</LI>
              <LI>You will not share your account or sell access to it</LI>
            </UL>
          </Section>

          <Section id="earnings">
            <H2>6. Earnings, Withdrawals, and Payments</H2>

            <H3>a. Earning Credits</H3>
            <P>When you complete a Survey, the associated reward is added to your wallet as a "pending" balance. After our automated quality review (typically within 24 hours), Earnings are moved to your "approved" balance, which is available for withdrawal. We may extend the review window for Surveys flagged for further inspection.</P>

            <H3>b. Quality Review</H3>
            <P>Earnings may be voided if a response is found to be of insufficient quality, inconsistent with prior responses, completed unusually fast, or otherwise non-compliant with these Terms. Decisions on quality are at our reasonable discretion.</P>

            <H3>c. Withdrawals</H3>
            <P>Withdrawals are processed through Paystack to a verified Nigerian bank account that you provide. The minimum withdrawal amount, applicable fees, and processing times are displayed in your wallet at the time of request and may be updated from time to time. You are responsible for providing accurate bank details; AdChasser is not liable for funds sent to incorrect accounts due to information you provided.</P>

            <H3>d. Currency and Taxes</H3>
            <P>All Earnings and Withdrawals are denominated in Nigerian Naira (NGN). You are responsible for any taxes, levies, or charges applicable to Earnings under Nigerian law. We may be required to withhold or report amounts in line with Nigerian tax obligations.</P>

            <H3>e. Forfeiture</H3>
            <P>Earnings are forfeited and not payable in the event of:</P>
            <UL>
              <LI>Account termination for violation of these Terms</LI>
              <LI>Confirmed fraud, multiple accounts, or bot activity</LI>
              <LI>Account inactivity for more than 12 consecutive months (after notice and opportunity to withdraw)</LI>
            </UL>
          </Section>

          <Section id="brands">
            <H2>7. Terms for Brands and Advertisers</H2>
            <P>If you use AdChasser as a Brand or Advertiser, you agree that:</P>
            <UL>
              <LI>You will use insights and Survey responses solely for the purposes agreed at the time of commissioning</LI>
              <LI>You will not attempt to identify, contact, or target individual Respondents using data obtained from the Platform</LI>
              <LI>Surveys you commission must comply with Nigerian law, advertising standards, and these Terms</LI>
              <LI>You may not commission Surveys that are misleading, deceptive, defamatory, or that promote illegal goods or services</LI>
              <LI>Fees, billing, and credit terms are governed by your separate commercial agreement with AdChasser</LI>
              <LI>You retain ownership of brief content you supply, but grant us the licence necessary to deliver the Survey on the Platform</LI>
            </UL>
          </Section>

          <Section id="acceptable-use">
            <H2>8. Acceptable Use</H2>
            <P>You agree not to:</P>
            <UL>
              <LI>Use the Platform for any unlawful purpose or in violation of these Terms</LI>
              <LI>Attempt to gain unauthorised access to any part of the Platform, other accounts, or our systems</LI>
              <LI>Reverse-engineer, decompile, or disassemble any part of the Platform</LI>
              <LI>Use automated tools (bots, scrapers, scripts) to interact with the Platform without our written consent</LI>
              <LI>Interfere with or disrupt the Platform, servers, or networks</LI>
              <LI>Upload or transmit viruses, malware, or other harmful code</LI>
              <LI>Impersonate another person or misrepresent your identity</LI>
              <LI>Harass, threaten, or harm other Users</LI>
              <LI>Collect, store, or share other Users' personal information without their consent</LI>
              <LI>Use the Platform to send spam or unsolicited messages</LI>
            </UL>
          </Section>

          <Section id="ip">
            <H2>9. Intellectual Property</H2>
            <P>The AdChasser name, logo, website design, software, content, and all related intellectual property are owned by AdChasser or our licensors and are protected by copyright, trademark, and other applicable laws. You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for its intended purpose. No other rights or licences are granted, expressly or by implication.</P>
          </Section>

          <Section id="data-rights">
            <H2>10. Survey Response Rights</H2>
            <P>By submitting Survey responses, you grant AdChasser a perpetual, worldwide, royalty-free, sub-licensable licence to use, store, reproduce, modify, aggregate, anonymise, and share those responses for the purposes of:</P>
            <UL>
              <LI>Delivering insights to the commissioning Brand</LI>
              <LI>Improving the Platform and our services</LI>
              <LI>Generating aggregated, anonymised research and benchmarks</LI>
            </UL>
            <P>We will not publicly attribute responses to you by name or share personally identifiable response data with Brands without your additional, specific consent. See our <Link to="/privacy" style={{ color: C.gold, textDecoration: 'none', borderBottom: `1px solid ${C.gold}40` }}>Privacy Policy</Link> for details.</P>
          </Section>

          <Section id="fraud">
            <H2>11. Fraud, Quality, and Account Suspension</H2>
            <P>We use automated and manual systems to detect fraud, low-quality responses, duplicate accounts, and abuse. We may, at our sole discretion and without prior notice:</P>
            <UL>
              <LI>Suspend or terminate accounts</LI>
              <LI>Void Earnings, including those previously approved, where fraud is detected</LI>
              <LI>Reverse Withdrawals where required by Paystack or our risk policies</LI>
              <LI>Refuse withdrawal requests pending additional verification</LI>
              <LI>Require KYC documentation (e.g., government-issued ID) before approving high-value Withdrawals</LI>
            </UL>
            <P>You may appeal a decision by emailing <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>. We will review appeals in good faith but reserve the right to make final determinations.</P>
          </Section>

          <Section id="disclaimers">
            <H2>12. Disclaimers</H2>
            <P>The Platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, AdChasser disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation.</P>
            <P>We do not guarantee:</P>
            <UL>
              <LI>That Surveys will be available at all times</LI>
              <LI>That you will qualify for any particular Survey</LI>
              <LI>The accuracy, reliability, or completeness of Survey content</LI>
              <LI>Specific earning levels or income from using the Platform</LI>
              <LI>Continuous, uninterrupted, or secure access to the Platform</LI>
            </UL>
          </Section>

          <Section id="liability">
            <H2>13. Limitation of Liability</H2>
            <P>To the maximum extent permitted by Nigerian law, AdChasser, its directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses arising from or related to your use of the Platform.</P>
            <P>Our total aggregate liability to you for any claim arising under or in connection with these Terms shall not exceed the greater of (a) the total amount of Earnings paid to you in the 12 months preceding the claim, or (b) NGN 50,000.</P>
            <P>Nothing in these Terms limits or excludes liability that cannot be limited or excluded under Nigerian law, including liability for fraud or wilful misconduct.</P>
          </Section>

          <Section id="indemnification">
            <H2>14. Indemnification</H2>
            <P>You agree to indemnify, defend, and hold harmless AdChasser, its directors, officers, employees, and affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with:</P>
            <UL>
              <LI>Your use of the Platform</LI>
              <LI>Your violation of these Terms</LI>
              <LI>Your violation of any rights of any third party</LI>
              <LI>Any content or data you submit to the Platform</LI>
            </UL>
          </Section>

          <Section id="termination">
            <H2>15. Termination</H2>
            <P>You may terminate your account at any time by contacting <A href="mailto:privacy@adchasser.com">privacy@adchasser.com</A>. Upon termination, your access to the Platform will end and any approved Earnings, subject to our quality review and these Terms, may be withdrawn before closure.</P>
            <P>We may suspend or terminate your account immediately, without notice or liability, if you breach these Terms, engage in fraud, or for any other reason at our reasonable discretion. Sections that by their nature should survive termination (including Intellectual Property, Limitation of Liability, Indemnification, and Governing Law) shall continue to apply after termination.</P>
          </Section>

          <Section id="changes">
            <H2>16. Changes to These Terms</H2>
            <P>We may update these Terms from time to time. When we make material changes, we will notify you by email and post a notice on the Platform before the changes take effect. The "Last updated" date at the top of this page reflects the most recent revision. Your continued use of the Platform after the effective date constitutes acceptance of the revised Terms.</P>
          </Section>

          <Section id="governing-law">
            <H2>17. Governing Law and Dispute Resolution</H2>
            <P>These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles.</P>
            <P>Any dispute arising out of or in connection with these Terms shall first be addressed by good-faith negotiation between the parties. If unresolved within 30 days, the dispute shall be referred to mediation before a mediator agreed by both parties. If mediation fails, the dispute shall be finally resolved by the competent courts of Lagos State, Nigeria.</P>
          </Section>

          <Section id="general">
            <H2>18. General Provisions</H2>
            <UL>
              <LI><Strong>Entire agreement:</Strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and AdChasser regarding the Platform.</LI>
              <LI><Strong>Severability:</Strong> If any provision is held invalid or unenforceable, the remaining provisions remain in full force.</LI>
              <LI><Strong>No waiver:</Strong> Our failure to enforce any right or provision is not a waiver of that right or provision.</LI>
              <LI><Strong>Assignment:</Strong> You may not assign these Terms without our prior written consent. We may assign our rights and obligations to any affiliate or successor.</LI>
              <LI><Strong>Force majeure:</Strong> We are not liable for delays or failures in performance caused by events beyond our reasonable control.</LI>
              <LI><Strong>Notices:</Strong> We may send notices to the email address associated with your account. Notices to us must be sent to privacy@adchasser.com.</LI>
            </UL>
          </Section>

          <Section id="contact">
            <H2>19. Contact</H2>
            <P>For questions about these Terms, please contact us:</P>
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
              See also our <Link to="/privacy" style={{ color: C.gold, textDecoration: 'none', borderBottom: `1px solid ${C.gold}40` }}>Privacy Policy</Link>.
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
