import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import RespondNav from '../../components/respond/RespondNav.jsx'
import { useRespondent, getWithdrawalHistory, getPaymentMethods } from '../../lib/useRespondent.js'
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

const WITHDRAWAL_MINIMUM = 10000

export default function RespondWalletPage({ user }) {
  const navigate = useNavigate()
  const { respondent, earnings, loading, refetch } = useRespondent(user)
  const [withdrawals,     setWithdrawals]     = useState([])
  const [paymentMethods,  setPaymentMethods]  = useState([])
  const [showWithdraw,    setShowWithdraw]    = useState(false)
  const [showAddMethod,   setShowAddMethod]   = useState(false)
  const [selectedMethod,  setSelectedMethod]  = useState(null)
  const [processing,      setProcessing]      = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [toast,           setToast]           = useState(null)
  const [bankForm,        setBankForm]        = useState({ bank_name: '', bank_code: '', account_number: '', account_name: '' })

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  useEffect(() => {
    if (!respondent) return
    getWithdrawalHistory(respondent.id).then(setWithdrawals)
    getPaymentMethods(respondent.id).then(methods => {
      setPaymentMethods(methods)
      if (methods.length > 0) setSelectedMethod(methods.find(m => m.is_default) ?? methods[0])
    })
  }, [respondent])

  const available = earnings?.available_balance ?? 0
  const canWithdraw = available >= WITHDRAWAL_MINIMUM

  const handleSavePaymentMethod = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_name) {
      showToast('Please fill all bank details', 'error'); return
    }
    setSaving(true)
    try {
      const isFirst = paymentMethods.length === 0
      const { data, error } = await supabase
        .from('respondent_payment_methods')
        .insert({ respondent_id: respondent.id, ...bankForm, is_default: isFirst })
        .select().single()
      if (error) throw error
      setPaymentMethods(prev => [...prev, data])
      if (isFirst) setSelectedMethod(data)
      setShowAddMethod(false)
      setBankForm({ bank_name: '', bank_code: '', account_number: '', account_name: '' })
      showToast('Bank account saved ✓')
    } catch (e) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const handleWithdraw = async () => {
    if (!selectedMethod) { showToast('Please add a bank account first', 'error'); return }
    if (!canWithdraw) { showToast(`Minimum withdrawal is ₦${WITHDRAWAL_MINIMUM.toLocaleString()}`, 'error'); return }
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          respondent_id:    respondent.id,
          amount:           available,
          currency:         'NGN',
          payment_method_id: selectedMethod.id,
          status:           'pending',
        })
      if (error) throw error
      await refetch()
      setShowWithdraw(false)
      showToast('Withdrawal request submitted! Processing within 24 hours.')
      getWithdrawalHistory(respondent.id).then(setWithdrawals)
    } catch (e) { showToast(e.message, 'error') }
    setProcessing(false)
  }

  const inp = { width: '100%', padding: '11px 13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.3px', marginBottom: '5px', fontFamily: F.sans, textTransform: 'uppercase' }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg }} />
  if (!respondent) { navigate('/respond/auth'); return null }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.sans }}>
      <RespondNav respondent={respondent} earnings={earnings} user={user} />

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : C.green, color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)' }}>

        <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontFamily: F.display, fontWeight: 700, marginBottom: '24px' }}>My Wallet</h2>

        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Available', value: `₦${(earnings?.available_balance ?? 0).toLocaleString()}`, color: C.gold },
            { label: 'Pending',   value: `₦${(earnings?.pending_balance ?? 0).toLocaleString()}`,   color: C.blue },
            { label: 'Total Withdrawn', value: `₦${(earnings?.withdrawn_total ?? 0).toLocaleString()}`, color: C.green },
          ].map(m => (
            <div key={m.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px 18px' }}>
              <p style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: m.color, fontFamily: F.display }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Withdraw button */}
        <div style={{ background: canWithdraw ? `linear-gradient(135deg,${C.green}10,${C.card})` : C.card, border: `1px solid ${canWithdraw ? C.green + '40' : C.border}`, borderRadius: '14px', padding: '20px 22px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, fontFamily: F.sans, marginBottom: '4px' }}>
              {canWithdraw ? '🎉 Ready to withdraw!' : `₦${Math.max(0, WITHDRAWAL_MINIMUM - available).toLocaleString()} more to unlock withdrawal`}
            </p>
            <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>
              Minimum withdrawal: ₦{WITHDRAWAL_MINIMUM.toLocaleString()} · Processed within 24 hours
            </p>
          </div>
          <button onClick={() => setShowWithdraw(true)} disabled={!canWithdraw} style={{ padding: '11px 24px', background: canWithdraw ? `linear-gradient(135deg,${C.green},${C.green}CC)` : C.dim, border: 'none', borderRadius: '10px', color: canWithdraw ? '#fff' : C.muted, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: canWithdraw ? 'pointer' : 'not-allowed' }}>
            💳 Withdraw Funds
          </button>
        </div>

        {/* Payment methods */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700 }}>Payment Methods</h3>
            <button onClick={() => setShowAddMethod(true)} style={{ fontSize: '12px', color: C.gold, background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: F.sans, fontWeight: 600 }}>
              + Add Account
            </button>
          </div>
          {paymentMethods.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', background: C.card, border: `2px dashed ${C.border}`, borderRadius: '14px', cursor: 'pointer' }} onClick={() => setShowAddMethod(true)}>
              <p style={{ fontSize: '28px', marginBottom: '8px' }}>🏦</p>
              <p style={{ fontSize: '13px', color: C.muted }}>No bank account saved yet. Add one to withdraw your earnings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paymentMethods.map(m => (
                <div key={m.id} style={{ background: C.card, border: `1px solid ${selectedMethod?.id === m.id ? C.gold + '50' : C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setSelectedMethod(m)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏦</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, margin: '0 0 3px' }}>{m.bank_name}</p>
                      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>{m.account_number} · {m.account_name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.is_default && <span style={{ fontSize: '10px', background: C.goldDim, color: C.gold, border: `1px solid ${C.gold}30`, borderRadius: '6px', padding: '2px 8px', fontFamily: F.sans }}>Default</span>}
                    {selectedMethod?.id === m.id && <span style={{ color: C.gold, fontSize: '16px' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal history */}
        <div>
          <h3 style={{ fontSize: '15px', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', padding: '24px', background: C.card, borderRadius: '14px', border: `1px solid ${C.border}` }}>No withdrawals yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {withdrawals.map(w => {
                const statusColor = { pending: C.gold, processing: C.blue, completed: C.green, failed: '#ef4444' }[w.status] ?? C.muted
                return (
                  <div key={w.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: C.green, fontFamily: F.display, margin: '0 0 3px' }}>₦{w.amount?.toLocaleString()}</p>
                      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>{new Date(w.requested_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span style={{ fontSize: '11px', background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}30`, borderRadius: '8px', padding: '3px 10px', fontFamily: F.sans, fontWeight: 600, textTransform: 'capitalize' }}>{w.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add bank account modal */}
      {showAddMethod && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '20px' }}>Add Bank Account</h3>
            <label style={lbl}>Bank Name</label>
            <select value={bankForm.bank_name} onChange={e => {
              const bank = NIGERIAN_BANKS.find(b => b.name === e.target.value)
              setBankForm(f => ({ ...f, bank_name: e.target.value, bank_code: bank?.code ?? '' }))
            }} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
              <option value="">Select bank…</option>
              {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
            </select>
            <label style={lbl}>Account Number</label>
            <input value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} placeholder="10-digit account number" maxLength={10} style={inp} />
            <label style={lbl}>Account Name</label>
            <input value={bankForm.account_name} onChange={e => setBankForm(f => ({ ...f, account_name: e.target.value }))} placeholder="As it appears on your bank account" style={inp} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowAddMethod(false)} style={{ flex: 1, padding: '11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSavePaymentMethod} disabled={saving} style={{ flex: 1, padding: '11px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw confirmation modal */}
      {showWithdraw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px' }}>Confirm Withdrawal</h3>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '20px' }}>Funds will be sent to your bank account within 24 hours.</p>
            <div style={{ padding: '16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: C.muted }}>Amount</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.gold }}>₦{available.toLocaleString()}</span>
              </div>
              {selectedMethod && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: C.muted }}>To</span>
                  <span style={{ fontSize: '13px', color: C.text }}>{selectedMethod.bank_name} · {selectedMethod.account_number}</span>
                </div>
              )}
            </div>
            {!selectedMethod && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>Please add a bank account first.</p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowWithdraw(false)} style={{ flex: 1, padding: '11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleWithdraw} disabled={processing || !selectedMethod} style={{ flex: 1, padding: '11px', background: `linear-gradient(135deg,${C.green},${C.green}CC)`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                {processing ? 'Processing…' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
