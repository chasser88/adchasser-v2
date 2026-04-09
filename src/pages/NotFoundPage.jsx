import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import SiteNav from '../components/layout/SiteNav.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteNav />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '40px' }}>
        <p style={{ fontSize: '80px', marginBottom: '16px' }}>404</p>
        <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontFamily: F.display, fontWeight: 700, marginBottom: '14px', color: C.text }}>Page not found</h1>
        <p style={{ fontSize: '16px', color: C.muted, fontFamily: F.sans, marginBottom: '32px' }}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/')} style={{ padding: '12px 24px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>Go Home</button>
          <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, cursor: 'pointer' }}>← Go Back</button>
        </div>
      </div>
    </div>
  )
}
