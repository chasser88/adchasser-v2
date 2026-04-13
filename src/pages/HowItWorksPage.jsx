import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BackButton from '../components/layout/BackButton.jsx'
import { useCMSPage } from '../lib/useCMS.js'

const DEFAULT_STEPS = [
  { n: '01', title: 'Set up your brand and campaign', body: 'Add your brand name, category, and campaign details. Select the channels you used — Instagram, TV, OOH, radio, and more. Takes under 3 minutes.' },
  { n: '02', title: 'Upload your creative assets', body: 'Upload your TVC, radio spot, OOH static, or social creative. These are served to Track B respondents directly inside the survey, with 80% completion gating.' },
  { n: '03', title: 'Share your survey link', body: 'AdChasser generates a unique survey URL for your campaign. Share it via WhatsApp, SMS, email, or embed it anywhere. Respondents complete it in 10–12 minutes.' },
  { n: '04', title: 'Watch responses come in live', body: 'Your dashboard updates in real time. Watch the brand equity scores build. See which segments are responding, what they retained, and how they feel.' },
  { n: '05', title: 'Receive diagnostic intelligence', body: 'The gap between Track A and Track B responses reveals whether underperformance is a reach problem or a creative problem — with specific recommended actions.' },
  { n: '06', title: 'Act on the recommendations', body: 'Four strategic pillars — Channel, Creative, Audience, Timing — each with specific, evidence-based actions. Export as a PDF and present to clients or leadership.' },
]

const TRACKS = [
  { letter: 'A', color: C.blue, title: 'Track A — Organic Recall',  desc: 'Respondents who have been exposed to the campaign naturally, through normal media consumption. This track measures real-world reach, unaided recall, and the effectiveness of your media spend.', bullets: ['Unaided brand and campaign recall', 'Channel attribution — where they saw it', 'Message retention — what they remember', 'Emotional response to recalled exposure', 'Purchase behaviour post-exposure'] },
  { letter: 'B', color: C.gold, title: 'Track B — Forced Exposure', desc: 'Respondents who have not seen the campaign are shown the creative assets directly inside the survey. This isolates creative quality from media spend and reveals the intrinsic strength of the work itself.', bullets: ['Raw emotional response to the creative', 'Brand recognition without context', 'Message comprehension and clarity', 'Purchase intent after first exposure', 'Creative strength vs category benchmark'] },
]

export default function HowItWorksPage({ user }) {
  const navigate = useNavigate()
  const { block } = useCMSPage('how-it-works')

  const hero  = block('hero')
  const STEPS = block('steps')?.items ?? DEFAULT_STEPS
  const cta   = block('cta')

  const heroSub    = hero?.subheadline ?? 'AdChasser combines survey methodology, real-time analytics, and diagnostic intelligence into a single workflow.'
  const ctaHeadline = cta?.headline   ?? 'Ready to try it on your campaign?'
  const ctaSubtext  = cta?.subtext    ?? 'Free to start. No credit card required.'

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: F.sans, minHeight: '100vh' }}>
      <SiteNav user={user} />

      {/* Hero */}
      <section style={{ padding: 'clamp(48px,8vw,96px) 5%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><BackButton /></div>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>Methodology</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.1, marginBottom: '20px' }}>
          From campaign to intelligence<br />in six steps
        </h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: C.muted, lineHeight: 1.8, maxWidth: '560px', margin: '0 auto' }}>{heroSub}</p>
      </section>

      {/* Steps */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%', background: C.surface }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: '24px', paddingBottom: '40px', position: 'relative' }}>
                {i < STEPS.length - 1 && <div style={{ position: 'absolute', left: '19px', top: '44px', bottom: 0, width: '2px', background: `linear-gradient(180deg,${C.gold}40,${C.border})` }} />}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.bg, fontFamily: F.sans, flexShrink: 0 }}>{s.n}</div>
                <div style={{ paddingTop: '8px' }}>
                  <h3 style={{ fontSize: 'clamp(15px,2vw,18px)', fontWeight: 700, marginBottom: '8px', fontFamily: F.display }}>{s.title}</h3>
                  <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.75 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual track explainer — static content */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 5%' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>The Core Insight</p>
          <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: F.display, fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>Why two tracks?</h2>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: C.muted, lineHeight: 1.8, textAlign: 'center', maxWidth: '660px', margin: '0 auto 40px' }}>
            Reach and creative quality are fundamentally different problems. A campaign can reach millions and still fail to move them. Or it can have limited reach but extraordinary impact on everyone who sees it. Most trackers conflate these. AdChasser separates them.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', marginBottom: '20px' }}>
            {TRACKS.map(t => (
              <div key={t.letter} style={{ padding: '28px', background: C.card, border: `1px solid ${t.color}30`, borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: t.color, fontFamily: F.sans }}>T{t.letter}</div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: t.color }}>{t.title}</h3>
                </div>
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.75, marginBottom: '16px' }}>{t.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {t.bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.muted }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ padding: '18px 22px', background: C.greenDim, border: `1px solid ${C.green}30`, borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', color: C.green, fontWeight: 600, marginBottom: '6px' }}>🔬 The Diagnostic Output</p>
            <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7 }}>The gap between tracks reveals whether underperformance is a reach problem, a creative problem, or both — with specific recommended actions for each scenario.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(48px,8vw,80px) 5%', background: C.surface, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>{ctaHeadline}</h2>
        <p style={{ fontSize: '15px', color: C.muted, marginBottom: '28px' }}>{ctaSubtext}</p>
        <button onClick={() => navigate(cta?.cta_url ?? '/auth?signup=true')} style={{ padding: '13px 28px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
          {cta?.cta_text ?? 'Get Started Free →'}
        </button>
      </section>

      <SiteFooter />
    </div>
  )
}
