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
  }, [tab])

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

  const TABS = ['overview', 'categories']

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
      </div>
    </div>
  )
}

export { ADMIN_EMAIL }
