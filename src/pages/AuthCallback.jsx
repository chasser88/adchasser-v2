import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import logo from '../assets/AdChasser_Logo.png'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback - exchange code for session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (data?.session) {
          navigate('/app', { replace: true })
          return
        }

        // If no session yet, listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            navigate('/app', { replace: true })
          }
          if (event === 'SIGNED_OUT') {
            subscription.unsubscribe()
            navigate('/auth', { replace: true })
          }
        })

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe()
          setError('Sign in timed out. Please try again.')
        }, 10000)

      } catch (err) {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07090F', gap: '20px', padding: '20px' }}>
      <img src={logo} alt="AdChasser" style={{ width: '60px', height: '60px', objectFit: 'contain', opacity: 0.5 }} />
      <p style={{ fontSize: '15px', color: '#ef4444', fontFamily: 'system-ui', textAlign: 'center' }}>{error}</p>
      <button onClick={() => navigate('/auth')} style={{ padding: '10px 24px', background: '#C9A84C', border: 'none', borderRadius: '8px', color: '#07090F', fontSize: '14px', fontFamily: 'system-ui', fontWeight: 600, cursor: 'pointer' }}>
        Back to Sign In
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07090F', gap: '20px' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.92)}50%{opacity:1;transform:scale(1.05)}}`}</style>
      <img src={logo} alt="AdChasser" style={{ width: '72px', height: '72px', objectFit: 'contain', animation: 'pulse 1.8s ease-in-out infinite' }} />
      <p style={{ fontSize: '11px', color: '#5a5a6e', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'system-ui' }}>Signing you in...</p>
    </div>
  )
}
