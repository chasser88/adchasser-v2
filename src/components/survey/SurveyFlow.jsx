import { useState, useCallback, useEffect, useRef } from 'react'
import { C, F, SECTION_META } from '../../tokens.js'
import { GoldButton, GhostButton, Spinner, ProgressBar } from '../shared/ui.jsx'
import QuestionRenderer from './QuestionRenderer.jsx'
import AssetCarousel from './AssetCarousel.jsx'
import SurveyQualityResult from '../respond/SurveyQualityResult.jsx'
import { getQuestionnaire, interpolateQuestion } from '../../questions.js'
import { createResponseRecord, submitSurveyResponse } from '../../lib/responses.js'
import { getRespondentForSurvey } from '../../lib/useSurveyCompletion.js'

export default function SurveyFlow({ campaign, assets = [] }) {
  const brand     = campaign?.brands ?? {}
  const brandName = brand?.name     ?? 'this brand'
  const category  = brand?.category ?? 'this category'
  const brandType = brand?.brand_type ?? 'goods'

  const QUESTIONS = getQuestionnaire(brandType)

  const [phase,          setPhase]          = useState('intro')
  const [sectionNum,     setSectionNum]     = useState(1)
  const [questionIdx,    setQuestionIdx]    = useState(0)
  const [answers,        setAnswers]        = useState({})
  const [track,          setTrack]          = useState('unknown')
  const [assetsDone,     setAssetsDone]     = useState(false)
  const [responseId,     setResponseId]     = useState(null)
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState(null)
  const [isRespondent,   setIsRespondent]   = useState(false)
  const [qualityResult,  setQualityResult]  = useState(null)

  // Track time from survey start
  const startTimeRef = useRef(null)

  useEffect(() => {
    // Silently check if current user is a panel respondent
    getRespondentForSurvey().then(r => setIsRespondent(!!r))
  }, [])

  const allQs      = Object.values(QUESTIONS).flat()
  const answeredN  = Object.keys(answers).filter(k => {
    const v = answers[k]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)
  }).length
  const progressPct = Math.round((answeredN / allQs.length) * 100)
  const sectionQs   = (QUESTIONS[sectionNum] ?? []).map(q => interpolateQuestion(q, brandName, category))
  const q           = sectionQs[questionIdx]

  const handleStart = useCallback(async () => {
    try {
      if (campaign?.id) {
        const id = await createResponseRecord(campaign.id)
        setResponseId(id)
      }
    } catch (e) { console.error('Failed to create response record:', e) }
    startTimeRef.current = Date.now()
    setPhase('survey')
  }, [campaign?.id])

  const hasAnswer = () => {
    if (!q) return true
    if (q.type === 'asset_carousel') return assetsDone
    if (q.type === 'open')           return true
    if (q.type === 'scale')          return (answers[q.id] ?? 0) > 0
    if (q.type === 'semantic_diff')  return answers[q.id] !== undefined
    if (q.type === 'emotion_wheel')  return (answers[q.id] ?? []).length > 0
    if (q.type === 'rank')           return (answers[q.id] ?? []).length > 0
    return answers[q.id] !== undefined && answers[q.id] !== ''
  }

  const handleGateQuestion = (answer) => {
    const recalledOptions = [
      'Yes, definitely — something\'s been showing up',
      'I think so — something feels familiar but I\'m not certain',
    ]
    const newTrack = recalledOptions.includes(answer) ? 'A' : 'B'
    setTrack(newTrack)
    setAnswers(prev => ({ ...prev, [q.id]: answer }))
  }

  const advance = async () => {
    if (q?.isGate) {
      const answer = answers[q.id]
      if (answer) handleGateQuestion(answer)
    }

    const isLast = sectionNum === 7 && questionIdx === sectionQs.length - 1

    if (isLast) {
      setSubmitting(true)
      try {
        // 1. Submit survey response to main table
        const submittedId = await submitSurveyResponse({
          campaignId:    campaign?.id,
          responseId,
          track,
          answers,
          completionPct: progressPct,
        })

        // 2. Compute quality score locally — always, for all users
        const timeSpentSeconds = startTimeRef.current
          ? Math.round((Date.now() - startTimeRef.current) / 1000)
          : 0

        const answerArray = Object.entries(answers).map(([questionId, value]) => ({
          question_id:   questionId,
          answer_value:  typeof value === 'string' ? value : JSON.stringify(value),
          answer_text:   typeof value === 'string' ? value : null,
          question_type: allQs.find(aq => aq.id === questionId)?.type ?? 'unknown',
        }))

        const { computeQualityScore } = await import('../../lib/useSurveyCompletion.js')
        const localQuality = computeQualityScore({
          timeSpentSeconds,
          answers: answerArray,
          expectedQuestions: allQs.length,
        })
        setQualityResult(localQuality)

        // 3. If panel respondent — also record completion in DB for earnings
        if (isRespondent && campaign?.id) {
          try {
            const { recordSurveyCompletion } = await import('../../lib/useSurveyCompletion.js')
            await recordSurveyCompletion({
              campaignId:        campaign.id,
              surveyResponseId:  submittedId ?? responseId,
              timeSpentSeconds,
              answers:           answerArray,
              expectedQuestions: allQs.length,
            })
          } catch (e) {
            console.error('Completion record error:', e)
            // Don't block — quality result still shows
          }
        }
      } catch (e) {
        console.error('Submit error:', e)
        setError(e.message)
        // Still compute a basic score so screen shows
        setQualityResult({ score: 75, flags: [], passed: true })
      } finally {
        setSubmitting(false)
        setPhase('complete')
      }
      return
    }

    // Advance to next question
    if (questionIdx < sectionQs.length - 1) {
      const next = sectionQs[questionIdx + 1]
      if (next?.trackBOnly && track === 'A') {
        setQuestionIdx(qi => qi + 2)
        return
      }
      setQuestionIdx(qi => qi + 1)
    } else if (sectionNum < 7) {
      setSectionNum(s => s + 1)
      setQuestionIdx(0)
    }
  }

  const goBack = () => {
    if (questionIdx > 0) {
      setQuestionIdx(qi => qi - 1)
    } else if (sectionNum > 1) {
      const prevSection = QUESTIONS[sectionNum - 1] ?? []
      setSectionNum(s => s - 1)
      setQuestionIdx(prevSection.length - 1)
    }
  }

  const handleRetry = () => {
    setPhase('intro')
    setAnswers({})
    setSectionNum(1)
    setQuestionIdx(0)
    setTrack('unknown')
    setAssetsDone(false)
    setQualityResult(null)
    startTimeRef.current = null
  }

  const isLast  = sectionNum === 7 && questionIdx === sectionQs.length - 1
  const section = SECTION_META[sectionNum - 1] ?? SECTION_META[0]

  // ── INTRO ──────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: C.bg }}>
      <style>{`.fade-up{animation:fadeUp 0.4s ease forwards}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="fade-up" style={{ maxWidth: '480px', textAlign: 'center' }}>
        {brand.logo_url && (
          <img src={brand.logo_url} alt={brandName} style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '20px' }} />
        )}
        <p style={{ fontSize: '11px', letterSpacing: '3px', color: C.gold, fontFamily: F.sans, fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase' }}>
          Brand Research Survey
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontFamily: F.display, fontWeight: 700, marginBottom: '16px', lineHeight: 1.15 }}>
          We'd love to hear<br />what you think.
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 15px)', color: C.muted, fontFamily: F.sans, lineHeight: 1.8, marginBottom: '28px' }}>
          This isn't a test — there are no right answers here. We just want to understand your world a little better. Take your time, be honest, and say whatever feels true.
          <br /><br />
          <strong style={{ color: C.text }}>About 10–12 minutes.</strong> {Object.values(QUESTIONS).flat().length} questions across 7 themes.
        </p>

        {/* Panel reward notice — only shown to panel respondents */}
        {isRespondent && (
          <div style={{ padding: '12px 16px', background: C.goldDim, border: `1px solid ${C.gold}30`, borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
            <span style={{ fontSize: '22px' }}>💰</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.gold, fontFamily: F.sans, margin: '0 0 2px' }}>Earn ₦1,000 for this survey</p>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans, margin: 0 }}>Take your time and answer honestly to qualify for your reward.</p>
            </div>
          </div>
        )}

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
  if (phase === 'complete') {
    // Always show quality score result screen — for everyone
    if (qualityResult) {
      return (
        <SurveyQualityResult
          score={qualityResult.score}
          flags={qualityResult.flags}
          passed={qualityResult.passed}
          campaignName={campaign?.name}
          isRespondent={isRespondent}
          onRetry={!qualityResult.passed ? handleRetry : null}
        />
      )
    }

    // Fallback — only shown if qualityResult somehow failed to set
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: C.bg }}>
        <div className="fade-up" style={{ maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '18px' }}>🎯</div>
          <p style={{ fontSize: '11px', letterSpacing: '3px', color: C.green, fontFamily: F.sans, fontWeight: 600, marginBottom: '14px', textTransform: 'uppercase' }}>
            Submitted · Thank You
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Your voice matters.</h1>
          <p style={{ fontSize: '15px', color: C.muted, fontFamily: F.sans, lineHeight: 1.8, marginBottom: '28px' }}>
            {`Your answers will help shape how ${brandName} communicates with people like you.`}
          </p>
          {isRespondent && (
            <button onClick={() => window.location.href = '/panel/dashboard'} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, border: 'none', borderRadius: '10px', color: C.bg, fontSize: '14px', fontWeight: 700, fontFamily: F.sans, cursor: 'pointer' }}>
              → Back to Dashboard
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── SURVEY ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 20px) 80px', background: C.bg, minHeight: '100vh' }}>
      <style>{`.fade-up{animation:fadeUp 0.3s ease forwards}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes waveBar{0%,100%{height:6px}50%{height:22px}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: F.sans, marginBottom: '7px' }}>
          <span style={{ color: section.color, fontWeight: 600 }}>{section.icon} {section.name}</span>
          <span style={{ color: C.muted }}>Q{questionIdx + 1}/{sectionQs.length} · Section {sectionNum}/7</span>
        </div>
        <ProgressBar value={progressPct} color={`linear-gradient(90deg, ${C.blue}, ${C.gold})`} height={3} />
      </div>

      {/* Panel reward reminder strip */}
      {isRespondent && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: C.goldDim, border: `1px solid ${C.gold}20`, borderRadius: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px' }}>💰</span>
          <p style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, fontWeight: 500, margin: 0 }}>
            Earning ₦1,000 · Answer carefully and honestly for full credit
          </p>
        </div>
      )}

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
              {q.isNPS && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: C.gold + '15', border: `1px solid ${C.gold}30`, marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: C.gold, fontFamily: F.sans, fontWeight: 600 }}>Net Promoter Score</span>
                </div>
              )}
              <h2 style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontFamily: F.sans, fontWeight: 600, marginBottom: '18px', lineHeight: 1.5 }}>{q.text}</h2>
              <QuestionRenderer q={q} answers={answers} setAnswers={setAnswers} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                {(sectionNum > 1 || questionIdx > 0) && <GhostButton onClick={goBack}>← Back</GhostButton>}
                <GoldButton onClick={advance} disabled={!hasAnswer() || submitting} style={{ flex: 1 }}>
                  {submitting
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner size={14} color={C.bg} /> Submitting...</span>
                    : isLast ? 'Submit →' : 'Continue →'}
                </GoldButton>
              </div>
            </>
          )}
        </div>
      )}

      {/* Section progress dots */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {SECTION_META.map((s, i) => (
          <div key={s.id} style={{ height: '3px', flex: 1, maxWidth: '36px', borderRadius: '2px', background: i + 1 < sectionNum ? s.color : i + 1 === sectionNum ? s.color + '55' : C.border, transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}
