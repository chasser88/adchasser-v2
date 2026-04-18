// BlockRenderer.jsx
// Renders any CMS block type with its styles applied
// Used by all public pages

import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { resolveStyles } from '../../lib/blockStyles.js'

function getEmbedUrl(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  return url
}

function isVideoUrl(url) {
  if (!url) return false
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

export default function BlockRenderer({ block, brandSettings }) {
  const navigate = useNavigate()
  const { type, content } = block
  const st = resolveStyles(content?.styles, brandSettings)

  const sectionStyle = {
    padding: `${st.raw.paddingTop}px 5% ${st.raw.paddingBottom}px`,
    ...(st.section.background ? { background: st.section.background } : {}),
  }

  const align = st.raw.textAlign
  const flexJustify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  // ── HERO ────────────────────────────────────────────────────────
  if (type === 'hero') {
    const bgIsVideo = isVideoUrl(content.bg_image)
    return (
      <section style={{ ...sectionStyle, textAlign: align, position: 'relative', overflow: 'hidden' }}>

        {/* Background — video or image */}
        {content.bg_image && (
          bgIsVideo ? (
            <video
              src={content.bg_image}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: 0.55,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${content.bg_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
              zIndex: 0,
            }} />
          )
        )}

        {/* Glow overlay */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(500px,90vw)', height: '250px',
          background: `radial-gradient(ellipse,${st.raw.accentColor}12,transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Dark scrim for readability when video is present */}
        {bgIsVideo && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(7,9,15,0.45) 0%, rgba(7,9,15,0.65) 100%)',
            zIndex: 0, pointerEvents: 'none',
          }} />
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {content.eyebrow && <p style={st.accent}>{content.eyebrow}</p>}
          {content.headline && (
            <h1 style={{ ...st.headline, fontSize: 'clamp(30px,6vw,64px)', marginBottom: '20px', letterSpacing: '-0.5px' }}>
              {content.headline.split('\n').map((line, i, arr) => (
                <span key={i}>{i === arr.length - 1
                  ? <span style={{ background: `linear-gradient(135deg,${st.raw.accentColor},${st.raw.accentColor}CC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{line}</span>
                  : <>{line}<br /></>
                }</span>
              ))}
            </h1>
          )}
          {content.subheadline && (
            <p style={{ ...st.subheadline, maxWidth: '560px', margin: `0 ${align === 'center' ? 'auto' : '0'} 32px` }}>
              {content.subheadline}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: flexJustify, flexWrap: 'wrap' }}>
            {content.cta_primary_text && (
              <button
                onClick={() => navigate(content.cta_primary_url ?? '/')}
                style={{ ...st.button, padding: 'clamp(11px,2vw,14px) clamp(20px,4vw,32px)', fontSize: 'clamp(13px,2vw,15px)' }}
              >
                {content.cta_primary_text}
              </button>
            )}
            {content.cta_secondary_text && (
              <button
                onClick={() => navigate(content.cta_secondary_url ?? '/')}
                style={{ ...st.secondaryButton, padding: 'clamp(11px,2vw,14px) clamp(20px,4vw,32px)', fontSize: 'clamp(13px,2vw,15px)' }}
              >
                {content.cta_secondary_text}
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  // ── IMAGE + TEXT ─────────────────────────────────────────────────
  if (type === 'image_text') {
    const imgLeft = content.image_position === 'left'
    return (
      <section style={sectionStyle}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: `${st.raw.itemGap * 2}px`, alignItems: 'center' }}>
          {imgLeft && content.image_url && <img src={content.image_url} alt={content.headline ?? ''} style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', aspectRatio: '4/3' }} />}
          <div style={{ textAlign: align }}>
            {content.headline && <h2 style={{ ...st.headline, marginBottom: '16px' }}>{content.headline}</h2>}
            {content.body && <p style={{ ...st.body, marginBottom: '24px' }}>{content.body}</p>}
            {content.cta_text && <button onClick={() => navigate(content.cta_url ?? '/')} style={st.button}>{content.cta_text}</button>}
          </div>
          {!imgLeft && content.image_url && <img src={content.image_url} alt={content.headline ?? ''} style={{ width: '100%', borderRadius: '16px', objectFit: 'cover', aspectRatio: '4/3' }} />}
        </div>
      </section>
    )
  }

  // ── BANNER ──────────────────────────────────────────────────────
  if (type === 'banner') return (
    <div style={{ background: st.raw.accentColor, padding: '12px 5%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <p style={{ fontSize: '14px', fontFamily: F.sans, color: st.raw.buttonText, fontWeight: 500, margin: 0 }}>{content.text}</p>
      {content.cta_text && (
        <button onClick={() => navigate(content.cta_url ?? '/')} style={{ background: st.raw.buttonText, color: st.raw.accentColor, border: 'none', borderRadius: '7px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: F.sans, whiteSpace: 'nowrap' }}>
          {content.cta_text}
        </button>
      )}
    </div>
  )

  // ── STATS ───────────────────────────────────────────────────────
  if (type === 'stats') return (
    <div style={{ ...sectionStyle, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        {(content.items ?? []).map((s, i, arr) => (
          <div key={i} style={{ padding: 'clamp(16px,3vw,24px) clamp(20px,4vw,48px)', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', flex: 1, minWidth: '100px' }}>
            <p style={{ fontSize: 'clamp(24px,4vw,38px)', fontFamily: F.display, fontWeight: 700, color: st.raw.accentColor, marginBottom: '3px' }}>{s.value}</p>
            <p style={{ fontSize: 'clamp(11px,1.5vw,13px)', color: C.muted, fontFamily: F.sans }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // ── FEATURES ────────────────────────────────────────────────────
  if (type === 'features') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {content.eyebrow && <p style={st.accent}>{content.eyebrow}</p>}
        {content.headline && <h2 style={{ ...st.headline, marginBottom: '48px' }}>{content.headline}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: `${st.raw.itemGap}px` }}>
          {(content.items ?? []).map((f, i) => (
            <div key={i} style={{ padding: '24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = st.raw.accentColor + '40'}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              {f.icon && <div style={{ fontSize: '26px', marginBottom: '12px' }}>{f.icon}</div>}
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: st.raw.textColor, fontFamily: F.sans }}>{f.title}</h3>
              <p style={{ ...st.body, fontSize: '13px' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── CARDS ───────────────────────────────────────────────────────
  if (type === 'cards') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, marginBottom: '40px' }}>{content.headline}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: `${st.raw.itemGap}px` }}>
          {(content.items ?? []).map((c, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              {c.image_url && <img src={c.image_url} alt={c.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />}
              <div style={{ padding: '20px' }}>
                {c.icon && <div style={{ fontSize: '24px', marginBottom: '10px' }}>{c.icon}</div>}
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: st.raw.textColor, fontFamily: F.sans }}>{c.title}</h3>
                <p style={{ ...st.body, fontSize: '13px' }}>{c.desc ?? c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── TESTIMONIALS ─────────────────────────────────────────────────
  if (type === 'testimonials') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, textAlign: 'center', marginBottom: '40px' }}>{content.headline}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: `${st.raw.itemGap}px` }}>
          {(content.items ?? []).map((t, i) => (
            <div key={i} style={{ padding: '28px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '11px', color: st.raw.accentColor, fontFamily: F.sans, letterSpacing: '2px' }}>❝</p>
              <p style={{ ...st.body, fontSize: '15px', lineHeight: 1.8, flex: 1, fontStyle: 'italic' }}>{t.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {t.avatar_url
                  ? <img src={t.avatar_url} alt={t.author} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: st.raw.accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: st.raw.accentColor, fontFamily: F.sans }}>
                      {t.author?.[0] ?? '?'}
                    </div>
                }
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: st.raw.textColor, fontFamily: F.sans, margin: 0 }}>{t.author}</p>
                  <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, margin: 0 }}>{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── TEAM ─────────────────────────────────────────────────────────
  if (type === 'team') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, textAlign: 'center', marginBottom: content.subtext ? '8px' : '40px' }}>{content.headline}</h2>}
        {content.subtext && <p style={{ ...st.subheadline, textAlign: 'center', marginBottom: '40px' }}>{content.subtext}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: `${st.raw.itemGap}px` }}>
          {(content.items ?? []).map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {m.image_url
                ? <img src={m.image_url} alt={m.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: `2px solid ${st.raw.accentColor}30` }} />
                : <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: st.raw.accentColor + '18', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: st.raw.accentColor, fontFamily: F.display }}>
                    {m.name?.[0] ?? '?'}
                  </div>
              }
              <p style={{ fontSize: '15px', fontWeight: 600, color: st.raw.textColor, fontFamily: F.sans, marginBottom: '4px' }}>{m.name}</p>
              <p style={{ fontSize: '12px', color: st.raw.accentColor, fontFamily: F.sans, marginBottom: '8px' }}>{m.role}</p>
              {m.bio && <p style={{ ...st.body, fontSize: '13px' }}>{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── GALLERY ──────────────────────────────────────────────────────
  if (type === 'gallery') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, textAlign: 'center', marginBottom: '32px' }}>{content.headline}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns ?? 3},1fr)`, gap: `${st.raw.itemGap}px` }}>
          {(content.items ?? []).map((img, i) => img.image_url && (
            <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
              <img src={img.image_url} alt={img.alt ?? img.caption ?? ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              {img.caption && <p style={{ padding: '8px 12px', fontSize: '12px', color: C.muted, fontFamily: F.sans, background: C.card }}>{img.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── VIDEO ────────────────────────────────────────────────────────
  if (type === 'video') return (
    <section style={{ ...sectionStyle, textAlign: align }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, textAlign: 'center', marginBottom: content.subtext ? '12px' : '28px' }}>{content.headline}</h2>}
        {content.subtext && <p style={{ ...st.subheadline, textAlign: 'center', marginBottom: '28px' }}>{content.subtext}</p>}
        {content.video_url ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', border: `1px solid ${C.border}` }}>
            <iframe
              src={getEmbedUrl(content.video_url)}
              title={content.headline ?? 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : content.poster_url ? (
          <img src={content.poster_url} alt={content.headline ?? 'Video'} style={{ width: '100%', borderRadius: '16px', aspectRatio: '16/9', objectFit: 'cover' }} />
        ) : null}
      </div>
    </section>
  )

  // ── TEXT SECTION ─────────────────────────────────────────────────
  if (type === 'text_section') return (
    <section style={{ ...sectionStyle }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, marginBottom: '24px' }}>{content.headline}</h2>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${st.raw.itemGap}px` }}>
          {(content.paragraphs ?? []).map((p, i) => (
            <p key={i} style={{ ...st.body, fontSize: 'clamp(14px,2vw,16px)' }}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )

  // ── FAQ ──────────────────────────────────────────────────────────
  if (type === 'faq') return (
    <section style={{ ...sectionStyle }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, textAlign: 'center', marginBottom: '40px' }}>{content.headline}</h2>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(content.items ?? []).map((faq, i) => (
            <div key={i} style={{ padding: '20px 24px', background: C.card, borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '15px', fontWeight: 600, fontFamily: F.sans, marginBottom: '8px', color: st.raw.textColor }}>{faq.q}</p>
              <p style={{ ...st.body, fontSize: '13px' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  // ── CTA ──────────────────────────────────────────────────────────
  if (type === 'cta') return (
    <section style={{ ...sectionStyle, textAlign: align, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(400px,80vw)', height: '250px', background: `radial-gradient(ellipse,${st.raw.accentColor}10,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        {content.headline && <h2 style={{ ...st.headline, fontSize: 'clamp(24px,4vw,48px)', marginBottom: '14px' }}>{content.headline}</h2>}
        {content.subtext && <p style={{ ...st.body, marginBottom: '32px' }}>{content.subtext}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: flexJustify, flexWrap: 'wrap' }}>
          {content.cta_text && <button onClick={() => navigate(content.cta_url ?? '/')} style={st.button}>{content.cta_text}</button>}
          {content.cta_secondary_text && <button onClick={() => navigate(content.cta_secondary_url ?? '/')} style={st.secondaryButton}>{content.cta_secondary_text}</button>}
        </div>
      </div>
    </section>
  )

  // ── CONTACT ──────────────────────────────────────────────────────
  if (type === 'contact') return (
    <section style={{ ...sectionStyle, textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {content.headline && <h2 style={{ ...st.headline, marginBottom: '14px' }}>{content.headline}</h2>}
        {content.subtext && <p style={{ ...st.body, marginBottom: '32px' }}>{content.subtext}</p>}
        {content.email && (
          <a href={`mailto:${content.email}`} style={{ ...st.button, textDecoration: 'none' }}>
            📧 {content.email}
          </a>
        )}
      </div>
    </section>
  )

  return null
}
