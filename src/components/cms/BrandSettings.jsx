import { useState, useEffect } from 'react'
import { C, F } from '../../tokens.js'
import { Spinner } from '../shared/ui.jsx'
import { useBrandSettings, saveBrandSettings, uploadCMSImage } from '../../lib/useCMS.js'
import { FONT_FAMILIES } from '../../lib/blockStyles.js'

const PRESET_COLORS = [
  '#C9A84C', '#E5C76B', '#3b82f6', '#22c55e',
  '#ef4444', '#a855f7', '#f97316', '#06b6d4',
  '#ffffff', '#E2E6F3', '#111827', '#07090F',
]

function ColorField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <input type="color" value={value ?? '#C9A84C'} onChange={e => onChange(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
        <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="#C9A84C" style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 10px', color: C.text, fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => onChange(c)} title={c} style={{ width: '20px', height: '20px', borderRadius: '4px', background: c, border: value === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}

export default function BrandSettings({ onToast }) {
  const { settings, loading, refetch } = useBrandSettings()
  const [form,    setForm]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      await saveBrandSettings(form.id, {
        site_name:       form.site_name,
        tagline:         form.tagline,
        primary_color:   form.primary_color,
        secondary_color: form.secondary_color,
        headline_font:   form.headline_font,
        body_font:       form.body_font,
        logo_url:        form.logo_url,
      })
      await refetch()
      onToast?.('Brand settings saved ✓')
    } catch (e) { onToast?.(e.message, 'error') }
    setSaving(false)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const url = await uploadCMSImage(file)
      update('logo_url', url)
    } catch (err) { onToast?.(err.message, 'error') }
    setLogoUploading(false)
  }

  const inp = { width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }
  const lbl = { display: 'block', fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }
  const sel = { ...inp, cursor: 'pointer', appearance: 'none' }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner size={24} /></div>
  if (!form) return null

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: F.display, margin: '0 0 4px' }}>Brand Settings</h3>
        <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, margin: 0 }}>Global defaults applied across all pages</p>
      </div>

      {/* Logo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={lbl}>Brand Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ height: '48px', borderRadius: '8px', objectFit: 'contain', background: C.surface, padding: '4px' }} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏷️</div>
          )}
          <div>
            <label style={{ padding: '7px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '12px', fontFamily: F.sans, cursor: logoUploading ? 'not-allowed' : 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              {logoUploading ? 'Uploading…' : form.logo_url ? '↺ Replace' : 'Upload Logo'}
            </label>
            {form.logo_url && (
              <button onClick={() => update('logo_url', '')} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontFamily: F.sans }}>Remove</button>
            )}
          </div>
        </div>
      </div>

      {/* Site name + tagline */}
      <label style={lbl}>Site Name</label>
      <input style={inp} value={form.site_name ?? ''} onChange={e => update('site_name', e.target.value)} placeholder="AdChasser" />

      <label style={lbl}>Tagline</label>
      <input style={inp} value={form.tagline ?? ''} onChange={e => update('tagline', e.target.value)} placeholder="Brand Campaign Intelligence Platform" />

      {/* Colors */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', marginBottom: '4px' }}>
        <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Brand Colors</p>
      </div>
      <ColorField label="Primary / Accent Color" value={form.primary_color}   onChange={v => update('primary_color',   v)} />
      <ColorField label="Secondary Color"         value={form.secondary_color} onChange={v => update('secondary_color', v)} />

      {/* Color preview */}
      <div style={{ padding: '14px', borderRadius: '10px', background: C.bg, border: `1px solid ${C.border}`, marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.primary_color, flexShrink: 0 }} />
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: form.secondary_color, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '12px', fontFamily: F.sans, color: form.primary_color, fontWeight: 600, margin: '0 0 2px' }}>Primary — {form.primary_color}</p>
          <p style={{ fontSize: '12px', fontFamily: F.sans, color: form.secondary_color, margin: 0 }}>Secondary — {form.secondary_color}</p>
        </div>
      </div>

      {/* Fonts */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', marginBottom: '4px' }}>
        <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Typography</p>
      </div>
      <label style={lbl}>Headline Font</label>
      <select value={form.headline_font ?? 'Playfair Display'} onChange={e => update('headline_font', e.target.value)} style={sel}>
        {Object.keys(FONT_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <label style={lbl}>Body Font</label>
      <select value={form.body_font ?? 'DM Sans'} onChange={e => update('body_font', e.target.value)} style={sel}>
        {Object.keys(FONT_FAMILIES).map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Font preview */}
      <div style={{ padding: '16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Font Preview</p>
        <p style={{ fontFamily: FONT_FAMILIES[form.headline_font] ?? 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: C.text, marginBottom: '6px', lineHeight: 1.2 }}>Headline in {form.headline_font}</p>
        <p style={{ fontFamily: FONT_FAMILIES[form.body_font] ?? 'DM Sans, sans-serif', fontSize: '14px', color: C.muted, lineHeight: 1.6 }}>Body text in {form.body_font} — clear and readable at all sizes.</p>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F.sans, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : '✓ Save Brand Settings'}
      </button>

      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, textAlign: 'center', marginTop: '10px', lineHeight: 1.6 }}>
        These become the default for all new blocks. Existing blocks with custom styles keep their settings.
      </p>
    </div>
  )
}
