import { useState } from 'react'
import { C, F } from '../../tokens.js'
import { Spinner } from '../shared/ui.jsx'
import StylePanel from './StylePanel.jsx'
import BrandSettings from './BrandSettings.jsx'
import ImageUploadField from './ImageUploadField.jsx'
import {
  useCMSPages, saveCMSBlock, setCMSPagePublished,
  addCMSBlock, deleteCMSBlock, duplicateCMSBlock,
  reorderCMSBlocks, useBrandSettings,
} from '../../lib/useCMS.js'
import { DEFAULT_STYLES, getDefaultStyles } from '../../lib/blockStyles.js'

const BLOCK_TYPES = [
  { type: 'hero',         label: 'Hero',          icon: '🦸', group: 'Layout' },
  { type: 'image_text',   label: 'Image + Text',  icon: '🖼️', group: 'Layout' },
  { type: 'banner',       label: 'Banner',        icon: '📢', group: 'Layout' },
  { type: 'stats',        label: 'Stats Strip',   icon: '📊', group: 'Content' },
  { type: 'features',     label: 'Features Grid', icon: '✨', group: 'Content' },
  { type: 'cards',        label: 'Cards Grid',    icon: '🃏', group: 'Content' },
  { type: 'steps',        label: 'Steps',         icon: '📋', group: 'Content' },
  { type: 'testimonials', label: 'Testimonials',  icon: '💬', group: 'Content' },
  { type: 'team',         label: 'Team',          icon: '👥', group: 'Content' },
  { type: 'gallery',      label: 'Gallery',       icon: '🖼️', group: 'Media' },
  { type: 'video',        label: 'Video Embed',   icon: '▶️',  group: 'Media' },
  { type: 'text_section', label: 'Text Block',    icon: '📝', group: 'Text' },
  { type: 'faq',          label: 'FAQ',           icon: '❓', group: 'Text' },
  { type: 'pricing',      label: 'Pricing',       icon: '💰', group: 'Commerce' },
  { type: 'cta',          label: 'Call to Action',icon: '📣', group: 'CTA' },
  { type: 'contact',      label: 'Contact',       icon: '📧', group: 'CTA' },
]

const DEFAULT_CONTENT = {
  hero:         { eyebrow: '', headline: '', subheadline: '', bg_image: '', cta_primary_text: 'Get Started →', cta_primary_url: '/auth?signup=true', cta_secondary_text: '', cta_secondary_url: '' },
  image_text:   { headline: '', body: '', image_url: '', image_position: 'right', cta_text: '', cta_url: '' },
  banner:       { text: '', cta_text: '', cta_url: '' },
  stats:        { items: [{ value: '', label: '' }] },
  features:     { eyebrow: '', headline: '', items: [{ icon: '⭐', title: '', desc: '' }] },
  cards:        { headline: '', items: [{ icon: '⭐', image_url: '', title: '', desc: '' }] },
  steps:        { headline: '', items: [{ n: '01', title: '', body: '' }] },
  testimonials: { headline: '', items: [{ quote: '', author: '', role: '', company: '', avatar_url: '' }] },
  team:         { headline: '', subtext: '', items: [{ name: '', role: '', bio: '', image_url: '' }] },
  gallery:      { headline: '', columns: 3, items: [{ image_url: '', caption: '', alt: '' }] },
  video:        { headline: '', subtext: '', video_url: '', poster_url: '' },
  text_section: { headline: '', paragraphs: [''] },
  faq:          { headline: '', items: [{ q: '', a: '' }] },
  pricing:      { headline: '', plans: [] },
  cta:          { headline: '', subtext: '', cta_text: 'Get Started →', cta_url: '/auth?signup=true', cta_secondary_text: '', cta_secondary_url: '' },
  contact:      { headline: '', subtext: '', email: '' },
}

// ── Block Form — content editor per type ─────────────────────────
function BlockForm({ type, content, onChange }) {
  const update = (key, value) => onChange({ ...content, [key]: value })

  const updateItem = (listKey, index, field, value) => {
    const items = [...(content[listKey] ?? [])]
    items[index] = { ...items[index], [field]: value }
    onChange({ ...content, [listKey]: items })
  }

  const addItem    = (listKey, template) => onChange({ ...content, [listKey]: [...(content[listKey] ?? []), { ...template }] })
  const removeItem = (listKey, index) => { const items = [...(content[listKey] ?? [])]; items.splice(index, 1); onChange({ ...content, [listKey]: items }) }

  const inp  = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }
  const ta   = { ...inp, resize: 'vertical', minHeight: '80px' }
  const lbl  = { display: 'block', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }
  const sel  = { ...inp, cursor: 'pointer' }
  const box  = (key, children) => <div key={key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>{children}</div>
  const del  = (onClick) => <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>×</button>
  const add  = (label, onClick) => <button onClick={onClick} style={{ fontSize: '12px', color: C.gold, background: 'none', border: `1px dashed ${C.gold}40`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: F.sans, marginTop: '6px' }}>+ {label}</button>
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }
  const itemHeader = (label, i, listKey) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600 }}>{label} {i + 1}</span>
      {del(() => removeItem(listKey, i))}
    </div>
  )

  if (type === 'hero') return (
    <div>
      <label style={lbl}>Background Image or Video (optional)</label>
      <ImageUploadField value={content.bg_image ?? ''} onChange={v => update('bg_image', v)} aspectRatio="16/5" acceptVideo={true} />
      <label style={lbl}>Eyebrow</label>
      <input style={inp} value={content.eyebrow ?? ''} onChange={e => update('eyebrow', e.target.value)} placeholder="Brand Campaign Intelligence Platform" />
      <label style={lbl}>Headline (use \n for line break)</label>
      <textarea style={ta} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-headline</label>
      <textarea style={ta} value={content.subheadline ?? ''} onChange={e => update('subheadline', e.target.value)} />
      <div style={row2}>
        <div>
          <label style={lbl}>Primary Button</label>
          <input style={inp} value={content.cta_primary_text ?? ''} onChange={e => update('cta_primary_text', e.target.value)} placeholder="Get Started →" />
          <input style={inp} value={content.cta_primary_url ?? ''} onChange={e => update('cta_primary_url', e.target.value)} placeholder="/auth?signup=true" />
        </div>
        <div>
          <label style={lbl}>Secondary Button</label>
          <input style={inp} value={content.cta_secondary_text ?? ''} onChange={e => update('cta_secondary_text', e.target.value)} placeholder="Learn More (optional)" />
          <input style={inp} value={content.cta_secondary_url ?? ''} onChange={e => update('cta_secondary_url', e.target.value)} placeholder="/how-it-works" />
        </div>
      </div>
    </div>
  )

  if (type === 'image_text') return (
    <div>
      <label style={lbl}>Image</label>
      <ImageUploadField value={content.image_url ?? ''} onChange={v => update('image_url', v)} aspectRatio="4/3" />
      <label style={lbl}>Image Position</label>
      <select value={content.image_position ?? 'right'} onChange={e => update('image_position', e.target.value)} style={sel}>
        <option value="left">Image Left, Text Right</option>
        <option value="right">Image Right, Text Left</option>
      </select>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Body Text</label>
      <textarea style={ta} value={content.body ?? ''} onChange={e => update('body', e.target.value)} />
      <div style={row2}>
        <div><label style={lbl}>Button Text</label><input style={inp} value={content.cta_text ?? ''} onChange={e => update('cta_text', e.target.value)} /></div>
        <div><label style={lbl}>Button URL</label><input style={inp} value={content.cta_url ?? ''} onChange={e => update('cta_url', e.target.value)} /></div>
      </div>
    </div>
  )

  if (type === 'banner') return (
    <div>
      <label style={lbl}>Banner Text</label>
      <input style={inp} value={content.text ?? ''} onChange={e => update('text', e.target.value)} placeholder="🎉 New feature — learn more" />
      <div style={row2}>
        <div><label style={lbl}>Button Text (optional)</label><input style={inp} value={content.cta_text ?? ''} onChange={e => update('cta_text', e.target.value)} /></div>
        <div><label style={lbl}>Button URL</label><input style={inp} value={content.cta_url ?? ''} onChange={e => update('cta_url', e.target.value)} /></div>
      </div>
    </div>
  )

  if (type === 'stats') return (
    <div>
      {(content.items ?? []).map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input style={{ ...inp, marginBottom: 0, width: '90px' }} value={item.value ?? ''} onChange={e => updateItem('items', i, 'value', e.target.value)} placeholder="38" />
          <input style={{ ...inp, marginBottom: 0, flex: 1 }} value={item.label ?? ''} onChange={e => updateItem('items', i, 'label', e.target.value)} placeholder="Description" />
          {del(() => removeItem('items', i))}
        </div>
      ))}
      {add('Add Stat', () => addItem('items', { value: '', label: '' }))}
    </div>
  )

  if (type === 'features' || type === 'cards') return (
    <div>
      {type === 'features' && <><label style={lbl}>Eyebrow</label><input style={inp} value={content.eyebrow ?? ''} onChange={e => update('eyebrow', e.target.value)} /></>}
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Item', i, 'items')}
          {type === 'cards' && <ImageUploadField label="Card Image (optional)" value={item.image_url ?? ''} onChange={v => updateItem('items', i, 'image_url', v)} aspectRatio="16/9" />}
          <div style={row2}>
            <input style={inp} value={item.icon ?? ''} onChange={e => updateItem('items', i, 'icon', e.target.value)} placeholder="📡 Icon" />
            <input style={inp} value={item.title ?? ''} onChange={e => updateItem('items', i, 'title', e.target.value)} placeholder="Title" />
          </div>
          <textarea style={{ ...ta, marginBottom: 0 }} value={item.desc ?? item.body ?? ''} onChange={e => updateItem('items', i, 'desc', e.target.value)} placeholder="Description…" />
        </div>
      ))}
      {add('Add Item', () => addItem('items', { icon: '⭐', image_url: '', title: '', desc: '' }))}
    </div>
  )

  if (type === 'steps') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Step', i, 'items')}
          <div style={row2}>
            <input style={inp} value={item.n ?? ''} onChange={e => updateItem('items', i, 'n', e.target.value)} placeholder="01" />
            <input style={inp} value={item.title ?? ''} onChange={e => updateItem('items', i, 'title', e.target.value)} placeholder="Step title" />
          </div>
          <textarea style={{ ...ta, marginBottom: 0 }} value={item.body ?? ''} onChange={e => updateItem('items', i, 'body', e.target.value)} placeholder="Description…" />
        </div>
      ))}
      {add('Add Step', () => addItem('items', { n: `0${(content.items?.length ?? 0) + 1}`, title: '', body: '' }))}
    </div>
  )

  if (type === 'testimonials') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Testimonial', i, 'items')}
          <ImageUploadField label="Avatar (optional)" value={item.avatar_url ?? ''} onChange={v => updateItem('items', i, 'avatar_url', v)} aspectRatio="1/1" maxWidth="100px" />
          <label style={lbl}>Quote</label>
          <textarea style={ta} value={item.quote ?? ''} onChange={e => updateItem('items', i, 'quote', e.target.value)} placeholder="This is an incredible tool…" />
          <div style={row2}>
            <input style={inp} value={item.author ?? ''} onChange={e => updateItem('items', i, 'author', e.target.value)} placeholder="Name" />
            <input style={inp} value={item.role ?? ''} onChange={e => updateItem('items', i, 'role', e.target.value)} placeholder="Role" />
          </div>
          <input style={{ ...inp, marginBottom: 0 }} value={item.company ?? ''} onChange={e => updateItem('items', i, 'company', e.target.value)} placeholder="Company" />
        </div>
      ))}
      {add('Add Testimonial', () => addItem('items', { quote: '', author: '', role: '', company: '', avatar_url: '' }))}
    </div>
  )

  if (type === 'team') return (
    <div>
      <label style={lbl}>Section Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label>
      <input style={inp} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Team Member', i, 'items')}
          <ImageUploadField label="Photo" value={item.image_url ?? ''} onChange={v => updateItem('items', i, 'image_url', v)} aspectRatio="1/1" maxWidth="120px" />
          <div style={row2}>
            <input style={inp} value={item.name ?? ''} onChange={e => updateItem('items', i, 'name', e.target.value)} placeholder="Full Name" />
            <input style={inp} value={item.role ?? ''} onChange={e => updateItem('items', i, 'role', e.target.value)} placeholder="Role / Title" />
          </div>
          <textarea style={{ ...ta, marginBottom: 0 }} value={item.bio ?? ''} onChange={e => updateItem('items', i, 'bio', e.target.value)} placeholder="Short bio…" />
        </div>
      ))}
      {add('Add Member', () => addItem('items', { name: '', role: '', bio: '', image_url: '' }))}
    </div>
  )

  if (type === 'gallery') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Columns</label>
      <select value={content.columns ?? 3} onChange={e => update('columns', Number(e.target.value))} style={sel}>
        {[2, 3, 4].map(n => <option key={n} value={n}>{n} columns</option>)}
      </select>
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Image', i, 'items')}
          <ImageUploadField value={item.image_url ?? ''} onChange={v => updateItem('items', i, 'image_url', v)} aspectRatio="4/3" />
          <input style={{ ...inp, marginBottom: 0 }} value={item.caption ?? ''} onChange={e => updateItem('items', i, 'caption', e.target.value)} placeholder="Caption (optional)" />
        </div>
      ))}
      {add('Add Image', () => addItem('items', { image_url: '', caption: '', alt: '' }))}
    </div>
  )

  if (type === 'video') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label>
      <input style={inp} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      <label style={lbl}>YouTube or Vimeo URL</label>
      <input style={inp} value={content.video_url ?? ''} onChange={e => update('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
      <label style={lbl}>Poster / Thumbnail (optional)</label>
      <ImageUploadField value={content.poster_url ?? ''} onChange={v => update('poster_url', v)} aspectRatio="16/9" />
    </div>
  )

  if (type === 'text_section') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      {(content.paragraphs ?? []).map((para, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <textarea style={{ ...ta, marginBottom: 0, flex: 1 }} value={para} onChange={e => {
            const paras = [...(content.paragraphs ?? [])]
            paras[i] = e.target.value
            onChange({ ...content, paragraphs: paras })
          }} placeholder="Paragraph…" />
          {del(() => removeItem('paragraphs', i))}
        </div>
      ))}
      {add('Add Paragraph', () => onChange({ ...content, paragraphs: [...(content.paragraphs ?? []), ''] }))}
    </div>
  )

  if (type === 'faq') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      {(content.items ?? []).map((item, i) => box(i,
        <div>
          {itemHeader('Question', i, 'items')}
          <input style={inp} value={item.q ?? ''} onChange={e => updateItem('items', i, 'q', e.target.value)} placeholder="Question…" />
          <textarea style={{ ...ta, marginBottom: 0 }} value={item.a ?? ''} onChange={e => updateItem('items', i, 'a', e.target.value)} placeholder="Answer…" />
        </div>
      ))}
      {add('Add FAQ', () => addItem('items', { q: '', a: '' }))}
    </div>
  )

  if (type === 'cta') return (
    <div>
      <label style={lbl}>Headline</label>
      <textarea style={ta} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label>
      <input style={inp} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      <div style={row2}>
        <div><label style={lbl}>Button Text</label><input style={inp} value={content.cta_text ?? ''} onChange={e => update('cta_text', e.target.value)} /><input style={inp} value={content.cta_url ?? ''} onChange={e => update('cta_url', e.target.value)} placeholder="URL" /></div>
        <div><label style={lbl}>Secondary Button</label><input style={inp} value={content.cta_secondary_text ?? ''} onChange={e => update('cta_secondary_text', e.target.value)} /><input style={{ ...inp, marginBottom: 0 }} value={content.cta_secondary_url ?? ''} onChange={e => update('cta_secondary_url', e.target.value)} placeholder="URL (optional)" /></div>
      </div>
    </div>
  )

  if (type === 'contact') return (
    <div>
      <label style={lbl}>Headline</label><input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={lbl}>Sub-text</label><textarea style={ta} value={content.subtext ?? ''} onChange={e => update('subtext', e.target.value)} />
      <label style={lbl}>Email</label><input style={inp} value={content.email ?? ''} onChange={e => update('email', e.target.value)} placeholder="hello@adchasser.com" />
    </div>
  )

  if (type === 'pricing') return (
    <div>
      <label style={lbl}>Headline</label>
      <input style={inp} value={content.headline ?? ''} onChange={e => update('headline', e.target.value)} />
      <label style={{ ...lbl, marginTop: '8px' }}>Plans (JSON — name, price, sub, desc, popular, features[], cta, cta_url)</label>
      <textarea style={{ ...ta, minHeight: '220px', fontFamily: 'monospace', fontSize: '11px' }}
        value={JSON.stringify(content.plans ?? [], null, 2)}
        onChange={e => { try { onChange({ ...content, plans: JSON.parse(e.target.value) }) } catch {} }}
      />
    </div>
  )

  return (
    <div>
      <label style={lbl}>Raw JSON</label>
      <textarea style={{ ...ta, minHeight: '160px', fontFamily: 'monospace', fontSize: '11px' }}
        value={JSON.stringify(content, null, 2)}
        onChange={e => { try { onChange(JSON.parse(e.target.value)) } catch {} }}
      />
    </div>
  )
}

// ── Main CMSEditor ────────────────────────────────────────────────
export default function CMSEditor({ onExit }) {
  const { pages, loading, refetch }      = useCMSPages()
  const { settings: brandSettings }      = useBrandSettings()
  const [selectedPage,  setSelectedPage] = useState(null)
  const [sidebarView,   setSidebarView]  = useState('pages') // 'pages' | 'brand'
  const [editingBlock,  setEditingBlock] = useState(null)
  const [editTab,       setEditTab]      = useState('content')
  const [editContent,   setEditContent]  = useState({})
  const [editStyles,    setEditStyles]   = useState({})
  const [saving,        setSaving]       = useState(false)
  const [publishing,    setPublishing]   = useState(false)
  const [addingBlock,   setAddingBlock]  = useState(false)
  const [newBlockType,  setNewBlockType] = useState('')
  const [toast,         setToast]        = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const page   = pages.find(p => p.id === selectedPage) ?? null
  const blocks = page?.cms_blocks ?? []

  const handleEditBlock = (block) => {
    setEditingBlock(block.id)
    setEditTab('content')
    const { styles, ...rest } = block.content
    setEditContent({ ...rest })
    setEditStyles({ ...getDefaultStyles(brandSettings), ...(styles ?? {}) })
  }

  const handleSaveBlock = async () => {
    setSaving(true)
    try {
      await saveCMSBlock(editingBlock, { ...editContent, styles: editStyles })
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
    if (!confirm('Delete this block?')) return
    try {
      await deleteCMSBlock(blockId)
      if (editingBlock === blockId) setEditingBlock(null)
      await refetch()
      showToast('Block deleted')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleDuplicate = async (block, index) => {
    try {
      await duplicateCMSBlock(block, block.sort_order + 0.5)
      await refetch()
      showToast('Block duplicated')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleMoveBlock = async (index, direction) => {
    const arr    = [...blocks]
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
      const defaultStyles = getDefaultStyles(brandSettings)
      await addCMSBlock(page.id, newBlockType, { ...DEFAULT_CONTENT[newBlockType] ?? {}, styles: defaultStyles }, maxOrder + 1)
      setAddingBlock(false)
      setNewBlockType('')
      await refetch()
      showToast('Block added')
    } catch (e) { showToast(e.message, 'error') }
  }

  const blockInfo    = (type) => BLOCK_TYPES.find(b => b.type === type) ?? { label: type, icon: '📦', group: 'Other' }
  const blockPreview = (block) => block.content?.headline ?? block.content?.eyebrow ?? block.content?.text ?? blockInfo(block.type).label
  const hasStyles    = (block) => !!block.content?.styles && Object.keys(block.content.styles).length > 0

  const groupedTypes = BLOCK_TYPES.reduce((acc, bt) => {
    if (!acc[bt.group]) acc[bt.group] = []
    acc[bt.group].push(bt)
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F.sans, color: C.text, position: 'fixed', inset: 0, zIndex: 9000, overflowY: 'auto', isolation: 'isolate' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : C.green, color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onExit} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.muted, cursor: 'pointer', fontSize: '14px', padding: '6px 12px', fontFamily: F.sans }}>← Back</button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, fontFamily: F.display, margin: 0 }}>CMS Editor</h1>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: F.sans }}>Edit public-facing pages</p>
          </div>
        </div>
        {page && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: page.published ? C.green : C.muted, fontFamily: F.sans, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: page.published ? C.green : C.muted }} />
              {page.published ? 'Live' : 'Draft'}
            </span>
            <button onClick={handleTogglePublish} disabled={publishing} style={{ padding: '8px 18px', background: page.published ? 'rgba(239,68,68,0.1)' : `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: page.published ? '1px solid rgba(239,68,68,0.3)' : 'none', borderRadius: '8px', color: page.published ? '#ef4444' : C.bg, fontSize: '13px', fontWeight: 600, cursor: publishing ? 'not-allowed' : 'pointer', fontFamily: F.sans }}>
              {publishing ? '...' : page.published ? 'Unpublish' : '🚀 Publish'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', borderRight: `1px solid ${C.border}`, background: C.card, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Sidebar tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {[{ key: 'pages', label: '📄 Pages' }, { key: 'brand', label: '🎨 Brand' }].map(t => (
              <button key={t.key} onClick={() => setSidebarView(t.key)} style={{ flex: 1, padding: '10px 8px', background: sidebarView === t.key ? C.surface : 'transparent', border: 'none', borderBottom: sidebarView === t.key ? `2px solid ${C.gold}` : '2px solid transparent', color: sidebarView === t.key ? C.gold : C.muted, fontSize: '12px', fontWeight: sidebarView === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
            {sidebarView === 'pages' ? (
              <>
                <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', padding: '0 4px' }}>Pages</p>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner size={18} /></div>
                ) : pages.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPage(p.id); setEditingBlock(null); setAddingBlock(false) }} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', textAlign: 'left', background: selectedPage === p.id ? C.goldDim : 'transparent', border: `1px solid ${selectedPage === p.id ? C.gold + '40' : 'transparent'}`, cursor: 'pointer', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontFamily: F.sans, color: selectedPage === p.id ? C.gold : C.text, fontWeight: selectedPage === p.id ? 600 : 400 }}>{p.title}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.published ? C.green : C.dim }} />
                  </button>
                ))}
              </>
            ) : (
              <BrandSettings onToast={showToast} />
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {!selectedPage && sidebarView === 'pages' ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: C.muted }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✏️</div>
              <p style={{ fontSize: '16px', fontFamily: F.sans }}>Select a page to start editing</p>
            </div>
          ) : sidebarView === 'brand' ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: C.muted }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
              <p style={{ fontSize: '16px', fontFamily: F.sans }}>Edit brand settings in the sidebar</p>
            </div>
          ) : (
            <>
              {/* Page header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, margin: 0 }}>{page?.title}</h2>
                  <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, marginTop: '3px' }}>
                    {blocks.length} block{blocks.length !== 1 ? 's' : ''} · {page?.published ? '🟢 Live' : '⚪ Draft'}
                  </p>
                </div>
                <button onClick={() => { setAddingBlock(!addingBlock); setNewBlockType('') }} style={{ padding: '8px 18px', background: addingBlock ? C.surface : C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '10px', color: C.gold, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', fontWeight: 600 }}>
                  {addingBlock ? '✕ Cancel' : '+ Add Block'}
                </button>
              </div>

              {/* Add block panel */}
              {addingBlock && (
                <div style={{ background: C.card, border: `1px solid ${C.gold}30`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, marginBottom: '14px' }}>Choose a block type:</p>
                  {Object.entries(groupedTypes).map(([group, types]) => (
                    <div key={group} style={{ marginBottom: '14px' }}>
                      <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{group}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {types.map(bt => (
                          <button key={bt.type} onClick={() => setNewBlockType(bt.type)} style={{ padding: '7px 12px', borderRadius: '9px', border: `1px solid ${newBlockType === bt.type ? C.gold : C.border}`, background: newBlockType === bt.type ? C.goldDim : 'transparent', color: newBlockType === bt.type ? C.gold : C.text, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{bt.icon}</span>{bt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleAddBlock} disabled={!newBlockType} style={{ marginTop: '8px', padding: '9px 24px', background: newBlockType ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : C.dim, border: 'none', borderRadius: '9px', color: C.bg, fontSize: '13px', fontWeight: 600, cursor: newBlockType ? 'pointer' : 'not-allowed', fontFamily: F.sans }}>
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
                    const info      = blockInfo(block.type)
                    const isEditing = editingBlock === block.id
                    const styled    = hasStyles(block)

                    return (
                      <div key={block.id} style={{ background: C.card, border: `1px solid ${isEditing ? C.gold + '60' : C.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                        {/* Block row */}
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{info.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, margin: 0 }}>{info.label}</p>
                                {styled && <span style={{ fontSize: '9px', background: C.goldDim, color: C.gold, border: `1px solid ${C.gold}30`, borderRadius: '4px', padding: '1px 5px', fontFamily: F.sans }}>STYLED</span>}
                              </div>
                              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                                {blockPreview(block)}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                            <button onClick={() => handleMoveBlock(index, -1)} disabled={index === 0} style={{ width: '26px', height: '26px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: index === 0 ? C.dim : C.muted, cursor: index === 0 ? 'default' : 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                            <button onClick={() => handleMoveBlock(index, 1)} disabled={index === blocks.length - 1} style={{ width: '26px', height: '26px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: index === blocks.length - 1 ? C.dim : C.muted, cursor: index === blocks.length - 1 ? 'default' : 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                            <button onClick={() => handleDuplicate(block, index)} title="Duplicate" style={{ width: '26px', height: '26px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⧉</button>
                            <button onClick={() => isEditing ? setEditingBlock(null) : handleEditBlock(block)} style={{ padding: '5px 12px', background: isEditing ? C.goldDim : 'transparent', border: `1px solid ${isEditing ? C.gold + '50' : C.border}`, borderRadius: '7px', color: isEditing ? C.gold : C.muted, fontSize: '12px', cursor: 'pointer', fontFamily: F.sans, fontWeight: isEditing ? 600 : 400 }}>
                              {isEditing ? 'Close' : 'Edit'}
                            </button>
                            <button onClick={() => handleDeleteBlock(block.id)} style={{ width: '26px', height: '26px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        </div>

                        {/* Inline editor */}
                        {isEditing && (
                          <div style={{ borderTop: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
                              {[{ key: 'content', label: '✏️ Content' }, { key: 'style', label: '🎨 Style' }].map(t => (
                                <button key={t.key} onClick={() => setEditTab(t.key)} style={{ flex: 1, padding: '11px', background: editTab === t.key ? C.bg : 'transparent', border: 'none', borderBottom: editTab === t.key ? `2px solid ${C.gold}` : '2px solid transparent', color: editTab === t.key ? C.gold : C.muted, fontSize: '13px', fontWeight: editTab === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer' }}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                            <div style={{ padding: '18px 20px', background: C.bg, maxHeight: '600px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                              {editTab === 'content'
                                ? <BlockForm type={block.type} content={editContent} onChange={setEditContent} />
                                : <StylePanel styles={editStyles} onChange={setEditStyles} />
                              }
                              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
                                <button onClick={handleSaveBlock} disabled={saving} style={{ padding: '9px 22px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '9px', color: C.bg, fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F.sans, opacity: saving ? 0.7 : 1 }}>
                                  {saving ? 'Saving…' : '✓ Save Block'}
                                </button>
                                <button onClick={() => setEditingBlock(null)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '9px', color: C.muted, fontSize: '13px', cursor: 'pointer', fontFamily: F.sans }}>
                                  Cancel
                                </button>
                              </div>
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
    </div>
  )
}
