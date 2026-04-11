import { useState } from 'react'
import logo from '../../assets/AdChasser_Logo.png'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { supabase } from '../../lib/supabase.js'
import { ADMIN_EMAIL } from '../../App.jsx'

const NAV_ITEMS = [
  { id: 'platform',  label: 'Platform',      path: '/app'        },
  { id: 'setup',     label: 'Campaign Setup', path: '/app/setup'  },
  { id: 'insights',  label: 'Insights',       path: null          },
]

export default function AppNav({ user, activeCampaign }) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const isAdmin   = user?.email === ADMIN_EMAIL
  const isActive  = path => path && location.pathname === path

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Account'
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        .anl { padding:6px 12px; border-radius:8px; border:none; font-size:13px; font-family:${F.sans}; cursor:pointer; transition:all 0.15s; white-space:nowrap; text-decoration:none; display:inline-block; }
        .anl:hover { background:rgba(201,168,76,0.08); color:${C.gold}; }
        @media(max-width:768px){.an-desk{display:none!important}.an-mob{display:flex!important}}
        @media(min-width:769px){.an-mob{display:none!important}}
      `}</style>

      <div style={{ position:'sticky', top:0, zIndex:100, background:'rgba(7,9,15,0.96)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}`, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo — always goes home */}
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', flexShrink:0 }}>
            <img src={logo} alt='AdChasser' style={{ width:'28px', height:'28px', objectFit:'contain' }} />
            <span style={{ fontSize:'14px', fontWeight:700, fontFamily:F.sans, color:C.text, letterSpacing:'-0.3px' }}>AdChasser</span>
          </Link>

          {/* Desktop nav */}
          <nav className="an-desk" style={{ display:'flex', gap:'2px' }}>
            {NAV_ITEMS.map(item => {
              if (item.id === 'insights') {
                const active = location.pathname.startsWith('/app/insights')
                return (
                  <span key={item.id} className="anl" style={{ background:active?`rgba(201,168,76,0.1)`:'transparent', color:active?C.gold:C.muted, cursor: activeCampaign ? 'pointer' : 'default', opacity: activeCampaign ? 1 : 0.4 }}
                    onClick={() => activeCampaign && navigate(`/app/insights/${activeCampaign.id}`)}>
                    {item.label}
                  </span>
                )
              }
              const active = isActive(item.path)
              return (
                <Link key={item.id} to={item.path} className="anl" style={{ background:active?`rgba(201,168,76,0.1)`:'transparent', color:active?C.gold:C.muted, fontWeight:active?600:400 }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {/* User menu */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setMenuOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:'7px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'20px', padding:'4px 10px 4px 4px', cursor:'pointer' }}>
              <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:C.bg, fontFamily:F.sans, flexShrink:0, overflow:'hidden' }}>
                {user?.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} style={{ width:'26px', height:'26px', borderRadius:'50%', objectFit:'cover' }} alt="" />
                  : initials}
              </div>
              <span className="an-desk" style={{ fontSize:'13px', color:C.text, fontFamily:F.sans, maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</span>
              <span style={{ color:C.muted, fontSize:'10px' }}>▾</span>
            </button>

            {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:150 }} />}
            {menuOpen && (
              <div style={{ position:'absolute', top:'42px', right:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'8px', minWidth:'200px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:200, animation:'fadeDown 0.15s ease' }}>
                <div style={{ padding:'8px 12px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:'6px' }}>
                  <p style={{ fontSize:'13px', fontWeight:600, fontFamily:F.sans, color:C.text, marginBottom:'2px' }}>{displayName}</p>
                  <p style={{ fontSize:'11px', color:C.muted, fontFamily:F.sans }}>{user?.email}</p>
                  {isAdmin && <span style={{ display:'inline-flex', marginTop:'6px', padding:'2px 8px', borderRadius:'20px', background:C.red+'1A', border:`1px solid ${C.red}35`, color:C.red, fontSize:'10px', fontWeight:600, fontFamily:F.sans }}>Admin</span>}
                </div>
                {isAdmin && (
                  <Link to="/app/admin" onClick={() => setMenuOpen(false)} style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'9px 12px', color:C.red, fontSize:'13px', fontFamily:F.sans, textDecoration:'none', borderRadius:'8px' }}>
                    🛡️ Admin Panel
                  </Link>
                )}
                <button onClick={handleSignOut} style={{ width:'100%', padding:'9px 12px', background:'transparent', border:'none', color:C.muted, fontSize:'13px', fontFamily:F.sans, cursor:'pointer', textAlign:'left', borderRadius:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                  ↩ Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="an-mob" onClick={() => setMobileOpen(o=>!o)} style={{ width:'36px', height:'36px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', cursor:'pointer', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px' }}>
            <div style={{ width:'16px', height:'2px', background:C.text, borderRadius:'1px' }} />
            <div style={{ width:'16px', height:'2px', background:mobileOpen?'transparent':C.text, borderRadius:'1px' }} />
            <div style={{ width:'16px', height:'2px', background:C.text, borderRadius:'1px' }} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position:'fixed', top:'56px', left:0, right:0, bottom:0, zIndex:90, background:'rgba(7,9,15,0.98)', backdropFilter:'blur(20px)', padding:'16px', display:'flex', flexDirection:'column', gap:'4px', animation:'fadeDown 0.2s ease' }}>
          {NAV_ITEMS.map(item => {
            if (item.id === 'insights') return (
              <button key={item.id} onClick={() => { activeCampaign && navigate(`/app/insights/${activeCampaign.id}`); setMobileOpen(false) }} style={{ padding:'14px 16px', borderRadius:'12px', border:`1px solid ${C.border}`, background:'transparent', color: activeCampaign ? C.text : C.dim, fontSize:'15px', fontFamily:F.sans, cursor: activeCampaign ? 'pointer' : 'not-allowed', textAlign:'left' }}>
                {item.label} {!activeCampaign && '(select a campaign first)'}
              </button>
            )
            return (
              <Link key={item.id} to={item.path} onClick={() => setMobileOpen(false)} style={{ padding:'14px 16px', borderRadius:'12px', border:`1px solid ${isActive(item.path)?C.gold+'40':C.border}`, background:isActive(item.path)?`rgba(201,168,76,0.1)`:'transparent', color:isActive(item.path)?C.gold:C.text, fontSize:'15px', fontFamily:F.sans, textDecoration:'none' }}>
                {item.label}
              </Link>
            )
          })}
          <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:'8px' }}>
            {isAdmin && <Link to="/app/admin" onClick={() => setMobileOpen(false)} style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${C.border}`, color:C.red, fontSize:'14px', fontFamily:F.sans, textDecoration:'none' }}>🛡️ Admin Panel</Link>}
            <button onClick={handleSignOut} style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontSize:'14px', fontFamily:F.sans, cursor:'pointer', textAlign:'left' }}>↩ Sign Out</button>
          </div>
        </div>
      )}
    </>
  )
}
