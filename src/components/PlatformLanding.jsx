import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F, CHART_COLORS } from '../tokens.js'
import { Card, GoldButton, Badge, Spinner, EmptyState } from './shared/ui.jsx'
import { useBrands, useCampaigns, updateCampaign, deleteCampaign, uploadAsset } from '../hooks.js'
import { deleteAsset } from '../lib/storage.js'
import { supabase } from '../lib/supabase.js'

const ASSET_ZONES = [
  { key: 'video',  icon: '🎬', label: 'TVC & Digital Video',   ext: 'MP4, MOV',           accept: 'video/mp4,video/quicktime',                    desc: 'TV commercials · digital pre-rolls · social video' },
  { key: 'audio',  icon: '🔊', label: 'Radio & Audio',         ext: 'MP3, WAV',            accept: 'audio/mpeg,audio/wav',                         desc: 'Radio spots · podcast ads · audio branding' },
  { key: 'static', icon: '🖼️', label: 'OOH & Static Digital', ext: 'JPG, PNG, WEBP, SVG', accept: 'image/jpeg,image/png,image/webp,image/svg+xml', desc: 'Billboards · press · digital display · social statics' },
]

const ASSET_TYPE_ICON = { video: '🎬', audio: '🔊', static: '🖼️' }

export default function PlatformLanding({ setView, setActiveBrand, setActiveCampaign }) {
  const navigate = useNavigate()
  const { data: brands,    loading: bLoading } = useBrands()
  const { data: campaigns, loading: cLoading, refetch: refetchCampaigns } = useCampaigns()
  const [filter, setFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [copyMsg, setCopyMsg] = useState(null)
  const campaignRef = useRef(null)

  // ── Asset management state ──────────────────────────────────────
  const [managingAssets,  setManagingAssets]  = useState(false)
  const [assetCampaign,   setAssetCampaign]   = useState(null)
  const [campaignAssets,  setCampaignAssets]  = useState([])
  const [assetFiles,      setAssetFiles]      = useState({ video: [], audio: [], static: [] })
  const [assetUploading,  setAssetUploading]  = useState(false)
  const [assetDragOver,   setAssetDragOver]   = useState(null)
  const [assetsLoading,   setAssetsLoading]   = useState(false)
  const assetFileRefs = { video: useRef(), audio: useRef(), static: useRef() }

  const loading = bLoading || cLoading
  const filtered = (campaigns ?? []).filter(c => {
    const statusMatch = filter === 'all' ? true : c.status === filter
    const brandMatch = brandFilter ? c.brand_id === brandFilter : true
    return statusMatch && brandMatch
  })
  const statusColor = s => ({ active: C.green, draft: C.muted, paused: C.orange, completed: C.blue }[s] ?? C.muted)
  const scrollToCampaigns = () => campaignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const openCampaign = (campaign) => {
    const brand = (brands ?? []).find(b => b.id === campaign.brand_id) ?? campaign.brands
    setActiveBrand(brand)
    setActiveCampaign(campaign)
    navigate(`/app/insights/${campaign.id}`)
  }

  const handleKPI = (label) => {
    if (label === 'Active Campaigns') setFilter('active')
    else setFilter('all')
    setBrandFilter(null)
    scrollToCampaigns()
  }

  const handleBrandClick = (e, brandId) => {
    e.stopPropagation()
    setBrandFilter(prev => prev === brandId ? null : brandId)
    setFilter('all')
    scrollToCampaigns()
  }

  const handleStatusChange = async (e, campaign, newStatus) => {
    e.stopPropagation()
    setMenuOpen(null)
    try {
      await updateCampaign(campaign.id, { status: newStatus })
      refetchCampaigns()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (e, campaign) => {
    e.stopPropagation()
    setMenuOpen(null)
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return
    try {
      await deleteCampaign(campaign.id)
      refetchCampaigns()
    } catch (err) { alert(err.message) }
  }

  const handleEdit = (e, campaign) => {
    e.stopPropagation()
    setMenuOpen(null)
    setEditingCampaign(campaign)
    setEditForm({ name: campaign.name, description: campaign.description || '', launched_at: campaign.launched_at?.slice(0, 10) || '' })
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await updateCampaign(editingCampaign.id, editForm)
      refetchCampaigns()
      setEditingCampaign(null)
    } catch (err) { alert(err.message) }
    setSaving(false)
  }

  const copyLink = (e, campaign) => {
    e.stopPropagation()
    setMenuOpen(null)
    const url = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/survey/${campaign.survey_slug}`
    navigator.clipboard.writeText(url)
    setCopyMsg(campaign.id)
    setTimeout(() => setCopyMsg(null), 2000)
  }

  // ── Asset management handlers ───────────────────────────────────
  const fetchCampaignAssets = async (campaignId) => {
    setAssetsLoading(true)
    const { data } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('sort_order')
    setCampaignAssets(data ?? [])
    setAssetsLoading(false)
  }

  const handleManageAssets = (e, campaign) => {
    e.stopPropagation()
    setMenuOpen(null)
    setAssetCampaign(campaign)
    setAssetFiles({ video: [], audio: [], static: [] })
    setManagingAssets(true)
    fetchCampaignAssets(campaign.id)
  }

  const handleDeleteAsset = async (asset) => {
    if (!confirm(`Delete "${asset.label}"? This cannot be undone.`)) return
    try {
      await deleteAsset({ path: asset.storage_path, id: asset.id })
      fetchCampaignAssets(assetCampaign.id)
    } catch (err) { alert(err.message) }
  }

  const handleNewAssetFiles = (type, incoming) => {
    const arr = Array.from(incoming).map(f => ({ file: f, id: Math.random().toString(36), label: f.name.replace(/\.[^.]+$/, '') }))
    setAssetFiles(prev => ({ ...prev, [type]: [...prev[type], ...arr] }))
  }

  const removeNewFile = (type, id) => setAssetFiles(prev => ({ ...prev, [type]: prev[type].filter(f => f.id !== id) }))
  const updateNewLabel = (type, id, label) => setAssetFiles(prev => ({ ...prev, [type]: prev[type].map(f => f.id === id ? { ...f, label } : f) }))

  const handleUploadNewAssets = async () => {
    const allFiles = [
      ...assetFiles.video.map((f, i)  => ({ ...f, type: 'video',  order: i })),
      ...assetFiles.audio.map((f, i)  => ({ ...f, type: 'audio',  order: i })),
      ...assetFiles.static.map((f, i) => ({ ...f, type: 'static', order: i })),
    ]
    if (!allFiles.length) return

    setAssetUploading(true)
    try {
      for (const { file, label, type, order } of allFiles) {
        await uploadAsset({ campaignId: assetCampaign.id, assetType: type, file, label: label || file.name, sortOrder: order })
      }
      setAssetFiles({ video: [], audio: [], static: [] })
      fetchCampaignAssets(assetCampaign.id)
    } catch (err) { alert(err.message) }
    setAssetUploading(false)
  }

  const totalNewFiles = assetFiles.video.length + assetFiles.audio.length + assetFiles.static.length

  const inputStyle = { width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }

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
        .kpi-card { transition: all 0.18s ease; }
        .kpi-card:hover { transform: translateY(-2px); border-color: rgba(212,175,55,0.4) !important; cursor: pointer; }
        .camp-card { transition: all 0.18s ease; }
        .camp-card:hover { transform: translateY(-2px); }
        .menu-item:hover { background: rgba(255,255,255,0.05) !important; }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      {menuOpen && <div onClick={() => setMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />}

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
            { label: 'Brands Tracked',   value: brands?.length ?? 0, color: C.gold,  clickable: true },
            { label: 'Active Campaigns', value: (campaigns ?? []).filter(c => c.status === 'active').length, color: C.green, clickable: true },
            { label: 'Total Campaigns',  value: campaigns?.length ?? 0, color: C.blue, clickable: true },
            { label: 'Platform Status',  value: 'Live', color: C.green, clickable: false },
          ].map(m => (
            <Card key={m.label} className={m.clickable ? 'kpi-card' : ''} onClick={m.clickable ? () => handleKPI(m.label) : undefined} style={{ padding: '14px 16px', position: 'relative' }}>
              <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, fontFamily: F.sans, color: m.color, lineHeight: 1 }}>{m.value}</p>
              {m.clickable && <span style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '10px', color: C.dim }}>↓</span>}
            </Card>
          ))}
        </div>
      )}

      {/* New user onboarding */}
      {!loading && (campaigns ?? []).length === 0 && (brands ?? []).length === 0 && (
        <div style={{ marginBottom: '32px', padding: '32px', background: `linear-gradient(135deg, ${C.gold}08, ${C.card})`, border: `1px solid ${C.gold}25`, borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
          <h2 style={{ fontSize: '22px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>Welcome to AdChasser</h2>
          <p style={{ fontSize: '14px', color: C.muted, fontFamily: F.sans, lineHeight: 1.8, maxWidth: '420px', margin: '0 auto 24px' }}>
            You're all set. Create your first campaign to start measuring whether your brand message is landing the way you intended.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['Create a brand', 'Set up a campaign', 'Upload creative assets', 'Share survey link', 'View real-time insights'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: C.surface, borderRadius: '20px', border: `1px solid ${C.border}` }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: C.goldDim, border: `1px solid ${C.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: C.gold, fontWeight: 700, fontFamily: F.sans }}>{i + 1}</div>
                <span style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>{step}</span>
              </div>
            ))}
          </div>
          <GoldButton onClick={() => setView('admin')}>+ Create Your First Campaign</GoldButton>
        </div>
      )}

      {/* Campaigns header + filter */}
      <div ref={campaignRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700 }}>Campaigns</h2>
          {brandFilter && (
            <button onClick={() => setBrandFilter(null)} style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '12px', padding: '2px 10px', cursor: 'pointer' }}>
              {(brands ?? []).find(b => b.id === brandFilter)?.name ?? 'Brand'} ✕
            </button>
          )}
        </div>
        <div className="plat-filter" style={{ display: 'flex', gap: '5px' }}>
          {['all', 'active', 'draft', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 11px', borderRadius: '20px', border: `1px solid ${filter === s ? C.gold : C.border}`, background: filter === s ? C.goldDim : 'transparent', color: filter === s ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textTransform: 'capitalize', fontWeight: filter === s ? 600 : 400 }}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner size={28} /></div>
      ) : filtered.length === 0 && (campaigns ?? []).length > 0 ? (
        <EmptyState icon="🔍" title={`No ${filter} campaigns`} body={`No campaigns with status "${filter}" found.`} action={<button onClick={() => setFilter('all')} style={{ color: C.gold, fontFamily: F.sans, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>Show all campaigns</button>} />
      ) : (campaigns ?? []).length > 0 ? (
        <div className="plat-campaign-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map((c, i) => {
            const brand = (brands ?? []).find(b => b.id === c.brand_id) ?? c.brands ?? {}
            const brandColor = brand.color ?? CHART_COLORS[i % CHART_COLORS.length]
            const isMenuOpen = menuOpen === c.id
            return (
              <Card key={c.id} className="camp-card" onClick={() => openCampaign(c)} style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${brandColor}, ${brandColor}44)`, borderRadius: '16px 16px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '11px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <div onClick={e => handleBrandClick(e, brand.id)} title={`Filter by ${brand.name}`} style={{ width: '32px', height: '32px', borderRadius: '9px', background: brandFilter === brand.id ? brandColor + '44' : brandColor + '22', border: `1px solid ${brandFilter === brand.id ? brandColor : brandColor + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: brandColor, fontFamily: F.display, flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {brand.logo_char ?? brand.name?.[0] ?? 'B'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{brand.name ?? '—'}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <Badge color={statusColor(c.status)}>{c.status}</Badge>
                    <div style={{ position: 'relative' }}>
                      <button onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : c.id) }} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋯</button>
                      {isMenuOpen && (
                        <div style={{ position: 'absolute', top: '32px', right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '6px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200, animation: 'fadeDown 0.15s ease' }}>
                          <button className="menu-item" onClick={e => copyLink(e, c)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {copyMsg === c.id ? '✓ Copied!' : '🔗 Copy Survey Link'}
                          </button>
                          <button className="menu-item" onClick={e => handleEdit(e, c)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>✏️ Edit Details</button>
                          <button className="menu-item" onClick={e => handleManageAssets(e, c)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🖼️ Manage Assets</button>
                          {c.status !== 'active' && <button className="menu-item" onClick={e => handleStatusChange(e, c, 'active')} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.green, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>▶ Set Active</button>}
                          {c.status !== 'paused' && c.status !== 'draft' && <button className="menu-item" onClick={e => handleStatusChange(e, c, 'paused')} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>⏸ Pause</button>}
                          {c.status !== 'completed' && <button className="menu-item" onClick={e => handleStatusChange(e, c, 'completed')} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: C.blue, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Mark Completed</button>}
                          <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0' }} />
                          <button className="menu-item" onClick={e => handleDelete(e, c)} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🗑 Delete Campaign</button>
                        </div>
                      )}
                    </div>
                  </div>
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
          <button onClick={() => setView('admin')} style={{ padding: '18px', borderRadius: '16px', background: 'transparent', border: `2px dashed ${C.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '150px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.goldDim, border: `1px solid ${C.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: C.gold }}>+</div>
            <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>New Campaign</p>
          </button>
        </div>
      ) : null}

      {/* ── EDIT DETAILS MODAL ── */}
      {editingCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Edit Campaign</h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaign Name</label>
              <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
              <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Launch Date</label>
              <input type="date" value={editForm.launched_at || ''} onChange={e => setEditForm(p => ({ ...p, launched_at: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <GoldButton onClick={handleSaveEdit} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Changes'}</GoldButton>
              <button onClick={() => setEditingCampaign(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontFamily: F.sans, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE ASSETS MODAL ── */}
      {managingAssets && assetCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '88vh', overflow: 'auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '4px' }}>Manage Assets</h2>
                <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>{assetCampaign.name}</p>
              </div>
              <button onClick={() => setManagingAssets(false)} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Existing assets */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Current Assets</p>
              {assetsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner size={20} /></div>
              ) : campaignAssets.length === 0 ? (
                <div style={{ padding: '18px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans }}>No assets uploaded yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {campaignAssets.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                      {/* Thumbnail for images */}
                      {asset.asset_type === 'static' && asset.public_url ? (
                        <img src={asset.public_url} alt={asset.label} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {ASSET_TYPE_ICON[asset.asset_type] ?? '📄'}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.label}</p>
                        <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>
                          {asset.asset_type} · {asset.file_name} {asset.file_size ? `· ${(asset.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAsset(asset)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0, padding: '4px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload new assets */}
            <div>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Upload New Assets</p>
              {ASSET_ZONES.map(zone => (
                <div key={zone.key} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{zone.icon}</span>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, fontFamily: F.sans, color: C.text }}>{zone.label}</p>
                      <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans }}>{zone.ext}</p>
                    </div>
                  </div>
                  <label
                    onDragOver={e => { e.preventDefault(); setAssetDragOver(zone.key) }}
                    onDragLeave={() => setAssetDragOver(null)}
                    onDrop={e => { e.preventDefault(); setAssetDragOver(null); handleNewAssetFiles(zone.key, e.dataTransfer.files) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: `2px dashed ${assetDragOver === zone.key ? C.gold : C.border}`, background: assetDragOver === zone.key ? C.goldDim : C.surface, transition: 'all 0.2s', gap: '8px' }}>
                    <input ref={assetFileRefs[zone.key]} type="file" accept={zone.accept} multiple onChange={e => handleNewAssetFiles(zone.key, e.target.files)} style={{ display: 'none' }} />
                    <span style={{ fontSize: '16px' }}>{zone.icon}</span>
                    <p style={{ fontSize: '12px', fontFamily: F.sans, color: C.muted }}><span style={{ color: C.gold }}>Click to upload</span> or drag & drop</p>
                  </label>
                  {assetFiles[zone.key].map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', marginTop: '5px' }}>
                      <span style={{ flexShrink: 0 }}>{zone.icon}</span>
                      <input value={f.label} onChange={e => updateNewLabel(zone.key, f.id, e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: C.text, fontSize: '12px', fontFamily: F.sans, outline: 'none', minWidth: '60px' }} />
                      <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, whiteSpace: 'nowrap' }}>{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => removeNewFile(zone.key, f.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
              {totalNewFiles > 0 && (
                <GoldButton onClick={handleUploadNewAssets} disabled={assetUploading} style={{ flex: 1 }}>
                  {assetUploading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner size={13} color={C.bg} /> Uploading...</span>
                    : `Upload ${totalNewFiles} file${totalNewFiles > 1 ? 's' : ''}`}
                </GoldButton>
              )}
              <button onClick={() => setManagingAssets(false)} style={{ flex: totalNewFiles > 0 ? 0 : 1, padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontFamily: F.sans, fontSize: '14px', cursor: 'pointer' }}>
                {totalNewFiles > 0 ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
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
            { icon: '📡', label: 'Track A — Organic Recall',  desc: 'Measures real-world reach, channel effectiveness, and unaided message retention.', color: C.blue },
            { icon: '🎬', label: 'Track B — Forced Exposure', desc: 'Measures creative quality and purchase intent — isolated from media spend.',        color: C.gold },
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
