import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { C, F } from '../tokens.js'
import AppNav from '../components/layout/AppNav.jsx'
import BackButton from '../components/layout/BackButton.jsx'
import Dashboard from '../components/dashboard/Dashboard.jsx'
import { supabase } from '../lib/supabase.js'

export default function InsightsPage({ user }) {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [campaign,  setCampaign]  = useState(null)
  const [brand,     setBrand]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('insights')
  const [history,   setHistory]   = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) return
    ;(async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*, brands(*)')
        .eq('id', campaignId)
        .single()
      if (data) { setCampaign(data); setBrand(data.brands) }
      setLoading(false)
    })()
  }, [campaignId])

  useEffect(() => {
    if (tab !== 'history' || !brand?.id) return
    setHistLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('id, name, status, launched_at, survey_slug')
        .eq('brand_id', brand.id)
        .neq('id', campaignId)
        .order('launched_at', { ascending: false })

      // Fetch response counts
      const ids = (data ?? []).map(c => c.id)
      if (ids.length > 0) {
        const { data: responses } = await supabase
          .from('survey_responses')
          .select('campaign_id')
          .in('campaign_id', ids)
          .not('completed_at', 'is', null)

        const countMap = {}
        responses?.forEach(r => { countMap[r.campaign_id] = (countMap[r.campaign_id] ?? 0) + 1 })
        setHistory((data ?? []).map(c => ({ ...c, response_count: countMap[c.id] ?? 0 })))
      } else {
        setHistory([])
      }
      setHistLoading(false)
    })()
  }, [tab, brand?.id, campaignId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!campaign) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <p style={{ fontSize: '16px', fontFamily: F.sans, color: C.muted }}>Campaign not found.</p>
      <button onClick={() => navigate('/app')} style={{ padding: '10px 20px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '8px', color: C.bg, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>← Back to Platform</button>
    </div>
  )

  const statusColor = s => ({ active: C.green, draft: C.muted, paused: C.orange ?? C.muted, completed: C.blue }[s] ?? C.muted)

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <AppNav user={user} activeCampaign={campaign} />

      <div style={{ padding: '16px clamp(16px,4vw,32px) 0', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <BackButton />
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { key: 'insights', label: '📊 Insights' },
              { key: 'history',  label: `🕒 ${brand?.name ?? 'Brand'} History` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 14px', borderRadius: '20px', border: `1px solid ${tab === t.key ? C.gold : C.border}`, background: tab === t.key ? C.goldDim : 'transparent', color: tab === t.key ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', fontWeight: tab === t.key ? 600 : 400 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'insights' && <Dashboard campaign={campaign} brand={brand} />}

      {tab === 'history' && (
        <div style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: C.gold, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Campaign History</p>
            <h2 style={{ fontSize: '24px', fontFamily: F.display, fontWeight: 700 }}>{brand?.name} — All Campaigns</h2>
          </div>

          {histLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: C.muted, fontFamily: F.sans }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p>No other campaigns for {brand?.name} yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Current campaign */}
              <div style={{ padding: '18px', borderRadius: '16px', border: `2px solid ${C.gold}40`, background: C.goldDim, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '2px 8px', borderRadius: '10px', background: C.gold, color: C.bg, fontSize: '10px', fontWeight: 700, fontFamily: F.sans }}>Current</div>
                <p style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, marginBottom: '4px' }}>Active Campaign</p>
                <p style={{ fontSize: '15px', fontWeight: 700, fontFamily: F.display, color: C.text, marginBottom: '8px' }}>{campaign.name}</p>
                <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>{campaign.launched_at ? new Date(campaign.launched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Draft'}</p>
              </div>

              {history.map(c => (
                <button key={c.id} onClick={() => navigate(`/app/insights/${c.id}`)} style={{ padding: '18px', borderRadius: '16px', border: `1px solid ${C.border}`, background: C.card, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.gold + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: statusColor(c.status), fontFamily: F.sans, fontWeight: 600 }}>● {c.status}</span>
                    <span style={{ fontSize: '12px', color: C.gold, fontFamily: F.sans, fontWeight: 600 }}>{c.response_count} responses</span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, fontFamily: F.display, color: C.text, marginBottom: '8px', lineHeight: 1.3 }}>{c.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>{c.launched_at ? new Date(c.launched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Draft'}</p>
                    <span style={{ fontSize: '12px', color: C.gold, fontFamily: F.sans }}>View →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
