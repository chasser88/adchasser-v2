import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../tokens.js'
import RespondNav from '../components/respond/RespondNav.jsx'
import { useRespondent, getAvailableSurveys, getCompletionHistory } from '../lib/useRespondent.js'

const WITHDRAWAL_TARGET = 10000

export default function RespondDashboardPage({ user }) {
  const navigate = useNavigate()
  const { respondent, earnings, loading, refetch } = useRespondent(user)
  const [surveys,  setSurveys]  = useState([])
  const [history,  setHistory]  = useState([])
  const [surveysLoading, setSurveysLoading] = useState(true)
  const [tab, setTab] = useState('available') // available | history

  useEffect(() => {
    if (!respondent) return
    if (!respondent.onboarding_done) { navigate('/respond/onboarding'); return }

    getAvailableSurveys(respondent).then(s => { setSurveys(s); setSurveysLoading(false) })
    getCompletionHistory(respondent.id).then(setHistory)
  }, [respondent])

  const available     = earnings?.available_balance ?? 0
  const pending       = earnings?.pending_balance   ?? 0
  const totalEarned   = earnings?.total_earned      ?? 0
  const progress      = Math.min(100, (available / WITHDRAWAL_TARGET) * 100)
  const remaining     = Math.max(0, WITHDRAWAL_TARGET - available)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '28px', height: '28px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!respondent) { navigate('/respond/auth'); return null }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.sans }}>
      <RespondNav respondent={respondent} earnings={earnings} user={user} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px)' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontFamily: F.display, fontWeight: 700, marginBottom: '4px' }}>
            Welcome back, {respondent.full_name?.split(' ')[0] ?? 'Respondent'} 👋
          </h2>
          <p style={{ fontSize: '13px', color: C.muted }}>
            {surveys.length > 0
              ? `${surveys.length} survey${surveys.length !== 1 ? 's' : ''} available for you`
              : 'No new surveys right now — check back soon'}
          </p>
        </div>

        {/* Earnings cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Available Balance', value: `₦${available.toLocaleString()}`, color: C.gold, sub: available >= WITHDRAWAL_TARGET ? '✓ Ready to withdraw' : `₦${remaining.toLocaleString()} to withdrawal` },
            { label: 'Pending Approval', value: `₦${pending.toLocaleString()}`, color: C.blue, sub: 'Approves within 24hrs' },
            { label: 'Total Earned',     value: `₦${totalEarned.toLocaleString()}`, color: C.green, sub: `${history.filter(h => h.payment_status === 'credited').length} surveys completed` },
            { label: 'Surveys Available', value: surveys.length.toString(), color: C.purple, sub: 'Matched to your profile' },
          ].map(m => (
            <div key={m.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px 18px' }}>
              <p style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>{m.label}</p>
              <p style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: m.color, marginBottom: '4px', fontFamily: F.display }}>{m.value}</p>
              <p style={{ fontSize: '11px', color: m.label === 'Available Balance' && available >= WITHDRAWAL_TARGET ? C.green : C.muted }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Withdrawal progress bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans }}>Withdrawal Progress</p>
            <p style={{ fontSize: '13px', color: C.gold, fontWeight: 600 }}>₦{available.toLocaleString()} / ₦{WITHDRAWAL_TARGET.toLocaleString()}</p>
          </div>
          <div style={{ height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? `linear-gradient(90deg,${C.green},${C.green}CC)` : `linear-gradient(90deg,${C.gold},${C.goldLight})`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
          </div>
          {available >= WITHDRAWAL_TARGET
            ? <p style={{ fontSize: '12px', color: C.green, fontWeight: 600 }}>🎉 You've reached the withdrawal threshold! <button onClick={() => navigate('/respond/wallet')} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', fontFamily: F.sans }}>Withdraw now →</button></p>
            : <p style={{ fontSize: '12px', color: C.muted }}>Complete {Math.ceil(remaining / 1000)} more survey{Math.ceil(remaining / 1000) !== 1 ? 's' : ''} to unlock withdrawal</p>
          }
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: C.surface, borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {[{ key: 'available', label: `Available (${surveys.length})` }, { key: 'history', label: `Completed (${history.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 18px', borderRadius: '7px', border: 'none', background: tab === t.key ? C.card : 'transparent', color: tab === t.key ? C.text : C.muted, fontSize: '13px', fontWeight: tab === t.key ? 600 : 400, fontFamily: F.sans, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Available Surveys */}
        {tab === 'available' && (
          surveysLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: C.muted }}>
              <div style={{ width: '28px', height: '28px', border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '13px', fontFamily: F.sans }}>Finding surveys for you…</p>
            </div>
          ) : surveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '8px' }}>No surveys right now</h3>
              <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.7, maxWidth: '360px', margin: '0 auto' }}>
                New surveys are added regularly. Check back daily — each survey earns you ₦1,000.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
              {surveys.map(survey => (
                <SurveyCard key={survey.id} survey={survey} onStart={() => navigate(`/survey/${survey.survey_slug}`)} />
              ))}
            </div>
          )
        )}

        {/* Completion History */}
        {tab === 'history' && (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ fontSize: '18px', fontFamily: F.display, fontWeight: 700, marginBottom: '8px' }}>No surveys completed yet</h3>
              <p style={{ fontSize: '13px', color: C.muted }}>Complete your first survey to start earning!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(item => <HistoryCard key={item.id} item={item} />)}
            </div>
          )
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SurveyCard({ survey, onStart }) {
  const brand = survey.brands
  const estimatedTime = '8–12 min'

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + '50'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>

      {/* Brand header */}
      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
        {brand?.logo_url
          ? <img src={brand.logo_url} alt={brand.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
          : <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: (brand?.color ?? C.gold) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: brand?.color ?? C.gold, fontFamily: F.sans }}>{brand?.logo_char ?? '?'}</div>
        }
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text, margin: 0 }}>{brand?.name ?? 'Brand Survey'}</p>
          <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>Campaign survey</p>
        </div>
        <div style={{ marginLeft: 'auto', padding: '3px 10px', background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: C.gold, fontWeight: 600 }}>NEW</span>
        </div>
      </div>

      {/* Survey info */}
      <div style={{ padding: '16px 18px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: F.sans, marginBottom: '8px', lineHeight: 1.4 }}>{survey.name}</h3>
        {survey.description && (
          <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6, marginBottom: '14px' }}>{survey.description.substring(0, 100)}{survey.description.length > 100 ? '…' : ''}</p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>⏱️</span>
            <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{estimatedTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>📋</span>
            <span style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>~38 questions</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, margin: '0 0 2px' }}>Reward</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: C.gold, fontFamily: F.display, margin: 0 }}>₦1,000</p>
          </div>
          <button onClick={onStart} style={{ padding: '10px 22px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '13px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
            Start Survey →
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryCard({ item }) {
  const navigate = useNavigate()
  const statusConfig = {
    approved:    { color: C.green,   label: 'Approved',      icon: '✓' },
    pending:     { color: C.gold,    label: 'Under Review',  icon: '⏳' },
    rejected:    { color: '#ef4444', label: 'Rejected',      icon: '✗' },
    retry_allowed: { color: C.blue,  label: 'Retry Allowed', icon: '↺' },
  }
  const s = statusConfig[item.quality_status] ?? statusConfig.pending
  const brand = item.campaigns?.brands
  const canRetry = item.quality_status === 'retry_allowed' &&
    item.campaigns?.survey_slug &&
    (!item.retry_allowed_until || new Date(item.retry_allowed_until) > new Date())

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: (brand?.color ?? C.gold) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: brand?.color ?? C.gold, fontFamily: F.sans, flexShrink: 0 }}>
            {brand?.logo_char ?? '?'}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, margin: '0 0 3px' }}>{item.campaigns?.name ?? 'Survey'}</p>
            <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>
              {new Date(item.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              {item.quality_score > 0 && ` · Quality score: ${item.quality_score}/100`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: item.payment_status === 'credited' ? C.green : C.muted, fontFamily: F.display, margin: '0 0 2px' }}>
              {item.payment_status === 'credited' ? '+' : ''}₦{item.reward_amount?.toLocaleString() ?? '1,000'}
            </p>
            <span style={{ fontSize: '10px', background: s.color + '18', color: s.color, border: `1px solid ${s.color}30`, borderRadius: '8px', padding: '2px 8px', fontFamily: F.sans, fontWeight: 600 }}>
              {s.icon} {s.label}
            </span>
          </div>
          {canRetry && (
            <button
              onClick={() => navigate(`/survey/${item.campaigns.survey_slug}`)}
              style={{ padding: '8px 14px', background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '8px', color: C.gold, fontSize: '12px', fontWeight: 600, fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ↺ Retry
            </button>
          )}
        </div>
      </div>
      {/* Quality flags feedback */}
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
