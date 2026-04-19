import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BlockRenderer from '../components/cms/BlockRenderer.jsx'
import { useCMSPage, useBrandSettings } from '../lib/useCMS.js'

const FALLBACK_FEATURES = [
  { icon: '📡', title: 'Dual-Track Methodology',    desc: 'Separates media reach from creative quality — two fundamentally different problems that standard brand trackers conflate.' },
  { icon: '🧠', title: '38-Question Survey',         desc: 'Emotion-first, projective sequencing that gets to what people actually feel — not just what they say they feel.' },
  { icon: '📊', title: 'Live Analytics Dashboard',  desc: 'Real-time segment breakdowns across demographics, purchase behaviour, brand relationship, and media habits.' },
  { icon: '🎯', title: 'Strategic Recommendations', desc: 'Four-pillar data-driven recommendations on channel, creative, audience, and timing.' },
  { icon: '📄', title: 'Branded PDF Reports',        desc: 'One-click export of a full campaign intelligence report — ready to present to clients or leadership.' },
  { icon: '🎬', title: 'In-Survey Asset Serving',    desc: 'Show respondents your actual campaign assets — video, audio, static — with 80% completion gating.' },
]

const FALLBACK_STATS = [
  { value: '38', label: 'Research-grade questions' },
  { value: '4',  label: 'Segmentation dimensions'  },
  { value: '2',  label: 'Diagnostic tracks'        },
  { value: '6',  label: 'Brand equity scores'      },
]

const METHODOLOGY_SECTION = ({ navigate }) => (
  <section style={{ padding: 'clamp(48px,8vw,96px) 5%', background: C.surface }}>
    <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Methodology</p>
      <h2 style={{ fontSize: 'clamp(22px,4vw,40px)', fontFamily: F.display, fontWeight: 700, marginBottom: '16px' }}>The reach vs. creative quality gap</h2>
      <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: C.muted, lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 40px' }}>
        Most brand trackers can't tell you if underperformance is a media problem or a creative problem. AdChasser separates them.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { color: C.blue, icon: '📡', label: 'Track A — Organic Recall',  desc: 'Measures real-world reach and unaided retention.' },
          { color: C.gold, icon: '🎬', label: 'Track B — Forced Exposure', desc: 'Measures creative quality isolated from media spend.' },
        ].map(t => (
          <div key={t.label} style={{ padding: '24px', background: C.card, border: `1px solid ${t.color}30`, borderRadius: '14px', textAlign: 'left' }}>
            <span style={{ fontSize: '22px' }}>{t.icon}</span>
            <p style={{ fontSize: '13px', fontWeight: 600, color: t.color, margin: '10px 0 7px' }}>{t.label}</p>
            <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7 }}>{t.desc}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/how-it-works')} style={{ padding: '12px 28px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, cursor: 'pointer' }}>
        Learn More About The Methodology →
      </button>
    </div>
  </section>
)

export default function HomePage({ user }) {
  const navigate = useNavigate()
  const { data: cmsPage, loading } = useCMSPage('home')
  const { settings: brandSettings } = useBrandSettings()

  // ── CMS path — published page ─────────────────────────────────
  if (!loading && cmsPage) {
    // Force center alignment on hero blocks so text always centres over video
    const blocksWithCenterHero = cmsPage.cms_blocks.map(block => {
      if (block.type === 'hero') {
        return {
          ...block,
          content: {
            ...block.content,
            styles: {
              ...block.content?.styles,
              textAlign: block.content?.styles?.textAlign ?? 'center',
            },
          },
        }
      }
      return block
    })

    return (
      <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
        <SiteNav user={user} />
        {blocksWithCenterHero.map(block => (
          <BlockRenderer key={block.id} block={block} brandSettings={brandSettings} />
        ))}
        <METHODOLOGY_SECTION navigate={navigate} />
        <SiteFooter />
      </div>
    )
  }

  // ── Fallback — hardcoded (CMS not yet published) ──────────────
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{ padding: 'clamp(60px,10vw,120px) 5% clamp(48px,8vw,96px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 'min(500px,90vw)', height: '250px', background: `radial-gradient(ellipse,${C.gold}12,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 13px', borderRadius: '20px', background: C.goldDim, border: `1px solid ${C.gold}30`, marginBottom: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.gold }} />
          <span style={{ fontSize: '11px', color: C.gold, fontWeight: 600, letterSpacing: '0.5px' }}>Brand Campaign Intelligence Platform</span>
        </div>
        <h1 style={{ fontSize: 'clamp(30px,6vw,64px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.08, marginBottom: '20px', letterSpacing: '-0.5px' }}>
          Did your campaign land<br />
          <span style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>the way you intended?</span>
        </h1>
        <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: C.muted, lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 32px' }}>
          AdChasser measures whether your campaign was consumed, understood and impactful — separating reach from creative quality using a dual-track research methodology.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/auth?signup=true')} style={{ padding: 'clamp(11px,2vw,14px) clamp(20px,4vw,32px)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>Start For Free →</button>
          <button onClick={() => navigate('/how-it-works')} style={{ padding: 'clamp(11px,2vw,14px) clamp(20px,4vw,32px)', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: 'clamp(13px,2vw,15px)', fontFamily: F.sans, cursor: 'pointer' }}>See How It Works</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '56px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {FALLBACK_STATS.map((s, i, arr) => (
            <div key={s.label} style={{ padding: 'clamp(16px,3vw,24px) clamp(20px,4vw,40px)', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', flex: 1, minWidth: '100px' }}>
              <p style={{ fontSize: 'clamp(24px,4vw,38px)', fontFamily: F.display, fontWeight: 700, color: C.gold, marginBottom: '3px' }}>{s.value}</p>
              <p style={{ fontSize: 'clamp(11px,1.5vw,13px)', color: C.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 5%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Platform Features</p>
          <h2 style={{ fontSize: 'clamp(22px,4vw,40px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>Everything you need to read your campaign</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {FALLBACK_FEATURES.map(f => (
              <div key={f.title} style={{ padding: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <METHODOLOGY_SECTION navigate={navigate} />

      {/* CTA */}
      <section style={{ padding: 'clamp(60px,10vw,110px) 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(400px,80vw)', height: '250px', background: `radial-gradient(ellipse,${C.gold}10,transparent 70%)`, pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(24px,4vw,48px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px', position: 'relative' }}>Ready to know if your<br />campaign actually landed?</h2>
        <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: C.muted, marginBottom: '32px', position: 'relative' }}>Set up your first campaign in under 5 minutes.</p>
        <button onClick={() => navigate('/auth?signup=true')} style={{ padding: 'clamp(12px,2vw,15px) clamp(24px,4vw,40px)', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', position: 'relative' }}>Get Started Free →</button>
      </section>

      <SiteFooter />
    </div>
  )
}
