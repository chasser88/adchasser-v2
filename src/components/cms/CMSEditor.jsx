import { useState } from 'react'
import { C, F } from '../../tokens.js'
import { Spinner } from '../shared/ui.jsx'
import {
  useCMSPages, saveCMSBlock, setCMSPagePublished,
  addCMSBlock, deleteCMSBlock, reorderCMSBlocks
} from '../../lib/useCMS.js'

const BLOCK_TYPES = [
  { type: 'hero',         label: 'Hero Section',   icon: '🦸' },
  { type: 'stats',        label: 'Stats Strip',    icon: '📊' },
  { type: 'features',     label: 'Features Grid',  icon: '✨' },
  { type: 'cards',        label: 'Cards Grid',     icon: '🃏' },
  { type: 'steps',        label: 'Steps List',     icon: '📋' },
  { type: 'text_section', label: 'Text Section',   icon: '📝' },
  { type: 'pricing',      label: 'Pricing Plans',  icon: '💰' },
  { type: 'faq',          label: 'FAQ',            icon: '❓' },
  { type: 'cta',          label: 'Call to Action', icon: '📣' },
  { type: 'contact',      label: 'Contact',        icon: '📧' },
]

const DEFAULT_CONTENT = {
  hero:         { eyebrow: '', headline: '', subheadline: '', cta_primary_text: '', cta_primary_url: '', cta_secondary_text: '', cta_secondary_url: '' },
  stats:        { items: [{ value: '', label: '' }] },
  features:     { eyebrow: '', headline: '', items: [{ icon: '⭐', title: '', desc: '' }] },
  cards:        { headline: '', items: [{ icon: '⭐', title: '', desc: '' }] },
  steps:        { headline: '', items: [{ n: '01', title: '', body: '' }] },
  text_section: { headline: '', paragraphs: [''] },
  pricing:      { headline: '', plans: [] },
  faq:          { headline: '', items: [{ q: '', a: '' }] },
  cta:          { headline: '', subtext: '', cta_text: '', cta_url: '', cta_secondary_text: '', cta_secondary_url: '' },
  contact:      { headline: '', subtext: '', email: '' },
}

// ── Per-type block editor forms ───────────────────────────────────
function BlockForm({ type, content, onChange }) {
  const update = (key, value) => onChange({ ...content, [key]: value })

  const updateItem = (listKey, index, field, value) => {
    const items = [...(content[listKey] ?? [])]
    items[index] = { ...items[index], [field]: value }
    onChange({ ...content, [listKey]: items })
  }

  const addItem = (listKey, template) =>
    onChange({ ...content, [listKey]: [...(content[listKey] ?? []), { ...template }] })

  const removeItem = (listKey, index) => {
    const items = [...(content[listKey] ?? [])]
    items.splice(index, 1)
    onChange({ ...content, [listKey]: items })
  }

  const inp = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }
  const ta  = { ...inp, resize: 'vertical', minHeight: '80px' }
  const lbl = { display: 'block', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }
  const addBtn = (label, onClick) => (
    <button onClick={onClick} style={{ fontSize: '12px', color: C.gold, background: 'none', border: `1px dashed ${C.gold}40`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: F.sans, marginTop: '4px' }}>
      + {label}
    </button>
  )
  const delBtn = (onClick) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>×</button>
  )
  const itemBox = (children) => (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>{children}</div>
  )

  if (type === 'hero') return (
    <div>
      <label style={lbl}>Eyebrow</label>
      <input style={inp} value={content.eyebrow ?? ''} onChange={e => update('eyebrow', e.target.value)} placeholder="Brand Campaign Intelligence Platform" />
      <label style={lbl}>Headline (use \n for line break)</label>
      <textarea style={ta} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-headline</label>
      <textarea style={ta} value={content.subheadline ?? ''} onChange={e => update('subheadline', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lbl}>Primary Button Text</label>
          <input style={inp} value={content.cta_primary_text ?? ''} onChange={e => update('cta_primary_text', e.target.value)} placeholder="Get Started →" />
          <label style={lbl}>Primary Button URL</label>
          <input style={inp} value={content.cta_primary_url ?? ''} onChange={e => update('cta_primary_url', e.target.value)} placeholder="/auth?signup=true" />
        </div>
        <div>
          <label style={lbl}>Secondary Button Text (optional)</label>
          <input style={inp} value={content.cta_secondary_text ?? ''} onChange={e => update('cta_secondary_text', e.target.value)} placeholder="Learn More" />
          <label style={lbl}>Secondary Button URL</label>
          <input style={inp} value={content.cta_secondary_url ?? ''} onChange={e => update('cta_secondary_url', e.target.value)} placeholder="/how-it-works" />
        </div>
      </div>
    </div>
  )

  if (type === 'stats') return (
    <div>
      <label style={lbl}>Stats (value + label)</label>
      {(content.items ?? []).map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input style={{ ...inp, marginBottom: 0, width: '90px' }} value={item.value ?? ''} onChange={e => updateItem('items', i, 'value', e.target.value)} placeholder="38" />
          <input style={{ ...inp, marginBottom: 0, flex: 1 }} value={item.label ?? ''} onChange={e => updateItem('items', i, 'label', e.target.value)} placeholder="Research-grade questions" />
          {delBtn(() => removeItem('items', i))}
        </div>
      ))}
      {addBtn('Add Stat', () => addItem('items', { value: '', label: '' }))}
    </div>
  )

  if (type === 'features' || type === 'cards') return (
    <div>
      {type === 'features' && <>
        <label style={lbl}>Eyebrow</label>
        <input style={inp} value={content.eyebrow ?? ''} onChange={e => update('eyebrow', e.target.value)} />
      </>}
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Items</label>
      {(content.items ?? []).map((item, i) => (
        itemBox(
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>Item {i + 1}</span>
              {delBtn(() => removeItem('items', i))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '8px' }}>
              <input style={inp} value={item.icon ?? ''} onChange={e => updateItem('items', i, 'icon', e.target.value)} placeholder="📡" />
              <input style={inp} value={item.title ?? ''} onChange={e => updateItem('items', i, 'title', e.target.value)} placeholder="Title" />
            </div>
            <textarea style={{ ...ta, marginBottom: 0 }} value={item.desc ?? ''} onChange={e => updateItem('items', i, 'desc', e.target.value)} placeholder="Description..." />
          </div>
        )
      ))}
      {addBtn('Add Item', () => addItem('items', { icon: '⭐', title: '', desc: '' }))}
    </div>
  )

  if (type === 'steps') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Steps</label>
      {(content.items ?? []).map((item, i) => (
        itemBox(
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>Step {i + 1}</span>
              {delBtn(() => removeItem('items', i))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '8px' }}>
              <input style={inp} value={item.n ?? ''} onChange={e => updateItem('items', i, 'n', e.target.value)} placeholder="01" />
              <input style={inp} value={item.title ?? ''} onChange={e => updateItem('items', i, 'title', e.target.value)} placeholder="Step title" />
            </div>
            <textarea style={{ ...ta, marginBottom: 0 }} value={item.body ?? ''} onChange={e => updateItem('items', i, 'body', e.target.value)} placeholder="Step description..." />
          </div>
        )
      ))}
      {addBtn('Add Step', () => addItem('items', { n: `0${(content.items?.length ?? 0) + 1}`, title: '', body: '' }))}
    </div>
  )

  if (type === 'text_section') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Paragraphs</label>
      {(content.paragraphs ?? []).map((para, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <textarea style={{ ...ta, marginBottom: 0, flex: 1 }} value={para} onChange={e => {
            const paras = [...(content.paragraphs ?? [])]
            paras[i] = e.target.value
            onChange({ ...content, paragraphs: paras })
          }} placeholder="Paragraph text..." />
          {delBtn(() => removeItem('paragraphs', i))}
        </div>
      ))}
      {addBtn('Add Paragraph', () => onChange({ ...content, paragraphs: [...(content.paragraphs ?? []), ''] }))}
    </div>
  )

  if (type === 'faq') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Questions & Answers</label>
      {(content.items ?? []).map((item, i) => (
        itemBox(
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>Q{i + 1}</span>
              {delBtn(() => removeItem('items', i))}
            </div>
            <input style={inp} value={item.q ?? ''} onChange={e => updateItem('items', i, 'q', e.target.value)} placeholder="Question..." />
            <textarea style={{ ...ta, marginBottom: 0 }} value={item.a ?? ''} onChange={e => updateItem('items', i, 'a', e.target.value)} placeholder="Answer..." />
          </div>
        )
      ))}
      {addBtn('Add FAQ', () => addItem('items', { q: '', a: '' }))}
    </div>
  )

  if (type === 'cta') return (
    <div>
      <label style={lbl}>Headline</label>
      <textarea style={ta} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label>
      <input style={inp} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lbl}>Button Text</label>
          <input style={inp} value={content.cta_text ?? ''} onChange={e => update('cta_text', e.target.value)} />
          <label style={lbl}>Button URL</label>
          <input style={inp} value={content.cta_url ?? ''} onChange={e => update('cta_url', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Secondary Button Text (optional)</label>
          <input style={inp} value={content.cta_secondary_text ?? ''} onChange={e => update('cta_secondary_text', e.target.value)} />
          <label style={lbl}>Secondary Button URL</label>
          <input style={inp} value={content.cta_secondary_url ?? ''} onChange={e => update('cta_secondary_url', e.target.value)} />
        </div>
      </div>
    </div>
  )

  if (type === 'contact') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label>
      <textarea style={ta} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      <label style={lbl}>Email Address</label>
      <input style={inp} value={content.email ?? ''} onChange={e => update('email', e.target.value)} placeholder="hello@adchasser.com" />
    </div>
  )

  if (type === 'pricing') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Plans (JSON — edit carefully)</label>
      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '6px', lineHeight: 1.5 }}>
        Each plan: name, price, sub, desc, popular (true/false), features[], cta, cta_url
      </p>
      <textarea
        style={{ ...ta, minHeight: '220px', fontFamily: 'monospace', fontSize: '11px' }}
        value={JSON.stringify(content.plans ?? [], null, 2)}
        onChange={e => { try { onChange({ ...content, plans: JSON.parse(e.target.value) }) } catch {} }}
      />
    </div>
  )

  // Fallback JSON editor
  return (
    <div>
      <label style={lbl}>Raw JSON Content</label>
      <textarea
        style={{ ...ta, minHeight: '180px', fontFamily: 'monospace', fontSize: '11px' }}
        value={JSON.stringify(content, null, 2)}
        onChange={e => { try { onChange(JSON.parse(e.target.value)) } catch {} }}
      />
    </div>
  )
}

// ── Main CMSEditor component ──────────────────────────────────────
export default function CMSEditor({ onExit }) {
  const { pages, loading, refetch } = useCMSPages()
  const [selectedPage,  setSelectedPage]  = useState(null)
  const [editingBlock,  setEditingBlock]  = useState(null)
  const [editContent,   setEditContent]   = useState({})
  const [saving,        setSaving]        = useState(false)
  const [publishing,    setPublishing]    = useState(false)
  const [addingBlock,   setAddingBlock]   = useState(false)
  const [newBlockType,  setNewBlockType]  = useState('')
  const [toast,         setToast]         = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const page   = pages.find(p => p.id === selectedPage) ?? null
  const blocks = page?.cms_blocks ?? []

  const handleEditBlock = (block) => {
    setEditingBlock(block.id)
    setEditContent({ ...block.content })
  }

  const handleSaveBlock = async () => {
    setSaving(true)
    try {
      await saveCMSBlock(editingBlock, editContent)
      setEditingBlock(null)
      await refetch()
      showToast('Block saved ✓')
    } catch (e) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const handleTogglePublish = async () => {
    if (!page) return
    setPublishing(true)
    try {
      await setCMSPagePublished(page.id, !page.published)
      await refetch()
      showToast(page.published ? 'Page unpublished' : '🚀 Page is now live!')
    } catch (e) { showToast(e.message, 'error') }
    setPublishing(false)
  }

  const handleDeleteBlock = async (blockId) => {
    if (!confirm('Delete this block? This cannot be undone.')) return
    try {
      await deleteCMSBlock(blockId)
      if (editingBlock === blockId) setEditingBlock(null)
      await refetch()
      showToast('Block deleted')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleMoveBlock = async (index, direction) => {
    const arr = [...blocks]
    const target = index + direction
    if (target < 0 || target >= arr.length) return
    const updates = arr.map((b, i) => {
      if (i === index)  return { id: b.id, sort_order: arr[target].sort_order }
      if (i === target) return { id: b.id, sort_order: arr[index].sort_order }
      return { id: b.id, sort_order: b.sort_order }
    })
    try { await reorderCMSBlocks(updates); await refetch() }
    catch (e) { showToast(e.message, 'error') }
  }

  const handleAddBlock = async () => {
    if (!newBlockType || !page) return
    try {
      const maxOrder = Math.max(...blocks.map(b => b.sort_order), -1)
      await addCMSBlock(page.id, newBlockType, DEFAULT_CONTENT[newBlockType] ?? {}, maxOrder + 1)
      setAddingBlock(false)
      setNewBlockType('')
      await refetch()
      showToast('Block added')
    } catch (e) { showToast(e.message, 'error') }
  }

  const blockInfo = (type) => BLOCK_TYPES.find(b => b.type === type) ?? { label: type, icon: '📦' }
  const blockPreview = (block) => block.content?.headline ?? block.content?.eyebrow ?? blockInfo(block.type).label

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F.sans, color: C.text }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : C.green, color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onExit} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '6px 12px', fontFamily: F.sans }}>← Back</button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, fontFamily: F.display, margin: 0, color: C.text }}>CMS Editor</h1>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: F.sans }}>Edit public-facing pages</p>
          </div>
        </div>
        {page && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: page.published ? C.green : C.muted, fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: page.published ? C.green : C.muted }} />
              {page.published ? 'Live' : 'Draft'}
            </span>
            <button onClick={handleTogglePublish} disabled={publishing} style={{ padding: '8px 18px', background: page.published ? 'rgba(239,68,68,0.1)' : `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: page.published ? '1px solid rgba(239,68,68,0.3)' : 'none', borderRadius: '8px', color: page.published ? '#ef4444' : C.bg, fontSize: '13px', fontWeight: 600, cursor: publishing ? 'not-allowed' : 'pointer', fontFamily: F.sans, opacity: publishing ? 0.7 : 1 }}>
              {publishing ? '...' : page.published ? 'Unpublish' : '🚀 Publish'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

        {/* Sidebar — page list */}
        <div style={{ width: '210px', borderRight: `1px solid ${C.border}`, padding: '16px 12px', background: C.card, flexShrink: 0 }}>
          <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', padding: '0 4px' }}>Pages</p>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner size={18} /></div>
          ) : pages.map(p => (
            <button key={p.id} onClick={() => { setSelectedPage(p.id); setEditingBlock(null); setAddingBlock(false) }} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', textAlign: 'left', background: selectedPage === p.id ? C.goldDim : 'transparent', border: `1px solid ${selectedPage === p.id ? C.gold + '40' : 'transparent'}`, cursor: 'pointer', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '13px', fontFamily: F.sans, color: selectedPage === p.id ? C.gold : C.text, fontWeight: selectedPage === p.id ? 600 : 400 }}>{p.title}</span>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.published ? C.green : C.dim, flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxWidth: '860px' }}>
          {!selectedPage ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: C.muted }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
              <p style={{ fontSize: '16px', fontFamily: F.sans, color: C.muted }}>Select a page from the sidebar to start editing</p>
            </div>
          ) : (
            <>
              {/* Page header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, margin: 0 }}>{page?.title}</h2>
                  <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, marginTop: '3px' }}>
                    {blocks.length} block{blocks.length !== 1 ? 's' : ''} · {page?.published ? 'Published' : 'Draft — not visible on site'}
                  </p>
                </div>
                <button onClick={() => { setAddingBlock(!addingBlock); setNewBlockType('') }} style={{ padding: '8px 18px', background: addingBlock ? C.surface : C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '10px', color: C.gold, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', fontWeight: 600 }}>
                  {addingBlock ? '✕ Cancel' : '+ Add Block'}
                </button>
              </div>

              {/* Add block panel */}
              {addingBlock && (
                <div style={{ background: C.card, border: `1px solid ${C.gold}30`, borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, marginBottom: '12px', color: C.text }}>Choose a block type:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.type} onClick={() => setNewBlockType(bt.type)} style={{ padding: '9px 12px', borderRadius: '9px', border: `1px solid ${newBlockType === bt.type ? C.gold : C.border}`, background: newBlockType === bt.type ? C.goldDim : 'transparent', color: newBlockType === bt.type ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s' }}>
                        <span>{bt.icon}</span> {bt.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleAddBlock} disabled={!newBlockType} style={{ padding: '9px 22px', background: newBlockType ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : C.dim, border: 'none', borderRadius: '9px', color: C.bg, fontSize: '13px', fontWeight: 600, cursor: newBlockType ? 'pointer' : 'not-allowed', fontFamily: F.sans }}>
                    Add Block
                  </button>
                </div>
              )}

              {/* Blocks list */}
              {blocks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', border: `2px dashed ${C.border}`, borderRadius: '14px', color: C.muted }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
                  <p style={{ fontSize: '14px', fontFamily: F.sans }}>No blocks yet — add one above</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {blocks.map((block, index) => {
                    const info = blockInfo(block.type)
                    const isEditing = editingBlock === block.id
                    return (
                      <div key={block.id} style={{ background: C.card, border: `1px solid ${isEditing ? C.gold + '60' : C.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                        {/* Block row */}
                        <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '20px', flexShrink: 0 }}>{info.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, margin: 0 }}>{info.label}</p>
                              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {blockPreview(block)}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                            <button onClick={() => handleMoveBlock(index, -1)} disabled={index === 0} style={{ width: '28px', height: '28px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: index === 0 ? C.dim : C.muted, cursor: index === 0 ? 'default' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                            <button onClick={() => handleMoveBlock(index, 1)} disabled={index === blocks.length - 1} style={{ width: '28px', height: '28px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: index === blocks.length - 1 ? C.dim : C.muted, cursor: index === blocks.length - 1 ? 'default' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                            <button onClick={() => isEditing ? setEditingBlock(null) : handleEditBlock(block)} style={{ padding: '5px 13px', background: isEditing ? C.goldDim : 'transparent', border: `1px solid ${isEditing ? C.gold + '50' : C.border}`, borderRadius: '7px', color: isEditing ? C.gold : C.muted, fontSize: '12px', cursor: 'pointer', fontFamily: F.sans, fontWeight: isEditing ? 600 : 400 }}>
                              {isEditing ? 'Close' : 'Edit'}
                            </button>
                            <button onClick={() => handleDeleteBlock(block.id)} style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        </div>

                        {/* Inline editor */}
                        {isEditing && (
                          <div style={{ padding: '18px 20px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
                            <BlockForm type={block.type} content={editContent} onChange={setEditContent} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
                              <button onClick={handleSaveBlock} disabled={saving} style={{ padding: '9px 22px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '9px', color: C.bg, fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F.sans, opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Saving…' : '✓ Save Block'}
                              </button>
                              <button onClick={() => setEditingBlock(null)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '9px', color: C.muted, fontSize: '13px', cursor: 'pointer', fontFamily: F.sans }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; } }`}</style>
    </div>
  )
}
