import { useState, useRef } from 'react'
import { C, F } from '../tokens.js'
import { Card, GoldButton, GhostButton, Spinner, Toast } from './shared/ui.jsx'
import { createCampaign, activateCampaign, uploadAsset, createBrand } from '../hooks.js'

const CHANNELS = [
  'Instagram / Facebook', 'TikTok', 'YouTube',
  'TV', 'Radio', 'OOH / Billboards', 'WhatsApp', 'In-store',
]

const ASSET_ZONES = [
  { key: 'video',  icon: '🎬', label: 'TVC & Digital Video',   ext: 'MP4, MOV',           accept: 'video/mp4,video/quicktime',                       desc: 'TV commercials · digital pre-rolls · social video' },
  { key: 'audio',  icon: '🔊', label: 'Radio & Audio',         ext: 'MP3, WAV',            accept: 'audio/mpeg,audio/wav',                            desc: 'Radio spots · podcast ads · audio branding' },
  { key: 'static', icon: '🖼️', label: 'OOH & Static Digital', ext: 'JPG, PNG, WEBP, PDF', accept: 'image/jpeg,image/png,image/webp,application/pdf', desc: 'Billboards · press · digital display · social statics' },
]

export default function AdminSetup({ setView, setActiveBrand, setActiveCampaign, brands = [], refetchBrands }) {
  const [step,      setStep]      = useState(1)
  const [form,      setForm]      = useState({ brandId: '', brandName: '', category: '', campaignName: '', launchedAt: '', channels: [], description: '' })
  const [files,     setFiles]     = useState({ video: [], audio: [], static: [] })
  const [uploading, setUploading] = useState(false)
  const [campaign,  setCampaign]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)
  const [toast,     setToast]     = useState(null)
  const [newBrand,  setNewBrand]  = useState(brands.length === 0)
  const fileRefs = { video: useRef(), audio: useRef(), static: useRef() }

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000) }

  const handleFiles = (type, incoming) => {
    const arr = Array.from(incoming).map(f => ({ file: f, id: Math.random().toString(36), label: f.name.replace(/\.[^.]+$/, '') }))
    setFiles(prev => ({ ...prev, [type]: [...prev[type], ...arr] }))
  }

  const removeFile  = (type, id)        => setFiles(prev => ({ ...prev, [type]: prev[type].filter(f => f.id !== id) }))
  const updateLabel = (type, id, label) => setFiles(prev => ({ ...prev, [type]: prev[type].map(f => f.id === id ? { ...f, label } : f) }))

  const step1Valid = (newBrand || brands.length === 0) ? (form.brandName.trim() && form.category.trim()) : form.brandId
  const step2Valid = form.campaignName.trim()

  const handleCreateCampaign = async () => {
    setUploading(true)
    try {
      let brandId = form.brandId
      if (newBrand || brands.length === 0) {
        const b = await createBrand({ name: form.brandName.trim(), category: form.category.trim(), logo_char: form.brandName[0]?.toUpperCase() ?? 'B', color: '#C9A84C' })
        brandId = b.id
        refetchBrands?.()
      }
      const c = await createCampaign({ brand_id: brandId, name: form.campaignName.trim(), description: form.description, launched_at: form.launchedAt || null, channels: form.channels })
      setCampaign(c)
      setStep(3)
    } catch (e) {
      console.error('Campaign creation error:', e)
      showToast(e.message ?? 'Failed to create campaign. Please try again.', 'error')
    } finally { setUploading(false) }
  }

  const handleUploadAndLaunch = async () => {
    setUploading(true)
    try {
      const brand = brands.find(b => b.id === campaign.brand_id) ?? campaign.brands
      const allFiles = [
        ...files.video.map((f, i)  => ({ ...f, type: 'video',  order: i })),
        ...files.audio.map((f, i)  => ({ ...f, type: 'audio',  order: i })),
        ...files.static.map((f, i) => ({ ...f, type: 'static', order: i })),
      ]
      for (const { file, label, type, order } of allFiles) {
        await uploadAsset({ brandId: campaign.brand_id, campaignId: campaign.id, assetType: type, file, label: label || file.name, sortOrder: order })
      }
      const activated = await activateCampaign(campaign.id)
      setActiveBrand(brand ?? { name: form.brandName, logo_char: form.brandName[0], color: '#C9A84C' })
      setActiveCampaign(activated)
      showToast('Campaign live! Redirecting to insights...', 'success')
      setTimeout(() => setView('dashboard'), 1800)
    } catch (e) {
      console.error('Launch error:', e)
      showToast(e.message ?? 'Upload failed. Please try again.', 'error')
    } finally { setUploading(false) }
  }

  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin
  const surveyUrl = campaign ? `${appUrl}/survey/${campaign.survey_slug}` : ''

  const inputStyle = { width: '100%', padding: '11px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: 'clamp(20px, 5vw, 48px) clamp(16px, 5vw, 40px)', maxWidth: '760px', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 480px) {
          .setup-channels { grid-template-columns: 1fr 1fr !important; }
          .setup-brands { grid-template-columns: 1fr !important; }
        }
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
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: b.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: b.color, fontFamily: F.sans, flexShrink: 0 }}>{b.logo_char}</div>
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
                <button onClick={() => { setNewBrand(false) }} style={{ fontSize: '13px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans, marginBottom: '16px' }}>← Back to brand selection</button>
              )}
              {[{ label: 'Brand Name', key: 'brandName', placeholder: 'e.g. Golden Morn' }, { label: 'Product Category', key: 'category', placeholder: 'e.g. Personal Care, Beverages' }].map(field => (
                <div key={field.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>{field.label}</label>
                  <input value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} style={inputStyle} />
                </div>
              ))}
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
              Assets are served to Track B respondents. Video and audio require 80% completion before the survey continues. PDFs are supported for OOH.
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

          {/* Survey link */}
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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <GhostButton onClick={() => setStep(2)}>← Back</GhostButton>
            <GoldButton onClick={handleUploadAndLaunch} disabled={uploading} style={{ flex: 1 }}>
              {uploading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner size={14} color={C.bg} /> Uploading & Launching...</span>
                : '🚀 Launch Campaign'}
            </GoldButton>
          </div>
        </div>
      )}
    </div>
  )
}
