import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../tokens.js'
import { Card, Badge, Spinner, Eyebrow } from '../shared/ui.jsx'

const ADMIN_EMAIL = 'charlzillion@gmail.com'

export default function AdminPanel({ user, onExit }) {
  const [campaigns, setCampaigns] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [catLoading, setCatLoading] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [newCat, setNewCat] = useState({ code: '', name: '', sector_code: '', sector_name: '', brand_type_suggestion: 'mixed' })
  const [showNewCat, setShowNewCat] = useState(false)
  const [catMsg, setCatMsg] = useState(null)

  // ── Withdrawals admin state ─────────────────────────────────
  const [withdrawals, setWithdrawals] = useState([])
  const [wLoading, setWLoading] = useState(false)
  const [wFilter, setWFilter] = useState('pending_approval')
  const [wActioning, setWActioning] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [wMsg, setWMsg] = useState(null)
  const showWMsg = (msg, type = 'success') => { setWMsg({ msg, type }); setTimeout(() => setWMsg(null), 4000) }

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <p style={{ fontFamily: F.sans, color: C.muted }}>Access denied.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: camps } = await supabase.from('campaigns').select('*, brands(name, category)').order('created_at', { ascending: false })
      const { data: responses } = await supabase.from('survey_responses').select('campaign_id, completed_at')
      const respMap = {}
      responses?.forEach(r => { if (!respMap[r.campaign_id]) respMap[r.campaign_id] = 0; if (r.completed_at) respMap[r.campaign_id]++ })
      setCampaigns((camps ?? []).map(c => ({ ...c, response_count: respMap[c.id] ?? 0 })))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (tab === 'categories') loadCategories()
    if (tab === 'withdrawals') loadWithdrawals()
  }, [tab, wFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    setCatLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data ?? [])
    setCatLoading(false)
  }

  const showMsg = (msg, type = 'success') => { setCatMsg({ msg, type }); setTimeout(() => setCatMsg(null), 3000) }

  const handleToggleActive = async (cat) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    showMsg(`${cat.name} ${!cat.is_active ? 'activated' : 'hidden'}`)
  }

  const handleRename = async (cat, newName) => {
    await supabase.from('categories').update({ name: newName, updated_at: new Date().toISOString() }).eq('id', cat.id)
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: newName } : c))
    setEditingCat(null)
    showMsg(`Renamed to "${newName}"`)
  }

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    showMsg(`${cat.name} deleted`)
  }

  // ── Withdrawals actions ─────────────────────────────────────
  const loadWithdrawals = async () => {
    setWLoading(true)
    let q = supabase
      .from('withdrawals')
      .select(`
        id, status, amount_kobo, requested_at, approved_at, approved_by,
        failure_reason, paystack_transfer_code, paystack_reference,
        respondent_id, payment_method_id,
        respondents!inner(id, email, full_name),
        respondent_payment_methods!inner(id, bank_name, account_number, verified_account_name, paystack_recipient_code, is_active)
      `)
      .order('requested_at', { ascending: false })
      .limit(100)
    if (wFilter !== 'all') q = q.eq('status', wFilter)
    const { data, error } = await q
    if (error) showWMsg(`Failed to load: ${error.message}`, 'error')
    setWithdrawals(data ?? [])
    setWLoading(false)
  }

  const handleApproveWithdrawal = async (w) => {
    if (!confirm(`Approve withdrawal of ₦${(w.amount_kobo / 100).toLocaleString()} to ${w.respondents.email}?\n\nThis will initiate a Paystack transfer immediately.`)) return
    setWActioning(w.id)
    try {
      const { data, error } = await supabase.functions.invoke('approve-withdrawal', {
        body: { action: 'approve', withdrawalId: w.id },
      })
      if (error) {
        const body = await error.context?.json?.().catch(() => null)
        throw new Error(body?.error?.message || error.message || 'Approval failed')
      }
      showWMsg(`Approved — Paystack status: ${data?.paystackStatus ?? 'pending'}`)
      await loadWithdrawals()
    } catch (e) {
      showWMsg(e.message, 'error')
    }
    setWActioning(null)
  }

  const handleRejectWithdrawal = async () => {
    if (!rejectModal) return
    if (rejectReason.trim().length < 3) { showWMsg('Reason required (min 3 chars)', 'error'); return }
    setWActioning(rejectModal.id)
    try {
      const { error } = await supabase.functions.invoke('approve-withdrawal', {
        body: { action: 'reject', withdrawalId: rejectModal.id, rejectionReason: rejectReason.trim() },
      })
      if (error) {
        const body = await error.context?.json?.().catch(() => null)
        throw new Error(body?.error?.message || error.message || 'Rejection failed')
      }
      showWMsg('Rejected and refunded')
      setRejectModal(null)
      setRejectReason('')
      await loadWithdrawals()
    } catch (e) {
      showWMsg(e.message, 'error')
    }
    setWActioning(null)
  }

  const wStatusColor = (s) => ({
    pending_approval: C.gold,
    approved:         C.blue,
    transferring:     C.blue,
    completed:        C.green,
    failed:           '#ef4444',
    cancelled:        C.muted,
    refunded:         C.muted,
  }[s] ?? C.muted)

  const handleAddCategory = async () => {
    if (!newCat.code || !newCat.name || !newCat.sector_code || !newCat.sector_name) return showMsg('All fields required', 'error')
    const { error } = await supabase.from('categories').insert({ ...newCat, sort_order: categories.length + 1 })
    if (error) return showMsg(error.message, 'error')
    showMsg(`${newCat.name} added`)
    setShowNewCat(false)
    setNewCat({ code: '', name: '', sector_code: '', sector_name: '', brand_type_suggestion: 'mixed' })
    loadCategories()
  }

  const totalResponses = campaigns.reduce((s, c) => s + c.response_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const statusColor = s => ({ active: C.green, draft: C.muted, paused: C.orange, completed: C.blue }[s] ?? C.muted)

  const TABS = ['overview', 'categories', 'withdrawals']

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Admin Nav */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: C.red + '22', border: `1px solid ${C.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🛡️</div>
          <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: F.sans, color: C.text }}>AdChasser Admin</span>
          <Badge color={C.red}>Superuser</Badge>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? C.goldDim : 'none', border: `1px solid ${tab === t ? C.gold + '40' : C.border}`, color: tab === t ? C.gold : C.muted, padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
          ))}
          <button onClick={onExit} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', marginLeft: '8px' }}>← Back to Platform</button>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <Eyebrow style={{ marginBottom: '10px' }}>Platform Administration</Eyebrow>
            <h2 style={{ fontSize: '28px', fontFamily: F.display, fontWeight: 700, marginBottom: '32px' }}>Platform Overview</h2>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner size={32} /></div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                  {[
                    { label: 'Total Campaigns',  value: campaigns.length, color: C.gold },
                    { label: 'Active Campaigns', value: activeCampaigns,  color: C.green },
                    { label: 'Total Responses',  value: totalResponses,   color: C.blue },
                    { label: 'Total Brands',     value: new Set(campaigns.map(c => c.brand_id)).size, color: C.purple },
                  ].map(m => (
                    <Card key={m.label} style={{ padding: '20px' }}>
                      <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{m.label}</p>
                      <p style={{ fontSize: '32px', fontWeight: 700, fontFamily: F.sans, color: m.color }}>{m.value}</p>
                    </Card>
                  ))}
                </div>
                <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '16px' }}>All Campaigns</h3>
                <Card style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
                    <thead>
                      <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                        {['Campaign', 'Brand', 'Status', 'Channels', 'Responses', 'Launched'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? 'transparent' : C.surface + '40' }}>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.text, fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.muted }}>{c.brands?.name ?? '—'}</td>
                          <td style={{ padding: '14px 16px' }}><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.muted }}>{c.channels?.slice(0, 2).join(', ')}{c.channels?.length > 2 ? ` +${c.channels.length - 2}` : ''}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: C.text, fontWeight: 600 }}>{c.response_count}</td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.muted }}>{c.launched_at ? new Date(c.launched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {campaigns.length === 0 && <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontFamily: F.sans, fontSize: '14px' }}>No campaigns yet.</div>}
                </Card>
              </>
            )}
          </>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === 'categories' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <Eyebrow style={{ marginBottom: '6px' }}>Category Management</Eyebrow>
                <h2 style={{ fontSize: '24px', fontFamily: F.display, fontWeight: 700 }}>Categories</h2>
              </div>
              <button onClick={() => setShowNewCat(true)} style={{ background: C.goldDim, border: `1px solid ${C.gold}40`, color: C.gold, padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer', fontWeight: 600 }}>+ Add Category</button>
            </div>

            {catMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: catMsg.type === 'error' ? '#ef444420' : C.green + '20', border: `1px solid ${catMsg.type === 'error' ? '#ef4444' : C.green}40`, color: catMsg.type === 'error' ? '#ef4444' : C.green, fontFamily: F.sans, fontSize: '13px', marginBottom: '16px' }}>
                {catMsg.msg}
              </div>
            )}

            {/* Add new category form */}
            {showNewCat && (
              <Card style={{ padding: '20px', marginBottom: '20px', border: `1px solid ${C.gold}30` }}>
                <h4 style={{ fontFamily: F.sans, fontWeight: 600, marginBottom: '16px', color: C.gold }}>New Category</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Code (e.g. A01)', key: 'code' },
                    { label: 'Name', key: 'name' },
                    { label: 'Sector Code (A-H)', key: 'sector_code' },
                    { label: 'Sector Name', key: 'sector_name' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                      <input value={newCat[f.key]} onChange={e => setNewCat(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand Type Suggestion</label>
                    <select value={newCat.brand_type_suggestion} onChange={e => setNewCat(p => ({ ...p, brand_type_suggestion: e.target.value }))} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none' }}>
                      <option value="goods">Goods</option>
                      <option value="services">Services</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleAddCategory} style={{ background: C.gold, border: 'none', color: C.bg, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontFamily: F.sans, fontWeight: 600, cursor: 'pointer' }}>Add Category</button>
                  <button onClick={() => setShowNewCat(false)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>Cancel</button>
                </div>
              </Card>
            )}

            {catLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={28} /></div>
            ) : (
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
                  <thead>
                    <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                      {['Code', 'Name', 'Sector', 'Type Suggestion', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, i) => (
                      <tr key={cat.id} style={{ borderBottom: i < categories.length - 1 ? `1px solid ${C.border}` : 'none', background: !cat.is_active ? C.surface + '60' : 'transparent', opacity: cat.is_active ? 1 : 0.6 }}>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: C.gold }}>{cat.code}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: C.text }}>
                          {editingCat === cat.id ? (
                            <input
                              defaultValue={cat.name}
                              autoFocus
                              onBlur={e => handleRename(cat, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleRename(cat, e.target.value)}
                              style={{ background: C.surface, border: `1px solid ${C.gold}`, borderRadius: '6px', padding: '4px 10px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', width: '200px' }}
                            />
                          ) : (
                            <span onDoubleClick={() => setEditingCat(cat.id)} title="Double-click to rename">{cat.name}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: C.muted }}>{cat.sector_name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={cat.brand_type_suggestion === 'goods' ? C.blue : cat.brand_type_suggestion === 'services' ? C.green : C.gold}>
                            {cat.brand_type_suggestion}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge color={cat.is_active ? C.green : C.muted}>{cat.is_active ? 'Active' : 'Hidden'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setEditingCat(cat.id)} style={{ padding: '4px 10px', fontSize: '11px', fontFamily: F.sans, background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, cursor: 'pointer' }}>Rename</button>
                            <button onClick={() => handleToggleActive(cat)} style={{ padding: '4px 10px', fontSize: '11px', fontFamily: F.sans, background: 'none', border: `1px solid ${cat.is_active ? C.orange + '60' : C.green + '60'}`, borderRadius: '6px', color: cat.is_active ? C.orange ?? C.muted : C.green, cursor: 'pointer' }}>{cat.is_active ? 'Hide' : 'Show'}</button>
                            <button onClick={() => handleDelete(cat)} style={{ padding: '4px 10px', fontSize: '11px', fontFamily: F.sans, background: 'none', border: '1px solid #ef444440', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {tab === 'withdrawals' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <Eyebrow style={{ marginBottom: '6px' }}>Respondent Payouts</Eyebrow>
                <h2 style={{ fontSize: '24px', fontFamily: F.display, fontWeight: 700 }}>Withdrawals</h2>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { k: 'pending_approval', label: 'Pending' },
                  { k: 'transferring',     label: 'Processing' },
                  { k: 'completed',        label: 'Completed' },
                  { k: 'failed',           label: 'Failed' },
                  { k: 'cancelled',        label: 'Cancelled' },
                  { k: 'all',              label: 'All' },
                ].map(f => (
                  <button key={f.k} onClick={() => setWFilter(f.k)}
                    style={{ background: wFilter === f.k ? C.goldDim : 'none', border: `1px solid ${wFilter === f.k ? C.gold + '40' : C.border}`, color: wFilter === f.k ? C.gold : C.muted, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontFamily: F.sans, cursor: 'pointer' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {wMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: wMsg.type === 'error' ? '#ef444420' : C.green + '20', border: `1px solid ${wMsg.type === 'error' ? '#ef4444' : C.green}40`, color: wMsg.type === 'error' ? '#ef4444' : C.green, fontFamily: F.sans, fontSize: '13px', marginBottom: '16px' }}>
                {wMsg.msg}
              </div>
            )}

            {wLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={28} /></div>
            ) : withdrawals.length === 0 ? (
              <Card style={{ padding: '48px', textAlign: 'center', color: C.muted, fontFamily: F.sans, fontSize: '14px' }}>
                No withdrawals match this filter.
              </Card>
            ) : (
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans }}>
                  <thead>
                    <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                      {['Respondent', 'Amount', 'Bank', 'Requested', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w, i) => {
                      const pm = w.respondent_payment_methods
                      const r = w.respondents
                      const naira = Number(w.amount_kobo) / 100
                      const isPending = w.status === 'pending_approval'
                      const busy = wActioning === w.id
                      return (
                        <tr key={w.id} style={{ borderBottom: i < withdrawals.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? 'transparent' : C.surface + '40' }}>
                          <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                            <p style={{ margin: '0 0 2px', color: C.text, fontWeight: 600 }}>{r?.full_name || '—'}</p>
                            <p style={{ margin: 0, color: C.muted, fontSize: '11px' }}>{r?.email}</p>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '14px', color: C.gold, fontFamily: F.display, fontWeight: 700 }}>₦{naira.toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.muted }}>
                            <p style={{ margin: '0 0 2px', color: C.text }}>{pm?.bank_name}</p>
                            <p style={{ margin: 0, fontFamily: 'monospace' }}>{pm?.account_number}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px' }}>{pm?.verified_account_name}</p>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.muted }}>
                            {new Date(w.requested_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <Badge color={wStatusColor(w.status)}>{w.status.replace(/_/g, ' ')}</Badge>
                            {w.failure_reason && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444', maxWidth: '200px' }}>{w.failure_reason}</p>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleApproveWithdrawal(w)} disabled={busy}
                                  style={{ padding: '6px 12px', fontSize: '12px', fontFamily: F.sans, background: C.green + '20', border: `1px solid ${C.green}60`, borderRadius: '6px', color: C.green, cursor: busy ? 'wait' : 'pointer', fontWeight: 600 }}>
                                  {busy ? '…' : 'Approve'}
                                </button>
                                <button onClick={() => setRejectModal({ id: w.id, amount_kobo: w.amount_kobo, email: r?.email })} disabled={busy}
                                  style={{ padding: '6px 12px', fontSize: '12px', fontFamily: F.sans, background: 'none', border: '1px solid #ef444460', borderRadius: '6px', color: '#ef4444', cursor: busy ? 'wait' : 'pointer' }}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: C.muted, fontFamily: 'monospace' }}>
                                {w.paystack_transfer_code ? w.paystack_transfer_code.slice(0, 16) + '…' : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            )}

            {/* Reject modal */}
            {rejectModal && (
              <div onClick={() => !wActioning && setRejectModal(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div onClick={e => e.stopPropagation()}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                  <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px' }}>Reject Withdrawal</h3>
                  <p style={{ fontSize: '13px', color: C.muted, marginBottom: '16px' }}>
                    Refund ₦{(rejectModal.amount_kobo / 100).toLocaleString()} to {rejectModal.email}'s available balance and mark the request cancelled.
                  </p>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.muted, letterSpacing: '0.3px', marginBottom: '6px', textTransform: 'uppercase' }}>Reason (visible to respondent)</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Account name mismatch — please re-verify your bank details"
                    rows={3} maxLength={500}
                    style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px', color: C.text, fontSize: '13px', fontFamily: F.sans, outline: 'none', boxSizing: 'border-box', marginBottom: '14px', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setRejectModal(null)} disabled={!!wActioning}
                      style={{ flex: 1, padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: wActioning ? 'wait' : 'pointer' }}>Cancel</button>
                    <button onClick={handleRejectWithdrawal} disabled={!!wActioning}
                      style={{ flex: 1.4, padding: '11px', background: '#ef4444', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontFamily: F.sans, fontWeight: 700, cursor: wActioning ? 'wait' : 'pointer', opacity: wActioning ? 0.7 : 1 }}>
                      {wActioning ? 'Processing…' : 'Reject & Refund'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { ADMIN_EMAIL }
