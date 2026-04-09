import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../tokens.js'

const Input = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '12px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }} />
  </div>
)

const Btn = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '12px', background: disabled ? C.dim : `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: disabled ? C.muted : C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{children}</button>
)

const GoogleBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{ width: '100%', padding: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
    {label}
  </button>
)

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
    <div style={{ flex: 1, height: '1px', background: C.border }} />
    <span style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>or</span>
    <div style={{ flex: 1, height: '1px', background: C.border }} />
  </div>
)

const Spin = () => <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${C.bg}30`, borderTopColor: C.bg, animation: 'spin 0.8s linear infinite' }} />

export default function AuthPage({ onAuth, defaultMode = 'signin' }) {
  const [mode,     setMode]     = useState(defaultMode)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const clear = () => setError('')

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); clear()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message.includes('Invalid login')
        ? 'Incorrect email or password. Signed up with Google? Use the button above.'
        : err.message)
      return
    }
    onAuth(data.user)
  }

  const handleSignUp = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); clear()
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setMode('verify')
  }

  const handleGoogle = async () => {
    setLoading(true); clear()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  const handleForgot = async () => {
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true); clear()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` })
    setLoading(false)
    if (err) { setError(err.message); return }
    setError('✅ Reset link sent — check your inbox.')
  }

  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: 'clamp(24px,5vw,36px)', width: '100%', maxWidth: '400px' }
  const ErrBox = () => error ? <div style={{ padding: '11px 14px', background: error.startsWith('✅') ? C.greenDim : C.redDim, border: `1px solid ${error.startsWith('✅') ? C.green : C.red}30`, borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: error.startsWith('✅') ? C.green : C.red, fontFamily: F.sans, lineHeight: 1.5 }}>{error}</div> : null

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '36px', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: C.bg }}>A</div>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: F.sans, color: C.text }}>AdChasser</span>
        </div>

        <div style={card}>
          {mode === 'verify' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📧</div>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>Check your inbox</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, lineHeight: 1.7, marginBottom: '20px' }}>
                Verification link sent to <strong style={{ color: C.text }}>{email}</strong>. Click it to activate your account.
              </p>
              <button onClick={() => setMode('signin')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Back to sign in</button>
            </div>
          )}

          {mode === 'forgot' && (
            <>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Reset your password</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, marginBottom: '22px' }}>We'll send a reset link to your email.</p>
              <ErrBox />
              <Input label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
              <Btn onClick={handleForgot} disabled={loading}>{loading ? <><Spin /> Sending...</> : 'Send Reset Link'}</Btn>
              <button onClick={() => { setMode('signin'); clear() }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', width: '100%', marginTop: '14px' }}>← Back to sign in</button>
            </>
          )}

          {mode === 'signin' && (
            <>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Welcome back</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, marginBottom: '22px' }}>Sign in to your AdChasser account.</p>
              <ErrBox />
              <GoogleBtn onClick={handleGoogle} label="Continue with Google" />
              <Divider />
              <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <div style={{ textAlign: 'right', marginBottom: '16px', marginTop: '-8px' }}>
                <button onClick={() => { setMode('forgot'); clear() }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer' }}>Forgot password?</button>
              </div>
              <Btn onClick={handleSignIn} disabled={loading}>{loading ? <><Spin /> Signing in...</> : 'Sign In'}</Btn>
              <p style={{ textAlign: 'center', fontSize: '13px', color: C.muted, fontFamily: F.sans, marginTop: '16px' }}>
                No account?{' '}
                <button onClick={() => { setMode('signup'); clear() }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Sign up free</button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Create your account</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, marginBottom: '22px' }}>Start measuring your campaigns today.</p>
              <ErrBox />
              <GoogleBtn onClick={handleGoogle} label="Sign up with Google" />
              <Divider />
              <Input label="Full Name" value={name} onChange={setName} placeholder="Charles Ikpe" />
              <Input label="Work Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
              <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />
              <Btn onClick={handleSignUp} disabled={loading}>{loading ? <><Spin /> Creating account...</> : 'Create Account'}</Btn>
              <p style={{ textAlign: 'center', fontSize: '13px', color: C.muted, fontFamily: F.sans, marginTop: '14px' }}>
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); clear() }} style={{ background: 'none', border: 'none', color: C.gold, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
