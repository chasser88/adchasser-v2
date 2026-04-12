import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { C, F } from '../tokens.js'
import SurveyFlow from '../components/survey/SurveyFlow.jsx'
import { supabase } from '../lib/supabase.js'

export default function SurveyPage() {
  const { slug } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [assets,   setAssets]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        // Fetch campaign with brand info including brand_type
        const { data: camp, error: campErr } = await supabase
          .from('campaigns')
          .select('*, brands(*, logo_url, product_image_url, brand_type, category_code)')
          .eq('survey_slug', slug)
          .single()

        if (campErr || !camp) { setError('Survey not found.'); setLoading(false); return }
        setCampaign(camp)

        // Fetch campaign assets
        const { data: campAssets } = await supabase
          .from('campaign_assets')
          .select('*')
          .eq('campaign_id', camp.id)
          .order('sort_order')

        // Build asset list: campaign assets first, then brand assets for Track B
        const assetList = [...(campAssets ?? [])]

        // Add brand logo if available
        if (camp.brands?.logo_url) {
          assetList.push({
            id: 'brand_logo',
            asset_type: 'static',
            label: `${camp.brands.name} — Brand Logo`,
            public_url: camp.brands.logo_url,
            is_brand_asset: true,
            sort_order: 999,
          })
        }

        // Add product image if available
        if (camp.brands?.product_image_url) {
          assetList.push({
            id: 'brand_product',
            asset_type: 'static',
            label: `${camp.brands.name} — Product`,
            public_url: camp.brands.product_image_url,
            is_brand_asset: true,
            sort_order: 1000,
          })
        }

        setAssets(assetList)
      } catch (e) {
        setError('Something went wrong loading the survey.')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${C.gold}30`, borderTopColor: C.gold, animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <p style={{ fontSize: '16px', fontFamily: F.sans, color: C.muted }}>{error}</p>
    </div>
  )

  return <SurveyFlow campaign={campaign} assets={assets} />
}
