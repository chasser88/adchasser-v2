import { C, F } from '../../tokens.js'

// ── Global responsive styles (inject once) ────────────────────────
export const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  .bp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .bp-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .bp-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  .bp-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .bp-flex-wrap { display: flex; flex-wrap: wrap; gap: 10px; }
  @media (max-width: 768px) {
    .bp-grid-2 { grid-template-columns: 1fr 1fr; }
    .bp-grid-3 { grid-template-columns: 1fr 1fr; }
    .bp-grid-4 { grid-template-columns: 1fr 1fr; }
    .bp-grid-2col { grid-template-columns: 1fr; }
    .bp-hide-mobile { display: none !important; }
    .bp-full-mobile { width: 100% !important; }
    .bp-stack-mobile { flex-direction: column !important; }
    .bp-pad-mobile { padding: 20px 16px !important; }
    .bp-text-sm-mobile { font-size: 13px !important; }
  }
  @media (max-width: 480px) {
    .bp-grid-2 { grid-template-columns: 1fr; }
    .bp-grid-3 { grid-template-columns: 1fr; }
    .bp-grid-4 { grid-template-columns: 1fr 1fr; }
  }
`

// ── Badge ──────────────────────────────────────────────────────────
export const Badge = ({ children, color = C.gold, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 9px', borderRadius: '20px',
    background: color + '1A', border: `1px solid ${color}35`,
    color, fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px',
    fontFamily: F.sans, whiteSpace: 'nowrap', ...style,
  }}>{children}</span>
)

// ── Card ───────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick, className = '' }) => (
  <div className={className} onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '16px', padding: '24px',
    cursor: onClick ? 'pointer' : undefined,
    transition: onClick ? 'border-color 0.2s, background 0.2s' : undefined,
    ...style,
  }}>{children}</div>
)

// ── GoldButton ────────────────────────────────────────────────────
export const GoldButton = ({ children, onClick, disabled, style = {}, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? '9px 18px' : '12px 24px',
    background: disabled ? C.dim : `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
    border: 'none', borderRadius: '10px',
    color: disabled ? C.muted : C.bg,
    fontSize: small ? '13px' : '14px', fontWeight: 700,
    fontFamily: F.sans, cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.3px', transition: 'all 0.2s',
    opacity: disabled ? 0.55 : 1, whiteSpace: 'nowrap',
    ...style,
  }}>{children}</button>
)

// ── GhostButton ───────────────────────────────────────────────────
export const GhostButton = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    padding: '11px 18px', background: 'transparent',
    border: `1px solid ${C.border}`, borderRadius: '10px',
    color: C.muted, fontSize: '14px', fontFamily: F.sans,
    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
    ...style,
  }}>{children}</button>
)

// ── IconButton ────────────────────────────────────────────────────
export const IconButton = ({ icon, onClick, color = C.muted, style = {} }) => (
  <button onClick={onClick} style={{
    width: '36px', height: '36px', borderRadius: '8px',
    background: 'transparent', border: `1px solid ${C.border}`,
    color, fontSize: '16px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', fontFamily: F.sans, flexShrink: 0,
    ...style,
  }}>{icon}</button>
)

// ── Spinner ───────────────────────────────────────────────────────
export const Spinner = ({ size = 24, color = C.gold }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid ${color}30`, borderTopColor: color,
    animation: 'spin 0.8s linear infinite', flexShrink: 0,
  }} />
)

// ── ProgressBar ───────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = C.gold, height = 4, style = {} }) => (
  <div style={{ height, background: C.border, borderRadius: height / 2, overflow: 'hidden', ...style }}>
    <div style={{
      height: '100%', width: `${Math.min((value / max) * 100, 100)}%`,
      background: color, borderRadius: height / 2,
      transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
    }} />
  </div>
)

// ── ScoreRing ─────────────────────────────────────────────────────
export const ScoreRing = ({ score, size = 80, color = C.gold, label }) => {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
          fill={C.text} fontSize={size * 0.22} fontWeight="700" fontFamily={F.sans}
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
          {Math.round(score)}
        </text>
      </svg>
      {label && <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, letterSpacing: '0.5px', textAlign: 'center' }}>{label}</span>}
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────
export const SectionDivider = ({ label, color = C.gold }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 18px' }}>
    <div style={{ height: '1px', flex: 1, background: C.border }} />
    <span style={{ fontSize: '10px', fontWeight: 600, fontFamily: F.sans, color, letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ height: '1px', flex: 1, background: C.border }} />
  </div>
)

// ── Eyebrow ────────────────────────────────────────────────────────
export const Eyebrow = ({ children, color = C.gold, style = {} }) => (
  <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color, fontFamily: F.sans, fontWeight: 600, ...style }}>{children}</p>
)

// ── EmptyState ────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, body, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
    <div style={{ fontSize: '44px', marginBottom: '14px' }}>{icon}</div>
    <h3 style={{ fontSize: '18px', fontFamily: F.sans, fontWeight: 600, color: C.text, marginBottom: '8px' }}>{title}</h3>
    <p style={{ fontSize: '14px', fontFamily: F.sans, color: C.muted, lineHeight: 1.7, maxWidth: '320px', marginBottom: '22px' }}>{body}</p>
    {action}
  </div>
)

// ── Toast ─────────────────────────────────────────────────────────
export const Toast = ({ message, type = 'success', onClose }) => {
  const colors = { success: C.green, error: C.red, info: C.blue, warning: C.gold }
  return (
    <div style={{
      position: 'fixed', bottom: '16px', right: '16px', left: '16px',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 18px', borderRadius: '12px',
      background: C.card, border: `1px solid ${colors[type]}40`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
      animation: 'fadeUp 0.3s ease', fontFamily: F.sans,
      maxWidth: '480px', margin: '0 auto',
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[type], flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: C.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
    </div>
  )
}

// ── ChartTooltip ──────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', fontFamily: F.sans }}>
      {label && <p style={{ fontSize: '11px', color: C.muted, marginBottom: '6px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '13px', color: p.color || C.text, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? Math.round(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}
