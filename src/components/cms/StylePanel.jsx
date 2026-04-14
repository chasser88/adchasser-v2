import { useState } from 'react'
import { C, F } from '../../tokens.js'
import {
  FONT_FAMILIES, FONT_WEIGHTS, HEADLINE_SIZES,
  BODY_SIZES, DEFAULT_STYLES,
} from '../../lib/blockStyles.js'

const TABS = ['Typography', 'Colors', 'Layout']

const PRESET_COLORS = [
  '#E2E6F3', '#ffffff', '#07090F', '#111827',
  '#C9A84C', '#E5C76B', '#3b82f6', '#22c55e',
  '#ef4444', '#a855f7', '#f97316', '#06b6d4',
  '#1f2937', '#374151', '#6b7280', '#9ca3af',
]

function ColorField({ label, value, onChange }) {
  const lbl = { fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }

  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <input
          type="color"
          value={value ?? '#E2E6F3'}
          onChange={e => onChange(e.target.value)}
          style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', padding: 0, borderRadius: '8px' }}
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#E2E6F3"
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 10px', color: C.text, fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
        />
      </div>
      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: '20px', height: '20px', borderRadius: '4px',
              background: c, border: value === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function StylePanel({ styles = {}, onChange }) {
  const [tab, setTab] = useState('Typography')
  const s = { ...DEFAULT_STYLES, ...styles }

  const update = (key, value) => onChange({ ...s, [key]: value })

  const lbl  = { fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }
  const sel  = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 10px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', marginBottom: '12px', cursor: 'pointer' }
  const row  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }

  const alignBtn = (align, icon) => (
    <button
      key={align}
      onClick={() => update('textAlign', align)}
      style={{
        flex: 1, padding: '8px', borderRadius: '7px', cursor: 'pointer',
        background: s.textAlign === align ? C.goldDim : 'transparent',
        border: `1px solid ${s.textAlign === align ? C.gold + '50' : C.border}`,
        color: s.textAlign === align ? C.gold : C.muted,
        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {icon}
    </button>
  )

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 8px', background: tab === t ? C.surface : 'transparent',
            border: 'none', borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent',
            color: tab === t ? C.gold : C.muted, fontSize: '12px', fontWeight: tab === t ? 600 : 400,
            fontFamily: F.sans, cursor: 'pointer', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* ── TYPOGRAPHY TAB ── */}
        {tab === 'Typography' && (
          <div>
            <label style={lbl}>Font Family</label>
            <select value={s.fontFamily} onChange={e => update('fontFamily', e.target.value)} style={sel}>
              {Object.keys(FONT_FAMILIES).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <div style={row}>
              <div>
                <label style={lbl}>Headline Size (px)</label>
                <select value={s.headlineSize} onChange={e => update('headlineSize', Number(e.target.value))} style={{ ...sel, marginBottom: 0 }}>
                  {HEADLINE_SIZES.map(n => <option key={n} value={n}>{n}px</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Body Size (px)</label>
                <select value={s.bodySize} onChange={e => update('bodySize', Number(e.target.value))} style={{ ...sel, marginBottom: 0 }}>
                  {BODY_SIZES.map(n => <option key={n} value={n}>{n}px</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={lbl}>Font Weight</label>
              <select value={s.fontWeight} onChange={e => update('fontWeight', e.target.value)} style={sel}>
                {Object.keys(FONT_WEIGHTS).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <label style={lbl}>Text Alignment</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {alignBtn('left',   '⬛◻◻')}
              {alignBtn('center', '◻⬛◻')}
              {alignBtn('right',  '◻◻⬛')}
            </div>

            {/* Live font preview */}
            <div style={{ marginTop: '14px', padding: '14px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</p>
              <p style={{ fontFamily: FONT_FAMILIES[s.fontFamily], fontSize: `${s.headlineSize > 32 ? 24 : s.headlineSize}px`, fontWeight: FONT_WEIGHTS[s.fontWeight], color: C.text, textAlign: s.textAlign, marginBottom: '6px', lineHeight: 1.2 }}>
                Headline Text
              </p>
              <p style={{ fontFamily: FONT_FAMILIES['DM Sans'], fontSize: `${s.bodySize}px`, color: C.muted, textAlign: s.textAlign, lineHeight: 1.6 }}>
                Body text appears like this in the section.
              </p>
            </div>
          </div>
        )}

        {/* ── COLORS TAB ── */}
        {tab === 'Colors' && (
          <div>
            <ColorField label="Text Color"       value={s.textColor}   onChange={v => update('textColor',   v)} />
            <ColorField label="Background Color" value={s.bgColor}     onChange={v => update('bgColor',     v)} />
            <ColorField label="Accent Color"     value={s.accentColor} onChange={v => update('accentColor', v)} />
            <ColorField label="Button Background" value={s.buttonBg}   onChange={v => update('buttonBg',    v)} />
            <ColorField label="Button Text"      value={s.buttonText}  onChange={v => update('buttonText',  v)} />

            {/* Color preview */}
            <div style={{ padding: '14px', borderRadius: '10px', background: s.bgColor === 'transparent' ? C.surface : s.bgColor, border: `1px solid ${C.border}`, marginTop: '4px' }}>
              <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</p>
              <p style={{ fontSize: '11px', color: s.accentColor, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: F.sans }}>EYEBROW</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: s.textColor, marginBottom: '6px', fontFamily: F.display }}>Section Headline</p>
              <p style={{ fontSize: '13px', color: s.textColor + '88', marginBottom: '12px', fontFamily: F.sans }}>Body text description here.</p>
              <button style={{ background: s.buttonBg, color: s.buttonText, border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, cursor: 'pointer' }}>
                Button →
              </button>
            </div>
          </div>
        )}

        {/* ── LAYOUT TAB ── */}
        {tab === 'Layout' && (
          <div>
            <div style={row}>
              <div>
                <label style={lbl}>Padding Top (px)</label>
                <input
                  type="number"
                  value={s.paddingTop}
                  onChange={e => update('paddingTop', Number(e.target.value))}
                  min={0} max={200} step={8}
                  style={{ ...sel, marginBottom: 0 }}
                />
              </div>
              <div>
                <label style={lbl}>Padding Bottom (px)</label>
                <input
                  type="number"
                  value={s.paddingBottom}
                  onChange={e => update('paddingBottom', Number(e.target.value))}
                  min={0} max={200} step={8}
                  style={{ ...sel, marginBottom: 0 }}
                />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={lbl}>Item Gap (px) — for grids & lists</label>
              <input
                type="range"
                value={s.itemGap}
                onChange={e => update('itemGap', Number(e.target.value))}
                min={4} max={48} step={4}
                style={{ width: '100%', accentColor: C.gold, marginBottom: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.muted, fontFamily: F.sans }}>
                <span>4px</span>
                <span style={{ color: C.gold, fontWeight: 600 }}>{s.itemGap}px</span>
                <span>48px</span>
              </div>
            </div>

            {/* Spacing preview */}
            <div style={{ marginTop: '16px', padding: '14px', background: C.surface, borderRadius: '10px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spacing Preview</p>
              <div style={{ border: `2px dashed ${C.border}`, borderRadius: '8px', position: 'relative' }}>
                <div style={{ background: `${C.gold}15`, height: `${Math.min(s.paddingTop / 4, 40)}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: C.gold, fontFamily: F.sans }}>{s.paddingTop}px top</span>
                </div>
                <div style={{ background: `${C.blue}15`, margin: '4px', borderRadius: '6px', padding: '12px', display: 'flex', gap: `${Math.min(s.itemGap / 2, 16)}px` }}>
                  {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: '24px', background: C.border, borderRadius: '4px' }} />)}
                </div>
                <div style={{ background: `${C.gold}15`, height: `${Math.min(s.paddingBottom / 4, 40)}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: C.gold, fontFamily: F.sans }}>{s.paddingBottom}px bottom</span>
                </div>
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={() => onChange({ ...DEFAULT_STYLES })}
              style={{ width: '100%', marginTop: '14px', padding: '9px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer' }}
            >
              ↺ Reset to defaults
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
