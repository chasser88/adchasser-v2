import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { supabase } from '../../lib/supabase.js'
import logo from '../../assets/AdChasser_Logo.png'

export default function RespondNav({ respondent, earnings, user }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const path       = location.pathname
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef    = useRef()

  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/panel')
  }

  const navItems = [
    { label: 'Home',    path: '/panel/dashboard', icon: '🏠' },
    { label: 'Surveys', path: '/panel/dashboard', icon: '📋' },
    { label: 'Wallet',  path: '/panel/wallet',    icon: '💳' },
    { label: 'Profile', path: '/panel/profile',   icon: '👤' },
  ]

  const available = earnings?.available_balance ?? 0
  const progress  = Math.min(100, (available / 10000) * 100)
  const initials  = (respondent?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  return (
    <>
      <style>{`
        .panel-desktop-items { display: flex; }
        .panel-wallet-pill   { display: flex; }
        .panel-bottom-nav    { display: none; }
        .panel-content-pad   { padding-bottom: 0; }
        @media (max-width: 640px) {
          .panel-desktop-items { display: none !important; }
          .panel-wallet-pill   { display: none !important; }
          .panel-bottom-nav    { display: flex !important; }
          .panel-content-pad   { padding-bottom: 80px !important; }
          .panel-topnav        { padding: 0 16px !important; }
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav className="panel-topnav" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px', position: 'sticky', top: 0, zIndex: 100 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/panel/dashboard')}>
          <img src={logo} alt="AdChasser" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: F.display, color: C.text, margin: 0, lineHeight: 1 }}>AdChasser</p>
            <p style={{ fontSize: '9px', color: C.gold, fontFamily: F.sans, margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Panel</p>
          </div>
        </div>

        {/* Desktop nav items */}
        <div className="panel-desktop-items" style={{ gap: '4px' }}>
          {navItems.map(item => {
            const active = path === item.path
            return (
              <button key={item.label} onClick={() => navigate(item.path)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: active ? C.goldDim : 'transparent', color: active ? C.gold : C.muted, fontSize: '13px', fontFamily: F.sans, fontWeight: active ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Wallet pill — desktop only */}
          <div className="panel-wallet-pill" onClick={() => navigate('/panel/wallet')} style={{ alignItems: 'center', gap: '8px', padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', cursor: 'pointer' }}>
            <div style={{ width: '50px', height: '5px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '3px' }} />
            </div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: C.gold, fontFamily: F.sans, margin: 0 }}>₦{available.toLocaleString()}</p>
          </div>

          {/* Avatar + dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ width: '34px', height: '34px', borderRadius: '50%', border: `2px solid ${menuOpen ? C.gold : C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, flexShrink: 0 }}>
              {respondent?.avatar_url
                ? <img src={respondent.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold, fontFamily: F.sans }}>{initials}</span>
              }
            </button>

            {menuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '210px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F.sans }}>{respondent?.full_name || 'Respondent'}</p>
                  <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F.sans }}>{user?.email}</p>
                </div>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>Balance</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold, fontFamily: F.display }}>₦{available.toLocaleString()}</span>
                </div>
                {navItems.map(item => (
                  <button key={item.label} onClick={() => { navigate(item.path); setMenuOpen(false) }}
                    style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {item.icon} {item.label}
                  </button>
                ))}
                <button onClick={handleSignOut}
                  style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="panel-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: C.card, borderTop: `1px solid ${C.border}`,
        height: '64px', alignItems: 'stretch', justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.map(item => {
          const isActive = path === item.path
          return (
            <button key={item.label} onClick={() => navigate(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', position: 'relative' }}>
              {isActive && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '28px', height: '2px', background: C.gold, borderRadius: '0 0 2px 2px' }} />}
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontFamily: F.sans, fontWeight: isActive ? 600 : 400, color: isActive ? C.gold : C.muted }}>{item.label}</span>
            </button>
          )
        })}
        <button onClick={handleSignOut} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🚪</span>
          <span style={{ fontSize: '10px', fontFamily: F.sans, color: C.muted }}>Sign Out</span>
        </button>
      </nav>
    </>
  )
}
