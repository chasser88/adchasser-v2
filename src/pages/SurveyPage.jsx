import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { C, F } from '../tokens.js'
import SurveyFlow from '../components/survey/SurveyFlow.jsx'
import { supabase } from '../lib/supabase.js'

export default function SurveyPage() {
  const { slug } = useParams()
  const [surveyData, setSurveyData] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*, brands(*)')
        .eq('survey_slug', slug)
        .eq('status', 'active')
        .single()
      if (!campaign) { setSurveyData(null); setLoading(false); return }
      const { data: assets } = await supabase
        .from('campaign_assets')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sort_order')
      setSurveyData({ campaign, assets: assets ?? [] })
      setLoading(false)
    })()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!surveyData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <p style={{ fontSize: '18px', fontFamily: F.sans, color: '#A8B3CF' }}>Survey not found or no longer active.</p>
    </div>
  )

  return <SurveyFlow campaign={surveyData.campaign} assets={surveyData.assets} />
}
