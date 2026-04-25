import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { supabase } from '../../lib/supabase.js'
import logo from '../../assets/AdChasser_Logo.png'

export default function RespondNav({ respondent, earnings, user }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const path      = location.pathname
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef   = useRef()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/respond')
  }

  const navItems = [
    { label: 'Home',    path: '/respond/dashboard', icon: '🏠' },
    { label: 'Surveys', path: '/respond/dashboard', icon: '📋' },
    { label: 'Wallet',  path: '/respond/wallet',    icon: '💳' },
    { label: 'Profile', path: '/respond/profile',   icon: '👤' },
  ]

  const available = earnings?.available_balance ?? 0
  const progress  = Math.min(100, (available / 10000) * 100)
  const initials  = (respondent?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  return (
    <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Logo — always goes to respondent dashboard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/respond/dashboard')}>
        <img src={logo} alt="AdChasser" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: F.display, color: C.text, margin: 0, lineHeight: 1 }}>AdChasser</p>
          <p style={{ fontSize: '9px', color: C.gold, fontFamily: F.sans, margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Panel</p>
        </div>
      </div>

      {/* Nav items — all within /respond/* only */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(item => {
          const active = path === item.path
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: active ? C.goldDim : 'transparent',
                color: active ? C.gold : C.muted,
                fontSize: '13px', fontFamily: F.sans,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Right side: wallet balance + avatar dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Wallet progress pill */}
        <div
          onClick={() => navigate('/respond/wallet')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', cursor: 'pointer' }}
        >
          <div style={{ width: '60px', height: '5px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '3px' }} />
          </div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: C.gold, fontFamily: F.sans, margin: 0 }}>
            ₦{available.toLocaleString()}
          </p>
        </div>

        {/* Avatar with dropdown — NOT a direct sign-out button */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ width: '34px', height: '34px', borderRadius: '50%', border: `2px solid ${menuOpen ? C.gold : C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0, transition: 'border-color 0.2s' }}
          >
            {respondent?.avatar_url
              ? <img src={respondent.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold, fontFamily: F.sans }}>{initials}</span>
            }
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 200 }}>

              {/* User info */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {respondent?.full_name || 'Respondent'}
                </p>
                <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>

              {/* Menu links — all within /respond/* */}
              {[
                { label: '🏠 Dashboard',  path: '/respond/dashboard' },
                { label: '📋 Surveys',    path: '/respond/dashboard' },
                { label: '💳 Wallet',     path: '/respond/wallet'    },
                { label: '👤 My Profile', path: '/respond/profile'   },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMenuOpen(false) }}
                  style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </button>
              ))}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
