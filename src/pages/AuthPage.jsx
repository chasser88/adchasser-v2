import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { C, F } from '../tokens.js'
import AuthForm from '../components/auth/AuthPage.jsx'

export default function AuthPage({ onAuth }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSignup = searchParams.get('signup') === 'true'

  const handleAuth = (user) => {
    onAuth(user)
    navigate('/app')
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Back to home link */}
      <div style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 10 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>
          ← Home
        </button>
      </div>
      <AuthForm onAuth={handleAuth} defaultMode={isSignup ? 'signup' : 'signin'} />
    </div>
  )
}
