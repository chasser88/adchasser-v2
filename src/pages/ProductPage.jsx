import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BackButton from '../components/layout/BackButton.jsx'

const CAPABILITIES = [
  { icon: '📡', title: 'Dual-Track Research Design', body: 'Every respondent is routed into Track A (organic recall) or Track B (forced exposure). The gap between these two tracks reveals whether underperformance is a reach problem or a creative problem — a distinction most trackers cannot make.' },
  { icon: '🧠', title: '38-Question Intelligence Survey', body: 'Our survey is built on projective, emotion-first questioning. Rather than asking what people think, we ask questions that reveal what they feel. This surfaces the unconscious associations and brand perceptions that drive real purchase behaviour.' },
  { icon: '📊', title: 'Real-Time Analytics Dashboard', body: 'Watch your data come in live. Segment responses by demographics, purchase frequency, brand relationship, and media habits. Every chart updates in real time as new responses arrive.' },
  { icon: '🎯', title: 'Data-Driven Recommendations', body: 'Four strategic pillars — Channel Strategy, Creative Direction, Audience Targeting, and Timing & Frequency — each with specific, actionable recommendations based on your actual response data.' },
  { icon: '🎬', title: 'In-Survey Asset Serving', body: 'Upload your campaign assets — TV commercials, radio spots, OOH statics, PDFs — and serve them to respondents directly within the survey. Video and audio require 80% completion before the survey continues.' },
  { icon: '📄', title: 'One-Click PDF Reports', body: 'Export a full five-page branded intelligence report covering executive summary, brand equity scorecard, channel performance, segment analysis, and strategic recommendations. Ready to present to clients or leadership.' },
]

const SCORES = [
  { label: 'Recall Score',         desc: 'How well the campaign was retained unaided',        color: C.gold   },
  { label: 'Emotion Score',        desc: 'The emotional quality and valence of the response', color: C.purple },
  { label: 'Brand Equity Score',   desc: 'Salience, meaningfulness, and advocacy',            color: C.blue   },
  { label: 'Purchase Intent Score',desc: 'Consideration and conversion attribution',           color: C.green  },
  { label: 'Resonance Score',      desc: 'Creative strength and message clarity',             color: C.teal   },
  { label: 'Exposure Score',       desc: 'Frequency and reach penetration',                   color: C.orange },
]

export default function ProductPage({ user }) {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <BackButton />
          </div>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>The Platform</p>
          <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.1, marginBottom: '20px' }}>
            A complete brand campaign<br />intelligence platform
          </h1>
          <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: C.muted, lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 32px' }}>
            Built for agencies, brand managers, and marketing teams who need to understand not just whether their campaign reached people — but whether it moved them.
          </p>
          <button onClick={() => navigate('/auth?signup=true')} style={{ padding: '13px 28px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>Start For Free →</button>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: F.display, fontWeight: 700, marginBottom: '40px', textAlign: 'center' }}>Platform Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
            {CAPABILITIES.map(c => (
              <div key={c.title} style={{ padding: '28px', background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{c.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>{c.title}</h3>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Six scores */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Brand Equity Scorecard</p>
          <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>Six scores that tell the full story</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px' }}>
            {SCORES.map((s, i) => (
              <div key={s.label} style={{ padding: '20px 24px', background: C.card, border: `1px solid ${s.color}25`, borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: s.color, fontFamily: F.sans }}>0{i+1}</span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: s.color, marginBottom: '5px' }}>{s.label}</p>
                  <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(48px,8vw,80px) 5%', background: C.surface, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>See AdChasser in action</h2>
        <p style={{ fontSize: '15px', color: C.muted, marginBottom: '28px' }}>Set up your first campaign free — no credit card required.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/auth?signup=true')} style={{ padding: '13px 28px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>Get Started Free →</button>
          <button onClick={() => navigate('/how-it-works')} style={{ padding: '13px 28px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, cursor: 'pointer' }}>How It Works</button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
