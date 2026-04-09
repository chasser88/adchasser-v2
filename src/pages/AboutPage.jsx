import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BackButton from '../components/layout/BackButton.jsx'

const VALUES = [
  { icon: '🔬', title: 'Rigour over speed', desc: 'We believe in asking the right questions carefully, not the most questions quickly. Every survey question earns its place.' },
  { icon: '💡', title: 'Insight over data', desc: 'Data without interpretation is noise. AdChasser is built to surface the specific insight that changes what you do next.' },
  { icon: '🎯', title: 'Action over reporting', desc: 'A report that sits in a folder has failed. Every recommendation in AdChasser is specific, prioritised, and ready to act on.' },
  { icon: '🔒', title: 'Trust over convenience', desc: 'Your client data is yours. We never share, sell, or aggregate campaign data across organisations.' },
]

export default function AboutPage({ user }) {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 5%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <BackButton />
        </div>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>About</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.1, marginBottom: '20px' }}>
          Built by practitioners,<br />for practitioners
        </h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: C.muted, lineHeight: 1.8, maxWidth: '580px', margin: '0 auto' }}>
          AdChasser was born out of a simple frustration: the tools available to measure brand campaigns were either too expensive, too slow, or too shallow to drive real decisions.
        </p>
      </section>

      {/* Story */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontFamily: F.display, fontWeight: 700, marginBottom: '24px' }}>The problem we set out to solve</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              'Most brand tracking tools tell you how many people saw your campaign. A smaller number tell you if those people remembered it. Almost none tell you whether it actually moved them — emotionally, perceptually, or commercially.',
              'The distinction matters enormously. A campaign can reach millions and fail to shift a single metric. A more targeted campaign can reach far fewer people and dramatically accelerate purchase intent. Without separating reach from creative quality, you cannot diagnose which problem you actually have.',
              'AdChasser was built to close that gap. To give agencies and brand teams a tool that is fast enough to be used on every campaign, rigorous enough to drive real decisions, and clear enough that the recommendations are immediately actionable.',
              'We built it first for our own use. Then we realised every agency and brand team had the same problem.',
            ].map((para, i) => (
              <p key={i} style={{ fontSize: 'clamp(14px,2vw,16px)', color: C.muted, lineHeight: 1.85 }}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontFamily: F.display, fontWeight: 700, marginBottom: '40px', textAlign: 'center' }}>What we believe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ padding: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{v.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{v.title}</h3>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: 'clamp(40px,6vw,80px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>Get in touch</h2>
          <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.75, marginBottom: '32px' }}>
            For enterprise enquiries, partnerships, or general questions — we'd love to hear from you.
          </p>
          <a href="mailto:hello@adchasser.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, textDecoration: 'none' }}>
            📧 hello@adchasser.com
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
