import { useNavigate, useLocation } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { supabase } from '../../lib/supabase.js'
import logo from '../../assets/AdChasser_Logo.png'

const REWARD = 1000

export default function RespondNav({ respondent, earnings, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path     = location.pathname

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/respond')
  }

  const navItems = [
    { label: 'Surveys',  path: '/respond/dashboard', icon: '📋' },
    { label: 'Wallet',   path: '/respond/wallet',    icon: '💳' },
    { label: 'Profile',  path: '/respond/profile',   icon: '👤' },
  ]

  const available = earnings?.available_balance ?? 0
  const progress  = Math.min(100, (available / 10000) * 100)

  return (
    <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/respond/dashboard')}>
        <img src={logo} alt="AdChasser" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: F.display, color: C.text, margin: 0, lineHeight: 1 }}>AdChasser</p>
          <p style={{ fontSize: '9px', color: C.gold, fontFamily: F.sans, margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Panel</p>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: path === item.path ? C.goldDim : 'transparent', color: path === item.path ? C.gold : C.muted, fontSize: '13px', fontFamily: F.sans, fontWeight: path === item.path ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Wallet + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Withdrawal progress pill */}
        <div onClick={() => navigate('/respond/wallet')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', cursor: 'pointer' }}>
          <div style={{ width: '60px', height: '5px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '3px' }} />
          </div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: C.gold, fontFamily: F.sans, margin: 0 }}>
            ₦{available.toLocaleString()}
          </p>
        </div>

        {/* Avatar */}
        <button onClick={handleSignOut} title="Sign out" style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0 }}>
          {respondent?.avatar_url
            ? <img src={respondent.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '13px', fontWeight: 700, color: C.gold, fontFamily: F.sans }}>
                {respondent?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
          }
        </button>
      </div>
    </nav>
  )
}
