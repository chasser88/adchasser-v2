import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BackButton from '../components/layout/BackButton.jsx'

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever free',
    color: C.muted,
    desc: 'Perfect for trying AdChasser on your first campaign.',
    features: ['1 active campaign', 'Up to 200 responses', 'Full 38-question survey', 'Live dashboard', 'PDF export', 'Email support'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    sub: 'per month',
    color: C.gold,
    desc: 'For agencies and brand teams running multiple campaigns.',
    features: ['Unlimited campaigns', 'Unlimited responses', 'Full 38-question survey', 'Live dashboard', 'PDF export', 'Priority support', 'Custom branding on survey', 'Team access (up to 5 seats)'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: 'contact us',
    color: C.blue,
    desc: 'For large organisations with bespoke research needs.',
    features: ['Everything in Professional', 'Unlimited team seats', 'White-label surveys', 'Custom question modules', 'Dedicated account manager', 'SLA guarantee', 'Custom integrations', 'On-site training'],
    cta: 'Contact Us',
    popular: false,
  },
]

const FAQS = [
  { q: 'Is the free plan really free?', a: 'Yes — no credit card required, no time limit. The Starter plan gives you one active campaign with up to 200 responses forever.' },
  { q: 'How do I get responses to my survey?', a: 'AdChasser generates a unique survey URL for your campaign. Share it via WhatsApp, SMS, email, social media, or embed it on any platform. You are responsible for recruiting respondents.' },
  { q: 'Can I change plans at any time?', a: 'Yes. You can upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.' },
  { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest. AdChasser is built on Supabase with row-level security, meaning your campaign data is completely isolated from other organisations.' },
  { q: 'Do respondents need to create an account?', a: 'No. Respondents access the survey via a unique link and complete it without any registration.' },
]

export default function PricingPage({ user }) {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      <section style={{ padding: 'clamp(48px,8vw,96px) 5%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <BackButton />
        </div>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>Pricing</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontFamily: F.display, fontWeight: 700, marginBottom: '16px' }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: C.muted, maxWidth: '500px', margin: '0 auto' }}>Start free. Scale when you're ready. No hidden fees.</p>
      </section>

      {/* Plans */}
      <section style={{ padding: '0 5% clamp(48px,8vw,80px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px', alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ padding: '28px', background: plan.popular ? `linear-gradient(135deg,${C.gold}0A,${C.card})` : C.card, border: `1px solid ${plan.popular ? C.gold+'50' : C.border}`, borderRadius: '20px', position: 'relative' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: C.bg, fontFamily: F.sans, whiteSpace: 'nowrap' }}>Most Popular</div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: plan.color, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: F.sans }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: 'clamp(28px,4vw,36px)', fontWeight: 700, fontFamily: F.display, color: plan.color }}>{plan.price}</span>
                  <span style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans }}>{plan.sub}</span>
                </div>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.6, fontFamily: F.sans }}>{plan.desc}</p>
              </div>
              <button onClick={() => navigate(plan.name === 'Enterprise' ? '/about#contact' : '/auth?signup=true')} style={{ width: '100%', padding: '12px', background: plan.popular ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : 'transparent', border: plan.popular ? 'none' : `1px solid ${C.border}`, borderRadius: '10px', color: plan.popular ? C.bg : C.text, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', marginBottom: '20px' }}>{plan.cta}</button>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: C.muted, fontFamily: F.sans }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: plan.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: plan.color }}>✓</div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ padding: '20px 24px', background: C.card, borderRadius: '12px', marginBottom: '8px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, fontFamily: F.sans, marginBottom: '8px' }}>{faq.q}</p>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75, fontFamily: F.sans }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
