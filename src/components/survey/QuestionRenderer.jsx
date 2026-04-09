import { C, F } from '../../tokens.js'

const opt = (label, value, selected, onSelect, isMulti) => (
  <button key={value} onClick={() => onSelect(value)} style={{
    padding: '11px 14px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
    border: `1px solid ${selected ? C.gold : C.border}`,
    background: selected ? C.goldDim : 'transparent',
    color: selected ? C.gold : C.text,
    fontSize: '14px', fontFamily: F.sans, transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', gap: '10px',
  }}>
    <div style={{ width: '15px', height: '15px', flexShrink: 0, borderRadius: isMulti ? '4px' : '50%', border: `2px solid ${selected ? C.gold : C.dim}`, background: selected ? C.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: C.bg, transition: 'all 0.15s' }}>
      {selected ? '✓' : ''}
    </div>
    {label}
  </button>
)

export default function QuestionRenderer({ q, answers, setAnswers }) {
  const ans = answers[q.id]
  const set = v => setAnswers(a => ({ ...a, [q.id]: v }))

  // Single select
  if (q.type === 'single') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {q.options.map(o => opt(o, o, ans === o, () => set(o), false))}
    </div>
  )

  // Multi select
  if (q.type === 'multi') {
    const cur = ans ?? []
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {q.options.map(o => opt(o, o, cur.includes(o), () => {
            if (cur.includes(o)) set(cur.filter(v => v !== o))
            else if (!q.max || cur.length < q.max) set([...cur, o])
          }, true))}
        </div>
        {q.max && <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginTop: '8px' }}>{cur.length}/{q.max} selected</p>}
      </div>
    )
  }

  // Open text
  if (q.type === 'open') return (
    <textarea value={ans ?? ''} onChange={e => set(e.target.value)} placeholder={q.placeholder} rows={4}
      style={{ width: '100%', padding: '13px 15px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', lineHeight: 1.65 }} />
  )

  // 1–10 scale
  if (q.type === 'scale') {
    const val = ans ?? 0
    return (
      <div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {[...Array(10)].map((_, i) => {
            const n = i + 1; const sel = n === val
            return (
              <button key={n} onClick={() => set(n)} style={{
                width: '44px', height: '44px', borderRadius: '10px',
                border: `1px solid ${sel ? C.gold : C.border}`,
                background: sel ? `linear-gradient(135deg, ${C.gold}35, ${C.gold}18)` : 'transparent',
                color: sel ? C.gold : C.muted,
                fontSize: '15px', fontWeight: sel ? 700 : 400,
                fontFamily: F.sans, cursor: 'pointer', transition: 'all 0.14s',
              }}>{n}</button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.dim, fontFamily: F.sans }}>
          <span>{q.minLabel}</span><span>{q.maxLabel}</span>
        </div>
      </div>
    )
  }

  // Yes / No + optional open text
  if (q.type === 'yes_no_open') {
    const showFollow = ans?.answer === 'Yes'
    return (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {['Yes', 'No'].map(v => {
            const sel = ans?.answer === v
            return (
              <button key={v} onClick={() => set({ answer: v, detail: '' })} style={{
                padding: '11px 28px', borderRadius: '10px', cursor: 'pointer',
                border: `1px solid ${sel ? C.gold : C.border}`,
                background: sel ? C.goldDim : 'transparent',
                color: sel ? C.gold : C.text, fontSize: '14px', fontFamily: F.sans, transition: 'all 0.18s',
              }}>{v}</button>
            )
          })}
        </div>
        {showFollow && (
          <textarea value={ans?.detail ?? ''} onChange={e => set({ ...ans, detail: e.target.value })}
            placeholder={q.followUpPlaceholder} rows={3}
            style={{ width: '100%', padding: '12px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none' }} />
        )}
      </div>
    )
  }

  // Emotion wheel
  if (q.type === 'emotion_wheel') {
    const selected = ans ?? []
    return (
      <div>
        {q.clusters.map(cluster => (
          <div key={cluster.name} style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, fontFamily: F.sans, color: cluster.color, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>{cluster.name}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {cluster.emotions.map(e => {
                const sel = selected.includes(e)
                return (
                  <button key={e} onClick={() => {
                    if (sel) set(selected.filter(s => s !== e))
                    else if (selected.length < q.max) set([...selected, e])
                  }} style={{
                    padding: '7px 15px', borderRadius: '20px', cursor: 'pointer',
                    border: `1px solid ${sel ? cluster.color : C.border}`,
                    background: sel ? cluster.color + '22' : 'transparent',
                    color: sel ? cluster.color : C.text,
                    fontSize: '13px', fontFamily: F.sans, transition: 'all 0.15s',
                  }}>{e}</button>
                )
              })}
            </div>
          </div>
        ))}
        <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginTop: '6px' }}>{(ans ?? []).length}/{q.max} selected</p>
      </div>
    )
  }

  // Semantic differential
  if (q.type === 'semantic_diff') {
    const vals = ans ?? {}
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {q.pairs.map(([left, right]) => {
          const v = vals[left] ?? 4
          return (
            <div key={left}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', fontSize: '13px', fontFamily: F.sans }}>
                <span style={{ color: v <= 2 ? C.gold : C.muted }}>{left}</span>
                <span style={{ color: v >= 6 ? C.gold : C.muted }}>{right}</span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[1,2,3,4,5,6,7].map(n => (
                  <button key={n} onClick={() => set({ ...vals, [left]: n })} style={{
                    flex: 1, height: '30px', borderRadius: '6px', cursor: 'pointer',
                    border: `1px solid ${v === n ? C.gold : C.border}`,
                    background: v === n ? C.goldDim : 'transparent',
                    transition: 'all 0.12s',
                  }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Rank (drag to order)
  if (q.type === 'rank') {
    const ranked    = ans ?? []
    const remaining = q.options.filter(o => !ranked.includes(o))
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Priority Order</p>
          {ranked.length === 0
            ? <p style={{ fontSize: '13px', color: C.dim, fontFamily: F.sans, fontStyle: 'italic', padding: '12px 0' }}>Tap items on the right →</p>
            : ranked.map((o, i) => (
              <div key={o} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: C.goldDim, border: `1px solid ${C.gold}28`, borderRadius: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.gold, fontFamily: F.sans, width: '20px' }}>#{i+1}</span>
                <span style={{ fontSize: '13px', fontFamily: F.sans, flex: 1, lineHeight: 1.4 }}>{o}</span>
                <button onClick={() => set(ranked.filter(r => r !== o))} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            ))
          }
        </div>
        <div>
          <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Options</p>
          {remaining.map(o => (
            <button key={o} onClick={() => set([...ranked, o])} style={{
              display: 'block', width: '100%', padding: '9px 12px', textAlign: 'left',
              border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '6px',
              background: 'transparent', color: C.text, fontSize: '13px',
              fontFamily: F.sans, cursor: 'pointer', lineHeight: 1.4,
            }}>{o}</button>
          ))}
        </div>
      </div>
    )
  }

  return null
}
