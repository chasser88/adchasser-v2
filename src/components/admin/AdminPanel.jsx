import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { C, F } from '../../tokens.js'
import { Card, Badge, Spinner, Eyebrow } from '../shared/ui.jsx'

const ADMIN_EMAIL = 'charlzillion@gmail.com'

export default function AdminPanel({ user, onExit }) {
  const [users,     setUsers]     = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('overview')

  // Guard — only admin can access
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

      // Fetch all campaigns with brand info
      const { data: camps } = await supabase
        .from('campaigns')
        .select('*, brands(name, category)')
        .order('created_at', { ascending: false })

      // Fetch response counts per campaign
      const { data: responses } = await supabase
        .from('survey_responses')
        .select('campaign_id, completed_at')

      const respMap = {}
      responses?.forEach(r => {
        if (!respMap[r.campaign_id]) respMap[r.campaign_id] = 0
        if (r.completed_at) respMap[r.campaign_id]++
      })

      setCampaigns((camps ?? []).map(c => ({ ...c, response_count: respMap[c.id] ?? 0 })))
      setLoading(false)
    }
    load()
  }, [])

  const totalResponses = campaigns.reduce((s, c) => s + c.response_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  const statusColor = s => ({ active: C.green, draft: C.muted, paused: C.orange, completed: C.blue }[s] ?? C.muted)

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Admin Nav */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: C.red + '22', border: `1px solid ${C.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🛡️</div>
          <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: F.sans, color: C.text }}>AdChasser Admin</span>
          <Badge color={C.red}>Superuser</Badge>
        </div>
        <button onClick={onExit} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>
          ← Back to Platform
        </button>
      </div>

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <Eyebrow style={{ marginBottom: '10px' }}>Platform Administration</Eyebrow>
        <h2 style={{ fontSize: '28px', fontFamily: F.display, fontWeight: 700, marginBottom: '32px' }}>Platform Overview</h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner size={32} /></div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[
                { label: 'Total Campaigns',   value: campaigns.length,  color: C.gold  },
                { label: 'Active Campaigns',  value: activeCampaigns,   color: C.green },
                { label: 'Total Responses',   value: totalResponses,    color: C.blue  },
                { label: 'Total Brands',      value: new Set(campaigns.map(c => c.brand_id)).size, color: C.purple },
              ].map(m => (
                <Card key={m.label} style={{ padding: '20px' }}>
                  <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{m.label}</p>
                  <p style={{ fontSize: '32px', fontWeight: 700, fontFamily: F.sans, color: m.color }}>{m.value}</p>
                </Card>
              ))}
            </div>

            {/* All Campaigns Table */}
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
              {campaigns.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', color: C.muted, fontFamily: F.sans, fontSize: '14px' }}>No campaigns yet.</div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export { ADMIN_EMAIL }
