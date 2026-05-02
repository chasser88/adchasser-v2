import { useState, useRef, useEffect } from 'react'
import { C, F } from '../tokens.js'
import { Card, GoldButton, GhostButton, Spinner, Toast } from './shared/ui.jsx'
import { createCampaign, activateCampaign, uploadAsset, createBrand } from '../hooks.js'
import { payForCampaign } from '../lib/payment.js'
import { supabase } from '../lib/supabase.js'
import CoverageSelector, { PAN_NIGERIA } from './CoverageSelector.jsx'
import { computeSampleSize, CONFIDENCE_LEVELS, MARGIN_OF_ERROR_OPTIONS } from '../lib/sampleSize.js'

const CHANNELS = [
  'Instagram / Facebook', 'TikTok', 'YouTube',
  'TV', 'Radio', 'OOH / Billboards', 'WhatsApp', 'In-store',
]

const ASSET_ZONES = [
  { key: 'video',  icon: '🎬', label: 'TVC & Digital Video',   ext: 'MP4, MOV',           accept: 'video/mp4,video/quicktime',                    desc: 'TV commercials · digital pre-rolls · social video' },
  { key: 'audio',  icon: '🔊', label: 'Radio & Audio',         ext: 'MP3, WAV',            accept: 'audio/mpeg,audio/wav',                         desc: 'Radio spots · podcast ads · audio branding' },
  { key: 'static', icon: '🖼️', label: 'OOH & Static Digital', ext: 'JPG, PNG, WEBP, SVG', accept: 'image/jpeg,image/png,image/webp,image/svg+xml', desc: 'Billboards · press · digital display · social statics' },
]

const BRAND_TYPES = [
  { value: 'goods',    label: 'Goods',    desc: 'Physical products bought off a shelf or online' },
  { value: 'services', label: 'Services', desc: 'Intangible offerings — finance, telecoms, hospitality' },
  { value: 'mixed',    label: 'Mixed',    desc: 'Brand that offers both products and services' },
]

// Pricing constants — mirror what the backend uses (platform_settings table).
// Used only for display; the backend is the source of truth at payment time.
const RESPONDENT_PRICE_NAIRA   = 10_000      // ₦10k per respondent
const PLATFORM_BASE_FEE_NAIRA  = 1_500_000   // ₦1.5M base fee
const SAMPLE_SIZE_BUFFER       = 50          // extra responses on top of required

function formatNaira(naira) {
  return `₦${(naira / 1_000_000).toFixed(2)}M`
}

async function uploadBrandImage(file, brandId, type) {
  const ext = file.name.split('.').pop()
  const path = `brands/${brandId}/${type}_${Date.now()}.${ext}`
  const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'campaign-assets'
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export default function AdminSetup({ setView, setActiveBrand, setActiveCampaign, brands = [], refetchBrands }) {
  const [step,       setStep]       = useState(1)
  const [form,       setForm]       = useState({
    brandId: '', brandName: '', categoryCode: '', brandType: 'goods',
    campaignName: '', launchedAt: '', channels: [], description: '',
    plannedReach:    '220000000',
    confidenceLevel: 95,
    marginOfError:   5,
    coverage:        PAN_NIGERIA,
  })
  const [files,      setFiles]      = useState({ video: [], audio: [], static: [] })
  const [uploading,  setUploading]  = useState(false)
  const [campaign,   setCampaign]   = useState(null)
  const [dragOver,   setDragOver]   = useState(null)
  const [toast,      setToast]      = useState(null)
  const [newBrand,   setNewBrand]   = useState(brands.length === 0)
  const [categories, setCategories] = useState([])
  const [logoFile,   setLogoFile]   = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [productFile, setProductFile] = useState(null)
  const [productPreview, setProductPreview] = useState(null)
  const fileRefs = { video: useRef(), audio: useRef(), static: useRef() }
  const logoRef    = useRef()
  const productRef = useRef()

  // Live-computed required sample size
  const requiredSampleSize = computeSampleSize({
    plannedReach:    form.plannedReach ? Number(form.plannedReach) : undefined,
    confidenceLevel: form.confidenceLevel,
    marginOfError:   form.marginOfError,
  })

  // Live-computed campaign price (mirrors backend formula)
  // total = (sample_size + buffer) × respondent_price + base_fee
  const targetSampleSize = requiredSampleSize + SAMPLE_SIZE_BUFFER
  const totalPriceNaira  = targetSampleSize * RESPONDENT_PRICE_NAIRA + PLATFORM_BASE_FEE_NAIRA

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setCategories(data ?? []))
  }, [])

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000) }

  const handleCategoryChange = (code) => {
    const cat = categories.find(c => c.code === code)
    setForm(f => ({ ...f, categoryCode: code, brandType: cat?.brand_type_suggestion ?? 'goods' }))
  }

  const handleImagePick = (file, type) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url) }
    else { setProductFile(file); setProductPreview(url) }
  }

  const handleFiles = (type, incoming) => {
    const arr = Array.from(incoming).map(f => ({ file: f, id: Math.random().toString(36), label: f.name.replace(/\.[^.]+$/, '') }))
    setFiles(prev => ({ ...prev, [type]: [...prev[type], ...arr] }))
  }

  const removeFile  = (type, id)        => setFiles(prev => ({ ...prev, [type]: prev[type].filter(f => f.id !== id) }))
  const updateLabel = (type, id, label) => setFiles(prev => ({ ...prev, [type]: prev[type].map(f => f.id === id ? { ...f, label } : f) }))

  const step1Valid = (newBrand || brands.length === 0) ? (form.brandName.trim() && form.categoryCode) : form.brandId
  const step2Valid = form.campaignName.trim()

  const handleCreateCampaign = async () => {
    setUploading(true)
    try {
      let brandId = form.brandId
      if (newBrand || brands.length === 0) {
        const cat = categories.find(c => c.code === form.categoryCode)
        const b = await createBrand({
          name:          form.brandName.trim(),
          category:      cat?.name ?? form.categoryCode,
          category_code: form.categoryCode,
          brand_type:    form.brandType,
          logo_char:     form.brandName[0]?.toUpperCase() ?? 'B',
          color:         '#C9A84C',
        })
        brandId = b.id
        if (logoFile) {
          const logoUrl = await uploadBrandImage(logoFile, brandId, 'logo')
          await supabase.from('brands').update({ logo_url: logoUrl }).eq('id', brandId)
        }
        if (productFile) {
          const productUrl = await uploadBrandImage(productFile, brandId, 'product')
          await supabase.from('brands').update({ product_image_url: productUrl }).eq('id', brandId)
        }
        refetchBrands?.()
      }
      const c = await createCampaign({
        brand_id:             brandId,
        name:                 form.campaignName.trim(),
        description:          form.description,
        launched_at:          form.launchedAt || null,
        channels:             form.channels,
        planned_reach:        form.plannedReach ? Number(form.plannedReach) : null,
        coverage:             form.coverage,
        confidence_level:     form.confidenceLevel,
        margin_of_error:      form.marginOfError,
        required_sample_size: requiredSampleSize,
      })
      setCampaign(c)
      setStep(3)
    } catch (e) {
      console.error('Campaign creation error:', e)
      showToast(e.message ?? 'Failed to create campaign. Please try again.', 'error')
    } finally { setUploading(false) }
  }

  // Uploads all assets, then triggers Paystack payment.
  // On successful payment + webhook activation, redirects to the campaign's
  // insights page using the freshly-activated campaign id passed through setView.
  const handleUploadAndPay = async () => {
    setUploading(true)
    try {
      // 1. Upload all campaign assets first.
      const allFiles = [
        ...files.video.map((f, i)  => ({ ...f, type: 'video',  order: i })),
        ...files.audio.map((f, i)  => ({ ...f, type: 'audio',  order: i })),
        ...files.static.map((f, i) => ({ ...f, type: 'static', order: i })),
      ]
      for (const { file, label, type, order } of allFiles) {
        await uploadAsset({ brandId: campaign.brand_id, campaignId: campaign.id, assetType: type, file, label: label || file.name, sortOrder: order })
      }

      showToast('Assets uploaded. Opening payment…', 'success')

      // 2. Initialize payment + open Paystack modal + wait for webhook activation.
      const { activated, bypass } = await payForCampaign(campaign.id)

      const brand = brands.find(b => b.id === campaign.brand_id) ?? activated?.brands ?? campaign.brands
      setActiveBrand(brand ?? { name: form.brandName, logo_char: form.brandName[0], color: '#C9A84C' })
      setActiveCampaign(activated)

      if (bypass) {
        showToast('Campaign launched (super-admin bypass).', 'success')
      } else {
        showToast('Payment confirmed! Campaign is now live.', 'success')
      }
      // Pass activated.id explicitly so AppPage's setView doesn't have to read
      // it from React state (which may not have flushed yet).
      setTimeout(() => setView('dashboard', activated?.id), 1800)
    } catch (e) {
      console.error('Pay & launch error:', e)

      if (e.message === 'PAYMENT_CANCELLED') {
        showToast('Payment cancelled. Your campaign is saved as draft — you can resume payment anytime.', 'info')
      } else if (e.message === 'ACTIVATION_TIMEOUT') {
        showToast('Payment received but activation is taking longer than expected. Check your dashboard in a moment.', 'warning')
        // Send the user to the platform landing (the dashboard list) since we
        // don't have a confirmed campaign id to deep-link into.
        setTimeout(() => setView('platform'), 2500)
      } else {
        showToast(e.message ?? 'Something went wrong. Please try again.', 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const appUrl   = import.meta.env.VITE_APP_URL ?? window.location.origin
  const surveyUrl = campaign ? `${appUrl}/survey/${campaign.survey_slug}` : ''
  const inputStyle = { width: '100%', padding: '11px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }

  const sectors = categories.reduce((acc, cat) => {
    if (!acc[cat.sector_name]) acc[cat.sector_name] = []
    acc[cat.sector_name].push(cat)
    return acc
  }, {})

  return (
    <div style={{ padding: 'clamp(20px, 5vw, 48px) clamp(16px, 5vw, 40px)', maxWidth: '760px', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 480px) {
          .setup-channels { grid-template-columns: 1fr 1fr !important; }
          .setup-brands   { grid-template-columns: 1fr !important; }
        }
        .brand-type-btn:hover   { border-color: ${C.gold}60 !important; }
        .image-upload-zone:hover { border-color: ${C.gold} !important; opacity: 0.9; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontFamily: F.sans, fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Campaign Setup</p>
        <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Configure Your Campaign</h2>
        <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans }}>Three steps to go live and start collecting intelligence.</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[{ n: 1, label: 'Brand' }, { n: 2, label: 'Campaign' }, { n: 3, label: 'Assets' }].map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: step >= s.n ? C.gold : C.dim, color: step >= s.n ? C.bg : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: F.sans, transition: 'all 0.3s' }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: '12px', fontFamily: F.sans, color: step >= s.n ? C.text : C.muted, fontWeight: step === s.n ? 600 : 400 }}>{s.label}</span>
            {i < 2 && <div style={{ flex: 1, height: '1px', background: step > s.n ? C.gold : C.border, transition: 'all 0.4s' }} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Brand ── */}
      {step === 1 && (
        <Card>
          <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Select or Create a Brand</h3>

          {brands.length > 0 && !newBrand && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, marginBottom: '10px', color: C.text }}>Existing Brands</label>
              <div className="setup-brands" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {brands.map(b => {
                  const sel = form.brandId === b.id
                  return (
                    <button key={b.id} onClick={() => setForm(f => ({ ...f, brandId: b.id }))} style={{ padding: '11px 13px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${sel ? b.color : C.border}`, background: sel ? b.color + '12' : 'transparent', display: 'flex', alignItems: 'center', gap: '9px' }}>
                      {b.logo_url
                        ? <img src={b.logo_url} alt={b.name} style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'contain', background: b.color + '22', flexShrink: 0 }} />
                        : <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: b.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: b.color, fontFamily: F.sans, flexShrink: 0 }}>{b.logo_char}</div>
                      }
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: sel ? b.color : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</p>
                        <p style={{ fontSize: '11px', fontFamily: F.sans, color: C.muted }}>{b.category}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => { setNewBrand(true); setForm(f => ({ ...f, brandId: '' })) }} style={{ fontSize: '13px', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans }}>+ Create new brand</button>
            </div>
          )}

          {(newBrand || brands.length === 0) && (
            <div>
              {brands.length > 0 && (
                <button onClick={() => setNewBrand(false)} style={{ fontSize: '13px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans, marginBottom: '16px' }}>← Back to brand selection</button>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Brand Name</label>
                <input value={form.brandName} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} placeholder="e.g. Golden Morn" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Category</label>
                <select value={form.categoryCode} onChange={e => handleCategoryChange(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Select a category...</option>
                  {Object.entries(sectors).map(([sector, cats]) => (
                    <optgroup key={sector} label={sector}>
                      {cats.map(cat => <option key={cat.code} value={cat.code}>{cat.code} — {cat.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '8px' }}>
                  Brand Type
                  {form.categoryCode && <span style={{ fontSize: '11px', color: C.gold, fontWeight: 400, marginLeft: '8px' }}>auto-suggested from category</span>}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {BRAND_TYPES.map(bt => {
                    const sel = form.brandType === bt.value
                    return (
                      <button key={bt.value} className="brand-type-btn" onClick={() => setForm(f => ({ ...f, brandType: bt.value }))} style={{ padding: '12px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${sel ? C.gold : C.border}`, background: sel ? C.goldDim : 'transparent', transition: 'all 0.15s' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: sel ? C.gold : C.text, marginBottom: '3px' }}>{bt.label}</p>
                        <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, lineHeight: 1.4 }}>{bt.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '8px' }}>
                  Brand Assets <span style={{ fontSize: '11px', color: C.muted, fontWeight: 400 }}>— optional, reused across all campaigns</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand Logo</p>
                    <label className="image-upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', borderRadius: '10px', border: `2px dashed ${C.border}`, cursor: 'pointer', background: C.surface, transition: 'all 0.2s', overflow: 'hidden', position: 'relative' }}>
                      <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={e => handleImagePick(e.target.files[0], 'logo')} />
                      {logoPreview ? <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} /> : <><span style={{ fontSize: '24px', marginBottom: '6px' }}>🏷️</span><p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>Upload logo</p><p style={{ fontSize: '10px', color: C.dim, fontFamily: F.sans }}>PNG, SVG, JPG</p></>}
                    </label>
                    {logoPreview && <button onClick={() => { setLogoFile(null); setLogoPreview(null) }} style={{ fontSize: '11px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans, marginTop: '4px' }}>Remove</button>}
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product / Pack Shot</p>
                    <label className="image-upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', borderRadius: '10px', border: `2px dashed ${C.border}`, cursor: 'pointer', background: C.surface, transition: 'all 0.2s', overflow: 'hidden', position: 'relative' }}>
                      <input ref={productRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => handleImagePick(e.target.files[0], 'product')} />
                      {productPreview ? <img src={productPreview} alt="Product preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} /> : <><span style={{ fontSize: '24px', marginBottom: '6px' }}>📦</span><p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>Upload product</p><p style={{ fontSize: '10px', color: C.dim, fontFamily: F.sans }}>PNG, JPG, WEBP</p></>}
                    </label>
                    {productPreview && <button onClick={() => { setProductFile(null); setProductPreview(null) }} style={{ fontSize: '11px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans, marginTop: '4px' }}>Remove</button>}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: '20px' }}>
            <GoldButton onClick={() => setStep(2)} disabled={!step1Valid}>Continue →</GoldButton>
          </div>
        </Card>
      )}

      {/* ── STEP 2: Campaign ── */}
      {step === 2 && (
        <Card>
          <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '18px' }}>Campaign Details</h3>

          {[{ label: 'Campaign Name', key: 'campaignName', placeholder: 'e.g. Feel Everything — Summer 2025' }, { label: 'Launch Date', key: 'launchedAt', type: 'date' }].map(field => (
            <div key={field.key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>{field.label}</label>
              <input type={field.type ?? 'text'} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} style={inputStyle} />
            </div>
          ))}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Campaign Description <span style={{ color: C.muted, fontWeight: 400 }}>(shown to respondents)</span></label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Briefly describe what this campaign is about..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* ── Planned Reach ── */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>
              Planned Reach
              <span style={{ fontSize: '11px', color: C.muted, fontWeight: 400, marginLeft: '8px' }}>total audience you intend to reach</span>
            </label>
            <input type="number" value={form.plannedReach} onChange={e => setForm({ ...form, plannedReach: e.target.value })} placeholder="e.g. 220000000" style={inputStyle} />
          </div>

          {/* ── Coverage ── */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>
              Campaign Coverage
              <span style={{ fontSize: '11px', color: C.muted, fontWeight: 400, marginLeft: '8px' }}>countries and regions targeted</span>
            </label>
            <CoverageSelector value={form.coverage} onChange={v => setForm({ ...form, coverage: v })} />
          </div>

          {/* ── Statistical parameters ── */}
          <div style={{ marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Confidence Level</label>
              <select value={form.confidenceLevel} onChange={e => setForm({ ...form, confidenceLevel: Number(e.target.value) })} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                {CONFIDENCE_LEVELS.map(l => <option key={l} value={l}>{l}% Confidence</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Margin of Error</label>
              <select value={form.marginOfError} onChange={e => setForm({ ...form, marginOfError: Number(e.target.value) })} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                {MARGIN_OF_ERROR_OPTIONS.map(m => <option key={m} value={m}>±{m}%</option>)}
              </select>
            </div>
          </div>

          {/* ── Required sample size + price preview ── */}
          <div style={{ padding: '16px', background: `linear-gradient(135deg, ${C.gold}08, ${C.card})`, border: `1px solid ${C.gold}25`, borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 6px' }}>Required Sample Size</p>
                <p style={{ fontSize: '36px', fontWeight: 700, fontFamily: F.display, color: C.gold, margin: 0, lineHeight: 1 }}>{requiredSampleSize.toLocaleString()}</p>
              </div>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, lineHeight: 1.7, margin: 0, maxWidth: '260px' }}>
                Minimum responses for <strong style={{ color: C.text }}>{form.confidenceLevel}%</strong> confidence at <strong style={{ color: C.text }}>±{form.marginOfError}%</strong> margin of error
                {form.plannedReach ? ` · reach of ${Number(form.plannedReach).toLocaleString()}` : ' (infinite population)'}.
                Cochran's formula with finite population correction.
              </p>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Estimated Price</p>
                <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: F.display, color: C.text, margin: 0, lineHeight: 1 }}>{formatNaira(totalPriceNaira)}</p>
              </div>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, lineHeight: 1.7, margin: 0, maxWidth: '300px' }}>
                ({targetSampleSize.toLocaleString()} responses × ₦{(RESPONDENT_PRICE_NAIRA / 1000).toLocaleString()}k) + ₦{(PLATFORM_BASE_FEE_NAIRA / 1_000_000).toFixed(1)}M base fee.
                Includes a {SAMPLE_SIZE_BUFFER}-response buffer.
              </p>
            </div>
          </div>

          {/* ── Channels ── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '10px' }}>Channels Used</label>
            <div className="setup-channels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '7px' }}>
              {CHANNELS.map(ch => {
                const sel = form.channels.includes(ch)
                return (
                  <button key={ch} onClick={() => setForm(f => ({ ...f, channels: sel ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }))} style={{ padding: '9px 10px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${sel ? C.gold : C.border}`, background: sel ? C.goldDim : 'transparent', color: sel ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: `2px solid ${sel ? C.gold : C.dim}`, background: sel ? C.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: C.bg }}>{sel ? '✓' : ''}</div>
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <GhostButton onClick={() => setStep(1)}>← Back</GhostButton>
            <GoldButton onClick={handleCreateCampaign} disabled={!step2Valid || uploading}>
              {uploading ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Spinner size={14} color={C.bg} /> Creating...</span> : 'Continue →'}
            </GoldButton>
          </div>
        </Card>
      )}

      {/* ── STEP 3: Assets ── */}
      {step === 3 && (
        <div>
          <Card style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Upload Campaign Assets</h3>
            <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, lineHeight: 1.65, marginBottom: '20px' }}>
              Assets are served to Track B respondents. Video and audio require 80% completion before the survey continues. Supported formats: MP4/MOV · MP3/WAV · JPG/PNG/WEBP/SVG.
            </p>
            {ASSET_ZONES.map(zone => (
              <div key={zone.key} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{zone.icon}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text }}>{zone.label}</p>
                    <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{zone.ext} · {zone.desc}</p>
                  </div>
                </div>
                <label
                  onDragOver={e => { e.preventDefault(); setDragOver(zone.key) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); handleFiles(zone.key, e.dataTransfer.files) }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px', borderRadius: '10px', cursor: 'pointer', border: `2px dashed ${dragOver === zone.key ? C.gold : C.border}`, background: dragOver === zone.key ? C.goldDim : C.surface, transition: 'all 0.2s', gap: '5px' }}>
                  <input ref={fileRefs[zone.key]} type="file" accept={zone.accept} multiple onChange={e => handleFiles(zone.key, e.target.files)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '18px' }}>{zone.icon}</span>
                  <p style={{ fontSize: '12px', fontFamily: F.sans, color: C.muted, textAlign: 'center' }}><span style={{ color: C.gold }}>Click to upload</span> or drag & drop</p>
                </label>
                {files[zone.key].map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ flexShrink: 0 }}>{zone.icon}</span>
                    <input value={f.label} onChange={e => updateLabel(zone.key, f.id, e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: '12px', fontFamily: F.sans, outline: 'none', minWidth: '60px' }} />
                    <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, whiteSpace: 'nowrap' }}>{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button onClick={() => removeFile(zone.key, f.id)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            ))}
          </Card>

          <Card style={{ background: `linear-gradient(135deg, ${C.goldDim}, transparent)`, borderColor: C.gold + '30', marginBottom: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px' }}>🔗</span>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: '140px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '2px' }}>Your Survey Link</p>
                <p style={{ fontSize: '11px', fontFamily: 'monospace', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{surveyUrl}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(surveyUrl).then(() => showToast('Link copied!'))} style={{ padding: '7px 12px', background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '8px', color: C.gold, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Copy Link
              </button>
            </div>
          </Card>

          {/* ── Payment summary card ── */}
          <Card style={{ background: `linear-gradient(135deg, ${C.gold}10, transparent)`, borderColor: C.gold + '40', marginBottom: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Due</p>
                <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: F.display, color: C.text, margin: 0, lineHeight: 1 }}>{formatNaira(totalPriceNaira)}</p>
              </div>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, lineHeight: 1.6, margin: 0, maxWidth: '280px' }}>
                You'll be redirected to Paystack to complete payment with your card. Your campaign goes live immediately after payment.
              </p>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <GhostButton onClick={() => setStep(2)}>← Back</GhostButton>
            <GoldButton onClick={handleUploadAndPay} disabled={uploading} style={{ flex: 1 }}>
              {uploading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner size={14} color={C.bg} /> Processing...</span>
                : `💳 Pay ${formatNaira(totalPriceNaira)} & Launch`}
            </GoldButton>
          </div>
        </div>
      )}
    </div>
  )
}
