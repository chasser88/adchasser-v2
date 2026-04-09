import { useState, useCallback } from 'react'
import { C, F, SECTION_META } from '../../tokens.js'
import { GoldButton, GhostButton, Spinner, ProgressBar } from '../shared/ui.jsx'
import QuestionRenderer from './QuestionRenderer.jsx'
import AssetCarousel from './AssetCarousel.jsx'
import { QUESTIONS, interpolateQuestion } from '../../questions.js'
import { createResponseRecord, submitSurveyResponse } from '../../lib/responses.js'

export default function SurveyFlow({ campaign, assets = [] }) {
  const brand     = campaign?.brands ?? {}
  const brandName = brand?.name     ?? 'this brand'
  const category  = brand?.category ?? 'this category'

  const [phase,       setPhase]       = useState('intro')
  const [sectionNum,  setSectionNum]  = useState(1)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [answers,     setAnswers]     = useState({})
  const [track,       setTrack]       = useState('unknown')
  const [assetsDone,  setAssetsDone]  = useState(false)
  const [responseId,  setResponseId]  = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)

  const allQs      = Object.values(QUESTIONS).flat()
  const answeredN  = Object.keys(answers).filter(k => {
    const v = answers[k]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)
  }).length
  const progressPct = Math.round((answeredN / allQs.length) * 100)

  const sectionQs = (QUESTIONS[sectionNum] ?? []).map(q => interpolateQuestion(q, brandName, category))
  const q         = sectionQs[questionIdx]

  const handleStart = useCallback(async () => {
    try {
      if (campaign?.id) {
        const id = await createResponseRecord(campaign.id)
        setResponseId(id)
      }
    } catch (e) { console.error('Failed to create response record:', e) }
    setPhase('survey')
  }, [campaign?.id])

  const hasAnswer = () => {
    if (!q) return true
    if (q.type === 'asset_carousel') return assetsDone
    if (q.type === 'open')           return true
    if (q.type === 'scale')          return (answers[q.id] ?? 0) > 0
    if (q.type === 'semantic_diff')  return answers[q.id] !== undefined
    if (q.type === 'emotion_wheel')  return (answers[q.id] ?? []).length > 0
    if (q.type === 'rank')           return true
    return answers[q.id] !== undefined && answers[q.id] !== ''
  }

  const advance = () => {
    if (q?.isGate) {
      const a = answers[q.id] ?? ''
      const isExposed = a.includes('Yes, definitely') || a.includes('something feels familiar')
      setTrack(isExposed ? 'A' : 'B')
    }
    if (questionIdx < sectionQs.length - 1) {
      const nextQ = sectionQs[questionIdx + 1]
      if (nextQ?.type === 'asset_carousel' && track === 'A') {
        setAssetsDone(true)
        setQuestionIdx(i => i + 2 < sectionQs.length ? i + 2 : i + 1)
      } else { setQuestionIdx(i => i + 1) }
    } else if (sectionNum < 7) { setSectionNum(s => s + 1); setQuestionIdx(0) }
    else { handleSubmit() }
  }

  const goBack = () => {
    if (questionIdx > 0) setQuestionIdx(i => i - 1)
    else if (sectionNum > 1) { const prev = sectionNum - 1; setSectionNum(prev); setQuestionIdx((QUESTIONS[prev] ?? []).length - 1) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (campaign?.id && responseId) {
        await submitSurveyResponse({ campaignId: campaign.id, responseId, track, answers, completionPct: progressPct })
      }
      setPhase('complete')
    } catch (e) {
      console.error('Submission error:', e)
      setError(e.message)
      setPhase('complete')
    } finally { setSubmitting(false) }
  }

  const section = SECTION_META[sectionNum - 1]
  const isLast  = sectionNum === 7 && questionIdx === sectionQs.length - 1

  // ── INTRO ──────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 48px)' }}>
      <div className="fade-up" style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: 'clamp(56px, 10vw, 72px)', height: 'clamp(56px, 10vw, 72px)', borderRadius: '20px', background: `${brand?.color ?? C.gold}20`, border: `1px solid ${brand?.color ?? C.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: brand?.color ?? C.gold, fontFamily: F.display, margin: '0 auto 24px' }}>
          {brand?.logo_char ?? brandName[0] ?? 'B'}
        </div>
        <p style={{ fontSize: '11px', letterSpacing: '4px', color: C.gold, fontFamily: F.sans, fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase' }}>{brandName} · Campaign Survey</p>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 36px)', fontFamily: F.display, fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>We want to know what you really think.</h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 15px)', color: C.muted, fontFamily: F.sans, lineHeight: 1.8, marginBottom: '28px' }}>
          This isn't a test — there are no right answers here. We just want to understand your world a little better. Take your time, be honest, and say whatever feels true.
          <br /><br />
          <strong style={{ color: C.text }}>About 10–12 minutes.</strong> 38 questions across 7 themes.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          {SECTION_META.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: s.color + '12', border: `1px solid ${s.color}28` }}>
              <span style={{ fontSize: '13px' }}>{s.icon}</span>
              <span style={{ fontSize: '11px', color: s.color, fontFamily: F.sans, fontWeight: 600 }}>{s.name.split(' ').slice(0,2).join(' ')}</span>
            </div>
          ))}
        </div>
        <GoldButton onClick={handleStart} style={{ width: '100%', padding: '15px' }}>Let's Begin →</GoldButton>
      </div>
    </div>
  )

  // ── COMPLETE ────────────────────────────────────────────────────
  if (phase === 'complete') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div className="fade-up" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '18px' }}>{error ? '⚠️' : '🎯'}</div>
        <p style={{ fontSize: '11px', letterSpacing: '3px', color: error ? C.red : C.green, fontFamily: F.sans, fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase' }}>
          {error ? 'Saved Locally' : 'Submitted · Thank You'}
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Your voice matters.</h1>
        <p style={{ fontSize: '15px', color: C.muted, fontFamily: F.sans, lineHeight: 1.8 }}>
          {error ? `Your responses have been recorded.` : `Your answers will help shape how ${brandName} communicates with people like you. Genuinely.`}
        </p>
      </div>
    </div>
  )

  // ── SURVEY ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 20px) 80px' }}>
      {/* Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: F.sans, marginBottom: '7px' }}>
          <span style={{ color: section.color, fontWeight: 600 }}>{section.icon} {section.name}</span>
          <span style={{ color: C.muted }}>Q{questionIdx + 1}/{sectionQs.length} · Section {sectionNum}/7</span>
        </div>
        <ProgressBar value={progressPct} color={`linear-gradient(90deg, ${C.blue}, ${C.gold})`} height={3} />
      </div>

      {q && (
        <div className="fade-up" key={q.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', marginBottom: '16px' }}>
          {q.type === 'asset_carousel' && !assetsDone ? (
            <>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: section.color, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Campaign Assets</p>
              <h2 style={{ fontSize: 'clamp(16px, 2vw, 19px)', fontFamily: F.sans, fontWeight: 600, marginBottom: '6px', lineHeight: 1.45 }}>{q.text}</h2>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, lineHeight: 1.6, marginBottom: '20px' }}>{q.assetInstruction}</p>
              <AssetCarousel assets={assets} onComplete={() => { setAssetsDone(true); advance() }} />
            </>
          ) : (
            <>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: section.color, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{section.icon} {section.name}</p>
              <h2 style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontFamily: F.sans, fontWeight: 600, marginBottom: '18px', lineHeight: 1.5 }}>{q.text}</h2>
              <QuestionRenderer q={q} answers={answers} setAnswers={setAnswers} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                {(sectionNum > 1 || questionIdx > 0) && <GhostButton onClick={goBack}>← Back</GhostButton>}
                <GoldButton onClick={advance} disabled={!hasAnswer() || submitting} style={{ flex: 1 }}>
                  {submitting ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner size={14} color={C.bg} /> Submitting...</span> : isLast ? 'Submit →' : 'Continue →'}
                </GoldButton>
              </div>
            </>
          )}
        </div>
      )}

      {/* Section dots */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {SECTION_META.map((s, i) => (
          <div key={s.id} style={{ height: '3px', flex: 1, maxWidth: '36px', borderRadius: '2px', background: i + 1 < sectionNum ? s.color : i + 1 === sectionNum ? s.color + '55' : C.border, transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}
