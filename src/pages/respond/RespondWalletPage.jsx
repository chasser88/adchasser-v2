import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import RespondNav from '../../components/respond/RespondNav.jsx'
import { useRespondent } from '../../lib/useRespondent.js'
import { supabase } from '../../lib/supabase.js'

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank', code: '023' },
  { name: 'EcoBank', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'GTBank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '999108' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank', code: '032' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

const WITHDRAWAL_MINIMUM = 10000 // naira; backend hard floor is ₦1,000

const STATUS_META = {
  pending_approval: { color: '#d4a017', label: 'Pending approval' },
  approved:         { color: '#3b82f6', label: 'Approved' },
  transferring:     { color: '#3b82f6', label: 'Processing' },
  completed:        { color: '#10b981', label: 'Completed' },
  failed:           { color: '#ef4444', label: 'Failed' },
  cancelled:        { color: '#9ca3af', label: 'Cancelled' },
  refunded:         { color: '#9ca3af', label: 'Refunded' },
}

// ── Inline data helpers (replaces getPaymentMethods/getWithdrawalHistory) ──
async function fetchPaymentMethods(respondentId) {
  const { data, error } = await supabase
    .from('respondent_payment_methods')
    .select('*')
    .eq('respondent_id', respondentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

async function fetchWithdrawals(respondentId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('id, amount_kobo, status, requested_at, failure_reason')
    .eq('respondent_id', respondentId)
    .order('requested_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

// Edge Function errors come back with body in error.context (Response).
async function extractFnError(error, fallback) {
  if (!error) return fallback
  try {
    const body = await error.context?.json?.()
    return body?.error?.message || body?.message || error.message || fallback
  } catch {
    return error.message || fallback
  }
}

export default function RespondWalletPage({ user }) {
  const navigate = useNavigate()
  const { respondent, earnings, loading, refetch } = useRespondent(user)
  const [withdrawals,    setWithdrawals]    = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [showWithdraw,   setShowWithdraw]   = useState(false)
  const [showAddMethod,  setShowAddMethod]  = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processing,     setProcessing]     = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [toast,          setToast]          = useState(null)
  const [bankForm,       setBankForm]       = useState({ bank_name: '', bank_code: '', account_number: '' })

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500) }

  useEffect(() => {
    if (!respondent) return
    fetchWithdrawals(respondent.id).then(setWithdrawals).catch(() => setWithdrawals([]))
    fetchPaymentMethods(respondent.id).then(methods => {
      setPaymentMethods(methods)
      if (methods.length > 0) setSelectedMethod(methods.find(m => m.is_default) ?? methods[0])
    }).catch(() => setPaymentMethods([]))
  }, [respondent])

  // ── Realtime subscription ────────────────────────────────────
  // Listens for INSERT/UPDATE on this respondent's withdrawals so the user
  // sees status flips (pending_approval → transferring → completed) without
  // needing to refresh. Also refetches earnings on UPDATE since status flips
  // mutate available_balance (refund) and withdrawn_total (completion).
  useEffect(() => {
    if (!respondent?.id) return

    const channel = supabase
      .channel(`wallet:${respondent.id}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'withdrawals',
        filter: `respondent_id=eq.${respondent.id}`,
      }, () => {
        // Refetch both — earnings change on refund/completion; withdrawals on any flip.
        fetchWithdrawals(respondent.id).then(setWithdrawals).catch(() => {})
        refetch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [respondent?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const available   = earnings?.available_balance ?? 0
  const canWithdraw = available >= WITHDRAWAL_MINIMUM

  const openWithdraw = () => {
    setWithdrawAmount(String(available))
    setShowWithdraw(true)
  }

  const handleVerifyBank = async () => {
    if (!bankForm.bank_name || !bankForm.bank_code) {
      showToast('Please select your bank', 'error'); return
    }
    if (!/^\d{10}$/.test(bankForm.account_number)) {
      showToast('Account number must be 10 digits', 'error'); return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-bank-account', {
        body: {
          bankCode:      bankForm.bank_code,
          accountNumber: bankForm.account_number,
          bankName:      bankForm.bank_name,
        },
      })
      if (error) throw new Error(await extractFnError(error, 'Verification failed'))

      const fresh = await fetchPaymentMethods(respondent.id)
      setPaymentMethods(fresh)
      setSelectedMethod(fresh.find(m => m.is_default) ?? fresh[0] ?? null)
      setShowAddMethod(false)
      setBankForm({ bank_name: '', bank_code: '', account_number: '' })
      const verifiedName = data?.accountName ?? 'account'
      showToast(`Verified: ${verifiedName} ✓`)
    } catch (e) {
      showToast(e.message || 'Could not verify account. Check details and try again.', 'error')
    }
    setSaving(false)
  }

  const handleWithdraw = async () => {
    if (!selectedMethod) { showToast('Please add a bank account first', 'error'); return }
    const amountNaira = Number(withdrawAmount)
    if (!Number.isFinite(amountNaira) || amountNaira < WITHDRAWAL_MINIMUM) {
      showToast(`Minimum withdrawal is ₦${WITHDRAWAL_MINIMUM.toLocaleString()}`, 'error'); return
    }
    if (amountNaira > available) {
      showToast('Amount exceeds your available balance', 'error'); return
    }
    setProcessing(true)
    try {
      const { error } = await supabase.functions.invoke('initiate-withdrawal', {
        body: {
          paymentMethodId: selectedMethod.id,
          amountKobo:      Math.round(amountNaira * 100),
        },
      })
      if (error) throw new Error(await extractFnError(error, 'Withdrawal failed'))

      await refetch()
      const updated = await fetchWithdrawals(respondent.id)
      setWithdrawals(updated)
      setShowWithdraw(false)
      setWithdrawAmount('')
      showToast('Withdrawal submitted — awaiting approval')
    } catch (e) {
      showToast(e.message || 'Withdrawal failed', 'error')
    }
    setProcessing(false)
  }

  const inp = { width: '100%', padding: '12px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '16px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '12px', WebkitAppearance: 'none' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.3px', marginBottom: '6px', textTransform: 'uppercase' }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg }} />
  if (!respondent) { navigate('/panel/auth'); return null }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.sans }}>
      <RespondNav respondent={respondent} earnings={earnings} user={user} />

      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : C.green, color: '#fff', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, maxWidth: '90vw', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      <div className="panel-content-pad" style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(16px,4vw,40px) clamp(14px,4vw,32px)' }}>

        <h2 style={{ fontSize: 'clamp(18px,5vw,26px)', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>My Wallet</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Available', value: `₦${(earnings?.available_balance ?? 0).toLocaleString()}`, color: C.gold  },
            { label: 'Pending',   value: `₦${(earnings?.pending_balance   ?? 0).toLocaleString()}`, color: C.blue  },
            { label: 'Withdrawn', value: `₦${(earnings?.withdrawn_total   ?? 0).toLocaleString()}`, color: C.green },
          ].map(m => (
            <div key={m.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 14px' }}>
              <p style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(14px,4vw,22px)', fontWeight: 700, color: m.color, fontFamily: F.display, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: canWithdraw ? `linear-gradient(135deg,${C.green}10,${C.card})` : C.card, border: `1px solid ${canWithdraw ? C.green + '40' : C.border}`, borderRadius: '14px', padding: '16px 18px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {canWithdraw ? '🎉 Ready to withdraw!' : `₦${Math.max(0, WITHDRAWAL_MINIMUM - available).toLocaleString()} more to unlock withdrawal`}
          </p>
          <p style={{ fontSize: '12px', color: C.muted, marginBottom: '14px' }}>
            Minimum: ₦{WITHDRAWAL_MINIMUM.toLocaleString()} · Approved within 24 hours
          </p>
          <button onClick={openWithdraw} disabled={!canWithdraw}
            style={{ width: '100%', padding: '13px', background: canWithdraw ? `linear-gradient(135deg,${C.green},${C.green}CC)` : C.surface, border: `1px solid ${canWithdraw ? 'transparent' : C.border}`, borderRadius: '10px', color: canWithdraw ? '#fff' : C.muted, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: canWithdraw ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}>
            💳 Withdraw Funds
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700 }}>Payment Method</h3>
            <button onClick={() => setShowAddMethod(true)}
              style={{ fontSize: '12px', color: C.gold, background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, touchAction: 'manipulation' }}>
              {paymentMethods.length === 0 ? '+ Add Account' : 'Change'}
            </button>
          </div>
          {paymentMethods.length === 0 ? (
            <div onClick={() => setShowAddMethod(true)} style={{ padding: '28px', textAlign: 'center', background: C.card, border: `2px dashed ${C.border}`, borderRadius: '14px', cursor: 'pointer' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>🏦</p>
              <p style={{ fontSize: '13px', color: C.muted }}>Tap to add your bank account</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paymentMethods.map(m => (
                <div key={m.id} onClick={() => setSelectedMethod(m)}
                  style={{ background: C.card, border: `1.5px solid ${selectedMethod?.id === m.id ? C.gold : C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', touchAction: 'manipulation' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏦</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 3px' }}>{m.bank_name}</p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.account_number} · {m.verified_account_name ?? m.account_name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                    {m.verified_at && <span style={{ fontSize: '10px', background: C.green + '18', color: C.green, border: `1px solid ${C.green}30`, borderRadius: '6px', padding: '2px 7px' }}>Verified</span>}
                    {selectedMethod?.id === m.id && <span style={{ color: C.gold, fontSize: '18px' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', padding: '20px', background: C.card, borderRadius: '12px', border: `1px solid ${C.border}` }}>No withdrawals yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {withdrawals.map(w => {
                const meta = STATUS_META[w.status] ?? { color: C.muted, label: w.status }
                const naira = (Number(w.amount_kobo ?? 0) / 100)
                return (
                  <div key={w.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: C.green, fontFamily: F.display, margin: '0 0 3px' }}>₦{naira.toLocaleString()}</p>
                      <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
                        {new Date(w.requested_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {w.status === 'failed' && w.failure_reason && ` · ${w.failure_reason}`}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}30`, borderRadius: '8px', padding: '3px 10px', fontWeight: 600, marginLeft: '8px', flexShrink: 0 }}>{meta.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add bank modal */}
      {showAddMethod && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '40px', height: '4px', background: C.border, borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px' }}>Add Bank Account</h3>
            <p style={{ fontSize: '12px', color: C.muted, marginBottom: '18px' }}>We'll verify with your bank instantly. Adding a new account replaces your current one.</p>

            <label style={lbl}>Bank Name</label>
            <select value={bankForm.bank_name} onChange={e => {
              const bank = NIGERIAN_BANKS.find(b => b.name === e.target.value)
              setBankForm(f => ({ ...f, bank_name: e.target.value, bank_code: bank?.code ?? '' }))
            }} style={inp} disabled={saving}>
              <option value="">Select bank…</option>
              {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
            </select>

            <label style={lbl}>Account Number</label>
            <input type="tel" value={bankForm.account_number}
              onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              placeholder="10-digit account number" maxLength={10} style={inp} inputMode="numeric" disabled={saving} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowAddMethod(false)} disabled={saving} style={{ flex: 1, padding: '13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '14px', touchAction: 'manipulation', cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
              <button onClick={handleVerifyBank} disabled={saving} style={{ flex: 1.4, padding: '13px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, touchAction: 'manipulation', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Verifying…' : 'Verify & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw confirm modal */}
      {showWithdraw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '40px', height: '4px', background: C.border, borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px' }}>Withdraw Funds</h3>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '18px' }}>Awaiting admin approval. Funds usually arrive within 24 hours of approval.</p>

            <label style={lbl}>Amount (₦)</label>
            <input type="number" inputMode="numeric" value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder={`Min ₦${WITHDRAWAL_MINIMUM.toLocaleString()}`}
              min={WITHDRAWAL_MINIMUM} max={available} step="100" style={inp} disabled={processing} />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => setWithdrawAmount(String(available))} style={{ fontSize: '11px', background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Max (₦{available.toLocaleString()})</button>
            </div>

            {selectedMethod && (
              <div style={{ padding: '14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Sending to</p>
                <p style={{ fontSize: '13px', color: C.text, margin: 0 }}>{selectedMethod.bank_name} · {selectedMethod.account_number}</p>
                <p style={{ fontSize: '12px', color: C.muted, margin: '2px 0 0' }}>{selectedMethod.verified_account_name ?? selectedMethod.account_name}</p>
              </div>
            )}
            {!selectedMethod && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>Please add a bank account first.</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowWithdraw(false)} disabled={processing} style={{ flex: 1, padding: '13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '14px', touchAction: 'manipulation', cursor: processing ? 'not-allowed' : 'pointer' }}>Cancel</button>
              <button onClick={handleWithdraw} disabled={processing || !selectedMethod} style={{ flex: 2, padding: '13px', background: `linear-gradient(135deg,${C.green},${C.green}CC)`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, touchAction: 'manipulation', cursor: (processing || !selectedMethod) ? 'not-allowed' : 'pointer', opacity: (processing || !selectedMethod) ? 0.7 : 1 }}>
                {processing ? 'Submitting…' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
