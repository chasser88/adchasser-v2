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
  const [campaign, setCampaign] = useState(null)
  const [brand,    setBrand]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!campaignId) return
    ;(async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*, brands(*)')
        .eq('id', campaignId)
        .single()
      if (data) {
        setCampaign(data)
        setBrand(data.brands)
      }
      setLoading(false)
    })()
  }, [campaignId])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!campaign) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <p style={{ fontSize: '16px', fontFamily: F.sans, color: C.muted }}>Campaign not found.</p>
      <button onClick={() => navigate('/app')} style={{ padding: '10px 20px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '8px', color: C.bg, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>← Back to Platform</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <AppNav user={user} activeCampaign={campaign} />
      <div style={{ padding: '16px clamp(16px,4vw,32px) 0', maxWidth: '1200px', margin: '0 auto' }}>
        <BackButton />
      </div>
      <Dashboard campaign={campaign} brand={brand} />
    </div>
  )
}
