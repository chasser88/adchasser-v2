import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'
import RespondNav from '../../components/respond/RespondNav.jsx'
import { useRespondent, getAvailableSurveys, getCompletionHistory } from '../../lib/useRespondent.js'

const WITHDRAWAL_TARGET = 10000

export default function RespondDashboardPage({ user }) {
  const navigate = useNavigate()
  const { respondent, earnings, loading, refetch } = useRespondent(user)
  const [surveys,        setSurveys]        = useState([])
  const [history,        setHistory]        = useState([])
  const [surveysLoading, setSurveysLoading] = useState(true)
  const [tab,            setTab]            = useState('available')

  useEffect(() => {
    if (!respondent) return
    if (!respondent.onboarding_done) { navigate('/panel/onboarding'); return }
    getAvailableSurveys(respondent).then(s => { setSurveys(s); setSurveysLoading(false) })
    getCompletionHistory(respondent.id).then(setHistory)
  }, [respondent])

  const available   = earnings?.available_balance ?? 0
  const pending     = earnings?.pending_balance   ?? 0
  const totalEarned = earnings?.total_earned      ?? 0
  const progress    = Math.min(100, (available / WITHDRAWAL_TARGET) * 100)
  const remaining   = Math.max(0, WITHDRAWAL_TARGET - available)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '28px', height: '28px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!respondent) { navigate('/panel/auth'); return null }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.sans }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .survey-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }
        @media (max-width: 640px) {
          .survey-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .stats-grid  { grid-template-columns: 1fr 1fr !important; }
          .panel-tabs  { width: 100% !important; }
          .panel-tabs button { flex: 1; padding: 8px 10px !important; font-size: 12px !important; }
        }
      `}</style>

      <RespondNav respondent={respondent} earnings={earnings} user={user} />

      <div className="panel-content-pad" style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px,4vw,40px) clamp(14px,4vw,32px)' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: 'clamp(18px,5vw,26px)', fontFamily: F.display, fontWeight: 700, marginBottom: '4px' }}>
            Welcome back, {respondent.full_name?.split(' ')[0] ?? 'Respondent'} 👋
          </h2>
          <p style={{ fontSize: '13px', color: C.muted }}>
            {surveys.length > 0
              ? `${surveys.length} survey${surveys.length !== 1 ? 's' : ''} available for you`
              : 'No new surveys right now — check back soon'}
          </p>
        </div>

        {/* Stats grid — 2 cols on mobile, 4 on desktop */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Balance',   value: `₦${available.toLocaleString()}`,   color: C.gold,   sub: available >= WITHDRAWAL_TARGET ? '✓ Ready' : `₦${remaining.toLocaleString()} left` },
            { label: 'Pending',   value: `₦${pending.toLocaleString()}`,     color: C.blue,   sub: 'In review' },
            { label: 'Earned',    value: `₦${totalEarned.toLocaleString()}`, color: C.green,  sub: `${history.filter(h => h.payment_status === 'credited').length} done` },
            { label: 'Surveys',   value: surveys.length.toString(),           color: '#a855f7', sub: 'Available' },
          ].map(m => (
            <div key={m.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 14px' }}>
              <p style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 700, color: m.color, marginBottom: '3px', fontFamily: F.display, lineHeight: 1 }}>{m.value}</p>
              <p style={{ fontSize: '10px', color: m.label === 'Balance' && available >= WITHDRAWAL_TARGET ? C.green : C.muted, lineHeight: 1.3 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Withdrawal progress */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600 }}>Withdrawal Progress</p>
            <p style={{ fontSize: '12px', color: C.gold, fontWeight: 600 }}>₦{available.toLocaleString()} / ₦{WITHDRAWAL_TARGET.toLocaleString()}</p>
          </div>
          <div style={{ height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden', marginBottom: '7px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? `linear-gradient(90deg,${C.green},${C.green}CC)` : `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
          </div>
          {available >= WITHDRAWAL_TARGET
            ? <p style={{ fontSize: '12px', color: C.green, fontWeight: 600 }}>🎉 Ready to withdraw!{' '}
                <button onClick={() => navigate('/panel/wallet')} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', fontFamily: F.sans }}>Withdraw now →</button>
              </p>
            : <p style={{ fontSize: '12px', color: C.muted }}>Complete {Math.ceil(remaining / 1000)} more survey{Math.ceil(remaining / 1000) !== 1 ? 's' : ''} to unlock withdrawal</p>
          }
        </div>

        {/* Tabs */}
        <div className="panel-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: C.surface, borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {[{ key: 'available', label: `Available (${surveys.length})` }, { key: 'history', label: `Completed (${history.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', background: tab === t.key ? C.card : 'transparent', color: tab === t.key ? C.text : C.muted, fontSize: '13px', fontWeight: tab === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Available surveys */}
        {tab === 'available' && (
          surveysLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: C.muted }}>
              <div style={{ width: '28px', height: '28px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: '13px' }}>Finding surveys for you…</p>
            </div>
          ) : surveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📭</div>
              <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '8px' }}>No surveys right now</h3>
              <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7, maxWidth: '320px', margin: '0 auto' }}>
                New surveys are added regularly. Check back daily — each survey earns you ₦1,000.
              </p>
            </div>
          ) : (
            <div className="survey-grid">
              {surveys.map(survey => (
                <SurveyCard key={survey.id} survey={survey} onStart={() => navigate(`/survey/${survey.survey_slug}`)} />
              ))}
            </div>
          )
        )}

        {/* History */}
        {tab === 'history' && (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📝</div>
              <h3 style={{ fontSize: '17px', fontFamily: F.display, fontWeight: 700, marginBottom: '8px' }}>No surveys completed yet</h3>
              <p style={{ fontSize: '13px', color: C.muted }}>Complete your first survey to start earning!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(item => <HistoryCard key={item.id} item={item} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function SurveyCard({ survey, onStart }) {
  const brand = survey.brands
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
      {/* Brand header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        {brand?.logo_url
          ? <img src={brand.logo_url} alt={brand.name} style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }} />
          : <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: (brand?.color ?? C.gold) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: brand?.color ?? C.gold, fontFamily: F.sans, flexShrink: 0 }}>{brand?.logo_char ?? '?'}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand?.name ?? 'Brand Survey'}</p>
          <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Campaign survey</p>
        </div>
        <div style={{ padding: '3px 8px', background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', color: C.gold, fontWeight: 600 }}>NEW</span>
        </div>
      </div>

      {/* Survey info */}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.4 }}>{survey.name}</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', color: C.muted }}>⏱️ 8–12 min</span>
          <span style={{ fontSize: '11px', color: C.muted }}>📋 ~38 questions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '10px', color: C.muted, margin: '0 0 2px' }}>Reward</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: C.gold, fontFamily: F.display, margin: 0 }}>₦1,000</p>
          </div>
          <button onClick={onStart} style={{ padding: '11px 20px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer', touchAction: 'manipulation' }}>
            Start →
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryCard({ item }) {
  const navigate = useNavigate()
  const statusConfig = {
    approved:      { color: C.green,   label: 'Approved',      icon: '✓' },
    pending:       { color: C.gold,    label: 'Under Review',  icon: '⏳' },
    rejected:      { color: '#ef4444', label: 'Rejected',      icon: '✗' },
    retry_allowed: { color: C.blue,    label: 'Retry Allowed', icon: '↺' },
  }
  const s     = statusConfig[item.quality_status] ?? statusConfig.pending
  const brand = item.campaigns?.brands
  const canRetry = item.quality_status === 'retry_allowed' && item.campaigns?.survey_slug &&
    (!item.retry_allowed_until || new Date(item.retry_allowed_until) > new Date())

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: (brand?.color ?? C.gold) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: brand?.color ?? C.gold, flexShrink: 0 }}>
            {brand?.logo_char ?? '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.campaigns?.name ?? 'Survey'}</p>
            <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>
              {new Date(item.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              {item.quality_score > 0 && ` · ${item.quality_score}/100`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: item.payment_status === 'credited' ? C.green : C.muted, fontFamily: F.display, margin: 0 }}>
            {item.payment_status === 'credited' ? '+' : ''}₦{item.reward_amount?.toLocaleString() ?? '1,000'}
          </p>
          <span style={{ fontSize: '10px', background: s.color + '18', color: s.color, border: `1px solid ${s.color}30`, borderRadius: '8px', padding: '2px 8px', fontWeight: 600 }}>
            {s.icon} {s.label}
          </span>
          {canRetry && (
            <button onClick={() => navigate(`/survey/${item.campaigns.survey_slug}`)}
              style={{ padding: '6px 12px', background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '7px', color: C.gold, fontSize: '11px', fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }}>
              ↺ Retry
            </button>
          )}
        </div>
      </div>
      {item.quality_flags?.length > 0 && (
        <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px' }}>
          {item.quality_flags.map((flag, i) => (
            <p key={i} style={{ fontSize: '12px', color: '#f97316', margin: i > 0 ? '4px 0 0' : 0, lineHeight: 1.5 }}>⚠️ {flag.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
