import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import logo from '../assets/AdChasser_Logo.png'

export default function AuthCallback({ redirectTo }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const handleRedirect = async (session) => {
          if (!session) { navigate('/auth', { replace: true }); return }

          // If explicit redirectTo prop passed — use it
          if (redirectTo) { navigate(redirectTo, { replace: true }); return }

          // If coming from /respond/auth/callback — check respondent profile
          const isRespondCallback = location.pathname.includes('/respond/')
          if (isRespondCallback) {
            const { data: respondent } = await supabase
              .from('respondents')
              .select('id, onboarding_done')
              .eq('user_id', session.user.id)
              .maybeSingle()

            if (!respondent) {
              // New respondent — create profile and send to onboarding
              await supabase.from('respondents').insert({
                user_id:   session.user.id,
                email:     session.user.email,
                full_name: session.user.user_metadata?.full_name ?? '',
              })
              navigate('/respond/onboarding', { replace: true })
            } else if (!respondent.onboarding_done) {
              navigate('/respond/onboarding', { replace: true })
            } else {
              navigate('/respond/dashboard', { replace: true })
            }
            return
          }

          // Default — brand manager
          navigate('/app', { replace: true })
        }

        if (data?.session) {
          await handleRedirect(data.session)
          return
        }

        // No session yet — listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            await handleRedirect(session)
          }
          if (event === 'SIGNED_OUT') {
            subscription.unsubscribe()
            navigate('/auth', { replace: true })
          }
        })

        setTimeout(() => {
          subscription.unsubscribe()
          setError('Sign in timed out. Please try again.')
        }, 10000)
      } catch (err) {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    }
    handleCallback()
  }, [navigate, location.pathname, redirectTo])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07090F', gap: '20px', padding: '20px' }}>
      <img src={logo} alt="AdChasser" style={{ width: '60px', height: '60px', objectFit: 'contain', opacity: 0.5 }} />
      <p style={{ fontSize: '15px', color: '#ef4444', fontFamily: 'system-ui', textAlign: 'center' }}>{error}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate('/auth')} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #C9A84C', borderRadius: '8px', color: '#C9A84C', fontSize: '14px', fontFamily: 'system-ui', cursor: 'pointer' }}>
          Brand Manager Sign In
        </button>
        <button onClick={() => navigate('/respond/auth')} style={{ padding: '10px 24px', background: '#C9A84C', border: 'none', borderRadius: '8px', color: '#07090F', fontSize: '14px', fontFamily: 'system-ui', fontWeight: 600, cursor: 'pointer' }}>
          Panel Sign In
        </button>
      </div>
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
