import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../tokens.js'

const Spin = () => <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${C.bg}30`, borderTopColor: C.bg, animation: 'spin 0.8s linear infinite' }} />

export default function ResetPassword() {
  const navigate  = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {}
    })
  }, [])

  const handleReset = async () => {
    if (!password || !confirm) { setError('Please fill in both fields.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => navigate('/auth'), 2000)
  }

  const inputStyle = { width: '100%', padding: '12px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '36px', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: C.bg }}>A</div>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: F.sans, color: C.text }}>AdChasser</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: 'clamp(24px,5vw,36px)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>✅</div>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>Password updated</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans }}>Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>Set new password</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, marginBottom: '22px' }}>Choose a strong password for your account.</p>
              {error && <div style={{ padding: '11px 14px', background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: C.red, fontFamily: F.sans }}>{error}</div>}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, marginBottom: '6px' }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" style={inputStyle} />
              </div>
              <button onClick={handleReset} disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? C.dim : `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: loading ? C.muted : C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <><Spin /> Updating...</> : 'Update Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
