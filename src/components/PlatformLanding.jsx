import { useState } from 'react'
import { C, F, CHART_COLORS } from '../tokens.js'
import { Card, GoldButton, Badge, Spinner, EmptyState } from './shared/ui.jsx'
import { useBrands, useCampaigns } from '../hooks.js'

export default function PlatformLanding({ setView, setActiveBrand, setActiveCampaign }) {
  const { data: brands,    loading: bLoading } = useBrands()
  const { data: campaigns, loading: cLoading } = useCampaigns()
  const [filter, setFilter] = useState('all')

  const loading  = bLoading || cLoading
  const filtered = (campaigns ?? []).filter(c => filter === 'all' ? true : c.status === filter)
  const statusColor = s => ({ active: C.green, draft: C.muted, paused: C.orange, completed: C.blue }[s] ?? C.muted)

  const openCampaign = (campaign) => {
    const brand = (brands ?? []).find(b => b.id === campaign.brand_id) ?? campaign.brands
    setActiveBrand(brand)
    setActiveCampaign(campaign)
    setView('dashboard')
  }

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px) 80px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 640px) {
          .plat-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .plat-campaign-grid { grid-template-columns: 1fr !important; }
          .plat-method-grid { grid-template-columns: 1fr !important; }
          .plat-header { flex-direction: column !important; align-items: flex-start !important; }
          .plat-filter { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Brand Campaign Intelligence</p>
        <div className="plat-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 40px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.1, marginBottom: '12px' }}>
              Did your campaign land<br />
              <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                the way you intended?
              </span>
            </h1>
            <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: C.muted, fontFamily: F.sans, lineHeight: 1.75, maxWidth: '480px' }}>
              AdChasser measures whether your campaign was consumed, understood and impactful.
            </p>
          </div>
          <GoldButton onClick={() => setView('admin')} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>+ New Campaign</GoldButton>
        </div>
      </div>

      {/* KPI strip */}
      {!loading && (brands?.length ?? 0) > 0 && (
        <div className="plat-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '32px' }}>
          {[
            { label: 'Brands Tracked',   value: brands?.length ?? 0,  color: C.gold  },
            { label: 'Active Campaigns', value: (campaigns ?? []).filter(c => c.status === 'active').length, color: C.green },
            { label: 'Total Campaigns',  value: campaigns?.length ?? 0, color: C.blue },
            { label: 'Platform Status',  value: 'Live', color: C.green },
          ].map(m => (
            <Card key={m.label} style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, fontFamily: F.sans, color: m.color, lineHeight: 1 }}>{m.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Campaigns header + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700 }}>Campaigns</h2>
        <div className="plat-filter" style={{ display: 'flex', gap: '5px' }}>
          {['all','active','draft','completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 11px', borderRadius: '20px', border: `1px solid ${filter === s ? C.gold : C.border}`, background: filter === s ? C.goldDim : 'transparent', color: filter === s ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textTransform: 'capitalize', fontWeight: filter === s ? 600 : 400 }}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📡"
          title={filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
          body={filter === 'all' ? 'Set up your first campaign, upload your creative assets, and start collecting brand intelligence.' : `No campaigns with status "${filter}" found.`}
          action={<GoldButton onClick={() => setView('admin')}>+ Create Your First Campaign</GoldButton>} />
      ) : (
        <div className="plat-campaign-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map((c, i) => {
            const brand = (brands ?? []).find(b => b.id === c.brand_id) ?? c.brands ?? {}
            const brandColor = brand.color ?? CHART_COLORS[i % CHART_COLORS.length]
            return (
              <Card key={c.id} onClick={() => openCampaign(c)} style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${brandColor}, ${brandColor}44)` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '11px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: brandColor + '22', border: `1px solid ${brandColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: brandColor, fontFamily: F.display, flexShrink: 0 }}>{brand.logo_char ?? brand.name?.[0] ?? 'B'}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{brand.name ?? '—'}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    </div>
                  </div>
                  <Badge color={statusColor(c.status)} style={{ flexShrink: 0 }}>{c.status}</Badge>
                </div>
                {c.channels?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '11px' }}>
                    {c.channels.slice(0, 3).map(ch => <span key={ch} style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, padding: '2px 7px', borderRadius: '4px', background: C.surface, border: `1px solid ${C.border}` }}>{ch.split(' / ')[0].split(' —')[0].slice(0, 14)}</span>)}
                    {c.channels.length > 3 && <span style={{ fontSize: '10px', color: C.dim, fontFamily: F.sans }}>+{c.channels.length - 3}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.dim, fontFamily: F.sans }}>{c.launched_at ? new Date(c.launched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Draft'}</span>
                  <span style={{ fontSize: '12px', color: brandColor, fontFamily: F.sans, fontWeight: 600 }}>View Insights →</span>
                </div>
              </Card>
            )
          })}

          {/* New campaign card */}
          <button onClick={() => setView('admin')} style={{ padding: '18px', borderRadius: '16px', background: 'transparent', border: `2px dashed ${C.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '150px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.goldDim, border: `1px solid ${C.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: C.gold }}>+</div>
            <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>New Campaign</p>
          </button>
        </div>
      )}

      {/* Methodology strip */}
      <div style={{ marginTop: '48px', padding: 'clamp(20px, 4vw, 32px)', background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', color: C.gold, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Methodology</p>
        <h3 style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontFamily: F.display, fontWeight: 700, marginBottom: '8px' }}>How AdChasser reads your campaign</h3>
        <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, lineHeight: 1.8, marginBottom: '18px', maxWidth: '560px' }}>
          Every respondent is routed into one of two tracks based on organic recall — separating media reach from creative quality.
        </p>
        <div className="plat-method-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { icon: '📡', label: 'Track A — Organic Recall',  desc: 'Measures real-world reach, channel effectiveness, and unaided message retention.', color: C.blue  },
            { icon: '🎬', label: 'Track B — Forced Exposure', desc: 'Measures creative quality and purchase intent — isolated from media spend.',        color: C.gold  },
            { icon: '🔬', label: 'Diagnostic Output',         desc: 'The gap reveals reach vs creative problems — with specific recommended actions.',      color: C.green },
          ].map(m => (
            <div key={m.label} style={{ padding: '14px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '18px', marginBottom: '7px' }}>{m.icon}</div>
              <p style={{ fontSize: '12px', fontWeight: 600, fontFamily: F.sans, color: m.color, marginBottom: '5px' }}>{m.label}</p>
              <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, lineHeight: 1.6 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
