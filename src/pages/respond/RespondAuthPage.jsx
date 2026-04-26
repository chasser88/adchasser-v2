import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import { supabase } from '../../lib/supabase.js'
import logo from '../../assets/AdChasser_Logo.png'

export default function RespondAuthPage({ onAuth }) {
  const navigate   = useNavigate()
  const [mode,     setMode]     = useState('login') // login | register
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [phase,    setPhase]    = useState('form') // form | verify_email

  const inp = {
    width: '100%', padding: '12px 14px', background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text,
    fontSize: '14px', fontFamily: F.sans, outline: 'none',
    boxSizing: 'border-box', marginBottom: '12px',
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name')
        if (!email.trim()) throw new Error('Please enter your email address')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/panel/auth/callback`,
          }
        })
        if (signUpErr) throw signUpErr

        // Always show the verify email screen after registration
        // Whether email confirmation is required or not
        setPhase('verify_email')

      } else {
        // Sign in
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
        onAuth?.(data.user)

        // Check respondent profile and route accordingly
        const { data: respondent } = await supabase
          .from('respondents')
          .select('id, onboarding_done')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!respondent) {
          // Create profile and go to onboarding
          await supabase.from('respondents').insert({
            user_id:   data.user.id,
            email:     data.user.email,
            full_name: data.user.user_metadata?.full_name ?? '',
          })
          navigate('/panel/onboarding')
        } else if (!respondent.onboarding_done) {
          navigate('/panel/onboarding')
        } else {
          navigate('/panel/dashboard')
        }
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/panel/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    })
    if (error) setError(error.message)
    else setError(null), setPhase('verify_email')
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError(error.message)
    else setError(null)
    setLoading(false)
  }

  // ── VERIFY EMAIL SCREEN ───────────────────────────────────────
  if (phase === 'verify_email') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: F.sans }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>

        <img src={logo} alt="AdChasser" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '20px' }} />

        {/* Animated email icon */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: C.goldDim, border: `2px solid ${C.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '36px' }}>
          📧
        </div>

        <h2 style={{ fontSize: '22px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>Check your email</h2>
        <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7, marginBottom: '8px' }}>
          We sent a confirmation link to:
        </p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: C.gold, marginBottom: '24px', fontFamily: F.sans }}>
          {email}
        </p>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '12px', fontFamily: F.sans }}>What to do next:</p>
          {[
            { n: '1', text: 'Open your email inbox' },
            { n: '2', text: 'Find the email from AdChasser' },
            { n: '3', text: 'Click the "Confirm your email" link' },
            { n: '4', text: 'You\'ll be taken straight to your profile setup' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: C.goldDim, border: `1px solid ${C.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: C.gold, flexShrink: 0 }}>{s.n}</div>
              <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', color: '#ef4444' }}>{error}</div>
        )}

        <p style={{ fontSize: '13px', color: C.muted, marginBottom: '12px' }}>
          Didn't receive the email?{' '}
          <button onClick={handleResend} disabled={loading} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: F.sans, fontWeight: 600 }}>
            {loading ? 'Sending…' : 'Resend email'}
          </button>
        </p>

        <p style={{ fontSize: '12px', color: C.dim }}>
          Also check your spam folder. The email is from <span style={{ color: C.muted }}>noreply@adchasser.com</span>
        </p>

        <button onClick={() => { setPhase('form'); setMode('login') }} style={{ marginTop: '20px', fontSize: '12px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans }}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  )

  // ── AUTH FORM ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: F.sans }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logo} alt="AdChasser" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '22px', fontFamily: F.display, fontWeight: 700, marginBottom: '4px' }}>AdChasser Panel</h1>
          <p style={{ fontSize: '13px', color: C.muted }}>
            {mode === 'register' ? 'Create your free account' : 'Sign in to your panel account'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px' }}>

          {/* Mode tabs */}
          <div style={{ display: 'flex', background: C.surface, borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {[{ key: 'login', label: 'Sign In' }, { key: 'register', label: 'Register' }].map(t => (
              <button key={t.key} onClick={() => { setMode(t.key); setError(null) }} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: mode === t.key ? C.card : 'transparent', color: mode === t.key ? C.text : C.muted, fontSize: '13px', fontWeight: mode === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', color: '#ef4444' }}>{error}</div>
          )}

          {mode === 'register' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={inp} />
          )}

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            style={inp}
          />

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ ...inp, marginBottom: mode === 'login' ? '6px' : '16px' }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button onClick={handleForgot} style={{ fontSize: '12px', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.sans }}>
                Forgot password?
              </button>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '12px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: '12px' }}>
            {loading ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span style={{ fontSize: '11px', color: C.dim }}>or</span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.9-5.9C34.2 6.4 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.8 5C14.9 16.5 19 13.9 24 14c3 0 5.7 1.1 7.8 2.9l5.9-5.9C34.2 6.4 29.4 4 24 4 16.2 4 9.5 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.3 35.6 26.8 36.3 24 36.3c-5.2 0-9.6-3.5-11.2-8.3l-6.8 5.2C9.3 39.5 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.4 5.6l6.2 5.2C40.7 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: C.dim, marginTop: '16px', lineHeight: 1.6 }}>
          By registering you agree to our Terms of Service.<br />
          One account per person. Fraudulent accounts will be banned.
        </p>

        <p style={{ textAlign: 'center', fontSize: '12px', color: C.muted, marginTop: '12px' }}>
          Are you a brand manager?{' '}
          <button onClick={() => navigate('/auth')} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: F.sans }}>
            Sign in here →
          </button>
        </p>
      </div>
    </div>
  )
}
