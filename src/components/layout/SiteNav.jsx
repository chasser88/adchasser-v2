import logo from "../../assets/AdChasser_Logo.png"
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'

const NAV_LINKS = [
  { label: 'Product',      path: '/product'     },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Pricing',      path: '/pricing'      },
  { label: 'About',        path: '/about'        },
]

export default function SiteNav({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = path => location.pathname === path

  return (
    <>
      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        .snl { font-size:14px; color:${C.muted}; text-decoration:none; padding:6px 12px; border-radius:8px; transition:color 0.2s; font-family:${F.sans}; }
        .snl:hover { color:${C.text}; }
        .snl.active { color:${C.gold}; }
        @media(max-width:768px){.sn-desk{display:none!important}.sn-mob{display:flex!important}}
        @media(min-width:769px){.sn-mob{display:none!important}}
      `}</style>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(7,9,15,0.96)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}`, padding:'0 5%', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'9px', textDecoration:'none' }}>
          <img src={logo} alt="AdChasser" style={{ width:"30px", height:"30px", objectFit:"contain" }} />
          <span style={{ fontSize:'16px', fontWeight:700, fontFamily:F.sans, color:C.text, letterSpacing:'-0.3px' }}>AdChasser</span>
        </Link>
        <div className="sn-desk" style={{ display:'flex', gap:'4px', position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
          {NAV_LINKS.map(l => <Link key={l.path} to={l.path} className={`snl${isActive(l.path)?' active':''}`}>{l.label}</Link>)}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {user
            ? <button onClick={() => navigate('/app')} style={{ padding:'9px 18px', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', borderRadius:'9px', color:C.bg, fontSize:'13px', fontWeight:700, fontFamily:F.sans, cursor:'pointer' }}>Dashboard →</button>
            : <>
                <Link to="/auth" className="snl sn-desk">Sign In</Link>
                <Link to="/auth?signup=true" style={{ padding:'9px 18px', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, border:'none', borderRadius:'9px', color:C.bg, fontSize:'13px', fontWeight:700, fontFamily:F.sans, cursor:'pointer', textDecoration:'none' }}>Get Started</Link>
              </>
          }
          <button className="sn-mob" onClick={() => setMobileOpen(o=>!o)} style={{ width:'36px', height:'36px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', cursor:'pointer', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px' }}>
            <div style={{ width:'16px', height:'2px', background:C.text, borderRadius:'1px' }} />
            <div style={{ width:'16px', height:'2px', background:mobileOpen?'transparent':C.text, borderRadius:'1px' }} />
            <div style={{ width:'16px', height:'2px', background:C.text, borderRadius:'1px' }} />
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div style={{ position:'fixed', top:'60px', left:0, right:0, background:'rgba(7,9,15,0.98)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}`, padding:'16px 5%', zIndex:99, animation:'fadeDown 0.2s ease' }}>
          {NAV_LINKS.map(l => <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)} style={{ display:'block', padding:'13px 0', fontSize:'15px', color:isActive(l.path)?C.gold:C.text, textDecoration:'none', borderBottom:`1px solid ${C.border}`, fontFamily:F.sans }}>{l.label}</Link>)}
          <div style={{ paddingTop:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {user
              ? <Link to="/app" onClick={() => setMobileOpen(false)} style={{ padding:'12px', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, borderRadius:'10px', color:C.bg, fontSize:'14px', fontWeight:700, fontFamily:F.sans, textDecoration:'none', textAlign:'center' }}>Go to Dashboard →</Link>
              : <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)} style={{ padding:'12px', border:`1px solid ${C.border}`, borderRadius:'10px', color:C.text, fontSize:'14px', fontFamily:F.sans, textDecoration:'none', textAlign:'center' }}>Sign In</Link>
                  <Link to="/auth?signup=true" onClick={() => setMobileOpen(false)} style={{ padding:'12px', background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, borderRadius:'10px', color:C.bg, fontSize:'14px', fontWeight:700, fontFamily:F.sans, textDecoration:'none', textAlign:'center' }}>Get Started Free</Link>
                </>
            }
          </div>
        </div>
      )}
    </>
  )
}
