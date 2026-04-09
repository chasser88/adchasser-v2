import { Link } from 'react-router-dom'
import { C, F } from '../../tokens.js'

const LINKS = {
  Product: [
    { label: 'Features',    path: '/product'      },
    { label: 'How It Works',path: '/how-it-works'  },
    { label: 'Pricing',     path: '/pricing'       },
  ],
  Company: [
    { label: 'About',       path: '/about'         },
    { label: 'Contact',     path: '/about#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
  ],
}

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: 'clamp(40px, 6vw, 64px) 5% clamp(24px, 4vw, 40px)', fontFamily: F.sans }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.bg }}>A</div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>AdChasser</span>
            </Link>
            <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7, maxWidth: '200px' }}>
              Brand campaign intelligence. Separating reach from creative quality.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: C.text, letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>{section}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <Link key={item.label} to={item.path} style={{ fontSize: '13px', color: C.muted, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = C.text}
                    onMouseLeave={e => e.target.style.color = C.muted}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: C.muted }}>© {new Date().getFullYear()} AdChasser. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: C.dim }}>Built for brand intelligence.</p>
        </div>
      </div>
    </footer>
  )
}
