import { useNavigate, useLocation } from 'react-router-dom'
import { C, F } from '../../tokens.js'

// Maps each path to where back should go
const BACK_MAP = {
  '/app/setup':   '/app',
  '/app/admin':   '/app',
}

export default function BackButton({ style = {} }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine back destination
  const getBackPath = () => {
    // Insights page — go back to platform
    if (location.pathname.startsWith('/app/insights')) return '/app'
    // Explicit map
    if (BACK_MAP[location.pathname]) return BACK_MAP[location.pathname]
    // Sub-pages of public site — go home
    if (['/product', '/how-it-works', '/pricing', '/about'].includes(location.pathname)) return '/'
    return null
  }

  const backPath = getBackPath()
  if (!backPath) return null

  return (
    <button
      onClick={() => navigate(backPath)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'transparent', border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '7px 12px',
        color: C.muted, fontSize: '13px', fontFamily: F.sans,
        cursor: 'pointer', transition: 'all 0.15s',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.borderLight }}
      onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
    >
      ← Back
    </button>
  )
}
