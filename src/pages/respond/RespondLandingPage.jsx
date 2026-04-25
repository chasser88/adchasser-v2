import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import SiteNav from '../../components/layout/SiteNav.jsx'
import SiteFooter from '../../components/layout/SiteFooter.jsx'

const FEATURES = [
  { icon: '📋', title: 'Complete Brand Surveys',    desc: 'Share your honest opinions on real Nigerian and global brand campaigns.' },
  { icon: '💰', title: 'Earn ₦1,000 Per Survey',    desc: 'Get credited ₦1,000 for every completed and approved survey response.' },
  { icon: '💳', title: 'Withdraw at ₦10,000',       desc: 'Once your balance reaches ₦10,000 withdraw directly to your bank account.' },
  { icon: '🎯', title: 'Matched to Your Profile',   desc: 'Only see surveys relevant to your age, location and lifestyle.' },
  { icon: '🔒', title: 'Safe & Secure',              desc: 'Your data is protected. One account per person. Verified payouts only.' },
  { icon: '📱', title: 'Join the Community',         desc: 'Connect with other respondents on our WhatsApp community.' },
]

const STEPS = [
  { n: '01', title: 'Register',         desc: 'Create a free account with your email or Google.' },
  { n: '02', title: 'Complete Profile', desc: 'Fill in your demographic profile to get matched to relevant surveys.' },
  { n: '03', title: 'Take Surveys',     desc: 'Complete available surveys honestly and thoughtfully.' },
  { n: '04', title: 'Get Paid',         desc: 'Earn ₦1,000 per survey. Withdraw when you hit ₦10,000.' },
]

export default function RespondLandingPage({ user }) {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{ padding: 'clamp(60px,10vw,120px) 5% clamp(48px,8vw,96px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 'min(500px,90vw)', height: '250px', background: `radial-gradient(ellipse,${C.gold}10,transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 13px', borderRadius: '20px', background: C.goldDim, border: `1px solid ${C.gold}30`, marginBottom: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '11px', color: C.gold, fontWeight: 600, letterSpacing: '0.5px' }}>Now accepting respondents across Nigeria</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.5px' }}>
          Get paid to share your<br />
          <span style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>opinions on brands</span>
        </h1>

        <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: C.muted, lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 32px' }}>
          Join the AdChasser Panel. Complete brand surveys and earn ₦1,000 per survey. Withdraw directly to your bank account.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button onClick={() => navigate('/respond/auth')} style={{ padding: 'clamp(12px,2vw,15px) clamp(24px,4vw,40px)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
            Join the Panel — It's Free →
          </button>
          <button onClick={() => { const el = document.getElementById('how'); el?.scrollIntoView({ behavior: 'smooth' }) }} style={{ padding: 'clamp(12px,2vw,15px) clamp(24px,4vw,40px)', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: 'clamp(13px,2vw,15px)', fontFamily: F.sans, cursor: 'pointer' }}>
            How it works
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', justifyContent: 'center', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {[
            { value: '₦1,000', label: 'Per completed survey' },
            { value: '₦10,000', label: 'Minimum withdrawal' },
            { value: '24hrs', label: 'Payment processing' },
            { value: '100%', label: 'Free to join' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: 'clamp(16px,3vw,24px) clamp(20px,4vw,40px)', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', flex: 1, minWidth: '120px' }}>
              <p style={{ fontSize: 'clamp(20px,3vw,32px)', fontFamily: F.display, fontWeight: 700, color: C.gold, marginBottom: '3px' }}>{s.value}</p>
              <p style={{ fontSize: 'clamp(11px,1.5vw,13px)', color: C.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 5%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Why Join</p>
          <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>Everything you need to start earning</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ padding: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', fontFamily: F.sans }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: 'clamp(48px,8vw,96px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>How It Works</p>
          <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>Start earning in 4 simple steps</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '20px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: C.goldDim, border: `1px solid ${C.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: C.gold, fontFamily: F.display }}>{s.n}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: F.sans, marginBottom: '5px' }}>{s.title}</h3>
                  <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(60px,10vw,110px) 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(400px,80vw)', height: '250px', background: `radial-gradient(ellipse,${C.gold}08,transparent 70%)`, pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(22px,4vw,40px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px', position: 'relative' }}>
          Ready to start earning?
        </h2>
        <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: C.muted, marginBottom: '32px', position: 'relative' }}>
          Join thousands of Nigerians sharing their brand opinions and getting paid.
        </p>
        <button onClick={() => navigate('/respond/auth')} style={{ padding: 'clamp(12px,2vw,15px) clamp(24px,4vw,40px)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', position: 'relative' }}>
          Create Free Account →
        </button>
      </section>

      <SiteFooter />
    </div>
  )
}
