import { useNavigate } from 'react-router-dom'
import { C, F } from '../../tokens.js'

// Shown to ALL respondents after survey completion — good scores get reinforcement, poor scores get feedback
export default function SurveyQualityResult({ score, flags, passed, onRetry, campaignName }) {
  const navigate = useNavigate()

  const getScoreConfig = () => {
    if (score >= 90) return {
      emoji: '🏆', color: C.gold,
      title: 'Excellent Response!',
      subtitle: 'Your answers were thorough, honest and thoughtful.',
      message: 'Your ₦1,000 reward has been credited and is pending final approval. Keep it up — respondents with consistently high scores get priority access to new surveys.',
      bgColor: `${C.gold}10`,
      borderColor: `${C.gold}40`,
    }
    if (score >= 75) return {
      emoji: '✅', color: C.green,
      title: 'Great Job!',
      subtitle: 'Your response was solid and well completed.',
      message: 'Your ₦1,000 reward is pending approval. Aim for even higher scores by spending more time on each question and giving detailed open-ended answers.',
      bgColor: `${C.green}10`,
      borderColor: `${C.green}40`,
    }
    if (score >= 60) return {
      emoji: '👍', color: C.blue,
      title: 'Good Response',
      subtitle: 'Your response met the quality threshold.',
      message: 'Your ₦1,000 is pending approval. You can improve your score by avoiding repeated answers and taking your time on each question.',
      bgColor: `${C.blue}10`,
      borderColor: `${C.blue}40`,
    }
    return {
      emoji: '⚠️', color: '#f97316',
      title: 'Response Needs Improvement',
      subtitle: 'Your response did not meet our quality standard.',
      message: 'Don\'t worry — you can retake this survey once. Read each question carefully and answer honestly to earn your reward.',
      bgColor: 'rgba(249,115,22,0.08)',
      borderColor: 'rgba(249,115,22,0.3)',
    }
  }

  const config = getScoreConfig()

  const ScoreRing = () => {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    return (
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke={C.border} strokeWidth="10" />
        {/* Score ring */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Score text */}
        <text x="70" y="62" textAnchor="middle" fill={C.text} fontSize="28" fontWeight="800" fontFamily="system-ui">{score}</text>
        <text x="70" y="80" textAnchor="middle" fill={C.muted} fontSize="11" fontFamily="system-ui">out of 100</text>
        <text x="70" y="96" textAnchor="middle" fill={config.color} fontSize="10" fontWeight="700" fontFamily="system-ui">
          {score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GREAT' : score >= 60 ? 'GOOD' : 'NEEDS WORK'}
        </text>
      </svg>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: F.sans }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Score card */}
        <div style={{ background: config.bgColor, border: `1px solid ${config.borderColor}`, borderRadius: '20px', padding: '36px 32px', textAlign: 'center', marginBottom: '16px' }}>

          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{config.emoji}</div>
          <h2 style={{ fontSize: '22px', fontFamily: F.display, fontWeight: 700, marginBottom: '6px', color: C.text }}>{config.title}</h2>
          <p style={{ fontSize: '14px', color: C.muted, marginBottom: '28px', lineHeight: 1.5 }}>{config.subtitle}</p>

          {/* Animated score ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <ScoreRing />
          </div>

          {/* Score breakdown bars */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Score Breakdown</p>
            {[
              { label: 'Completion', value: 100, desc: 'Survey fully completed' },
              { label: 'Time Quality', value: flags.some(f => f.code === 'too_fast') ? 40 : 100, desc: flags.some(f => f.code === 'too_fast') ? 'Completed too quickly' : 'Good time spent' },
              { label: 'Answer Consistency', value: flags.some(f => f.code === 'straight_line') ? 30 : 100, desc: flags.some(f => f.code === 'straight_line') ? 'Repetitive answers detected' : 'Varied, honest answers' },
              { label: 'Open Responses', value: flags.some(f => f.code === 'short_answers') ? 50 : 100, desc: flags.some(f => f.code === 'short_answers') ? 'Short answers detected' : 'Detailed responses' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', color: C.text, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: item.value >= 80 ? C.green : item.value >= 50 ? C.gold : '#ef4444', fontWeight: 700 }}>
                    {item.value >= 80 ? '✓' : item.value >= 50 ? '~' : '✗'} {item.desc}
                  </span>
                </div>
                <div style={{ height: '4px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', background: item.value >= 80 ? C.green : item.value >= 50 ? C.gold : '#ef4444', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Message */}
          <div style={{ padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.7, margin: 0 }}>{config.message}</p>
          </div>

          {/* Specific flags feedback */}
          {flags.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {flags.map((flag, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '8px', marginBottom: '8px', textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', color: '#f97316', lineHeight: 1.6, margin: 0 }}>⚠️ {flag.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reward status */}
          {passed ? (
            <div style={{ padding: '12px 16px', background: `${C.green}12`, border: `1px solid ${C.green}30`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>💰</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: C.green, margin: '0 0 2px' }}>₦1,000 reward pending</p>
                <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Will appear in your wallet within 24 hours after final review</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>⏸️</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', margin: '0 0 2px' }}>Reward on hold</p>
                <p style={{ fontSize: '11px', color: C.muted, margin: 0 }}>Retake the survey carefully to earn your ₦1,000</p>
              </div>
            </div>
          )}

          {/* Tips for good respondents */}
          {score >= 75 && (
            <div style={{ padding: '12px 16px', background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '10px', marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: C.gold, fontWeight: 600, margin: '0 0 6px' }}>💡 Pro Tips to Stay at the Top</p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {['Take at least 8–10 minutes per survey', 'Give detailed answers to open-ended questions', 'Answer based on your genuine experience'].map((tip, i) => (
                  <li key={i} style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6 }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!passed && onRetry && (
            <button onClick={onRetry} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
              ↺ Retake Survey Carefully
            </button>
          )}
          <button onClick={() => navigate('/respond/dashboard')} style={{ width: '100%', padding: '13px', background: passed ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : C.surface, border: `1px solid ${passed ? 'transparent' : C.border}`, borderRadius: '10px', color: passed ? C.bg : C.text, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
            {passed ? '→ Back to Dashboard' : 'Back to Dashboard'}
          </button>
          {passed && (
            <button onClick={() => navigate('/respond/wallet')} style={{ width: '100%', padding: '13px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.muted, fontSize: '13px', fontFamily: F.sans, cursor: 'pointer' }}>
              💳 View My Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
