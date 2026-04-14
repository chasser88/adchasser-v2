import { supabase } from '../src/lib/supabase.js'

// ── Segment derivation ────────────────────────────────────────────
export function deriveSegments(answers) {
  const q = id => answers[id]
  const lifeStageMap = {
    'Early career, living independently or with others': '18–24',
    'Building — career growing, maybe a family starting': '25–34',
    'Established — settled, responsibilities are real': '35–44',
    'Peak — experienced, things are stable': '45–54',
    'Retired or winding down': '55+',
  }
  const freqMap = {
    "It's a regular — I buy it almost every time I shop": 'heavy_buyer',
    'A few times a month, depending on how things are going': 'regular_buyer',
    'Every now and then — maybe once a month or less': 'light_buyer',
    "Rarely — I've bought it before but it's not a staple": 'lapsed_buyer',
    "Honestly, I can't remember the last time I bought it": 'lapsed_buyer',
  }
  const relMap = {
    "An old friend — familiar, trusted, I don't think twice": 'loyalist',
    "Someone I've just started getting to know": 'new_user',
    "An acquaintance I see occasionally but don't think much about": 'light_user',
    "Someone I've drifted from — we used to be closer": 'lapsed',
    "A stranger — I know of them but we haven't really met": 'non_user',
    "A competitor's loyalist — I'm with someone else, honestly": 'competitor_user',
  }
  const mediaHabits = q('q1_4') ?? []
  let segment_media_habit = 'mixed'
  if (mediaHabits.some(h => h.includes('Instagram') || h.includes('TikTok'))) segment_media_habit = 'heavy_digital'
  else if (mediaHabits.some(h => h.includes('TV'))) segment_media_habit = 'tv_first'
  else if (mediaHabits.some(h => h.includes('radio') || h.includes('podcast'))) segment_media_habit = 'audio_native'
  else if (mediaHabits.some(h => h.includes('Commuting'))) segment_media_habit = 'ooh_exposed'

  const ecoMap = {
    "I treat it — I'm willing to pay for quality here": 'premium',
    "I'm value-conscious but I won't compromise too much": 'mid_tier',
    "I shop around — price matters, I compare": 'value_seeker',
    "I go for what's affordable, full stop": 'budget',
    "It varies — depends on the month, honestly": 'variable',
  }
  return {
    segment_life_stage:   lifeStageMap[q('q1_5')] ?? null,
    segment_purchase_freq: freqMap[q('q1_2')]    ?? null,
    segment_brand_rel:    relMap[q('q1_3')]       ?? null,
    segment_media_habit,
    segment_economic:     ecoMap[q('q1_6')]       ?? null,
  }
}

// ── Score computation ─────────────────────────────────────────────
export function computeScores(answers) {
  const q   = id => answers[id]
  const num = (id, fallback = 5) => Number(q(id)) || fallback

  // Recall
  const recallClarity = (num('q3_3', 5) / 10) * 40
  const relevanceMap  = { 'Yes — it spoke directly to my world': 40, 'Somewhat — parts of it felt relevant': 25, 'Not really — it felt aimed at someone else': 10, "No — this clearly wasn't made with me in mind": 0 }
  const recallRelev   = relevanceMap[q('q3_4')] ?? 15
  const noConfusion   = q('q3_5')?.answer === 'No' ? 20 : 5
  const score_recall  = Math.min(100, recallClarity + recallRelev + noConfusion)

  // Emotion — FIX: proper rounding throughout
  const emotions    = q('q4_1') ?? []
  const positiveSet = new Set(['Warm','Inspired','Joyful','Proud','Nostalgic','Hopeful','Reassured','Excited','Motivated','Curious','Entertained'])
  const posCount    = emotions.filter(e => positiveSet.has(e)).length
  const emoBase     = emotions.length > 0 ? (posCount / emotions.length) * 50 : 0
  const toneMap     = { 'Completely — it felt distinctly them': 30, "Mostly — it fits, even if it wasn't instantly obvious": 20, 'Somewhat — it could have been a few brands in this space': 10, 'Not really — it felt disconnected from what I know of them': 0, "I don't know the brand well enough to say": 10 }
  const toneScore   = toneMap[q('q4_3')] ?? 10
  const perceptionMap = { "Yes — they've gone up in my estimation": 20, 'Slightly — it nudged something, but nothing dramatic': 12, 'No — same as before, neither better nor worse': 5, 'Actually, it pulled them back a little for me': -5, "I didn't have an opinion before, but now I'm forming one": 10 }
  const perceptionScore = perceptionMap[q('q4_4')] ?? 5
  const score_emotion = Math.min(100, Math.max(0, Math.round(emoBase + toneScore + perceptionScore)))

  // Brand equity
  const meaningfulness = (num('q5_2', 5) / 10) * 35
  const salienceMap = { "First one I'd mention, without thinking": 25, 'One of a short list that comes to mind': 18, 'It comes to mind, but not immediately': 12, 'It takes a moment to place them': 6, "I wouldn't have thought of them at all": 0 }
  const salience    = salienceMap[q('q5_1')] ?? 10
  const brandPower  = (num('q5_6', 5) / 10) * 25
  const advMap      = { "I'd recommend them without hesitation": 15, "I'd say good things but probably not push them strongly": 10, "I'd be neutral — neither sell them nor dismiss them": 5, "I'd probably mention some reservations": 2, "I'd actively steer them elsewhere, if I'm honest": 0 }
  const advocacy    = advMap[q('q5_5')] ?? 5
  const score_brand_equity = Math.min(100, Math.round(meaningfulness + salience + brandPower + advocacy))

  // Purchase intent
  const considMap   = { 'It moved to the top of my list': 35, 'It was already there, and this reinforced it': 25, "It got added to my thinking — wouldn't have considered it before": 30, "It was already on my radar but this didn't really move it": 10, "It didn't factor into my thinking at all": 0 }
  const consideration = considMap[q('q6_1')] ?? 10
  const intentMap   = { 'Yes — I actively looked into it or sought it out': 35, "I thought about it but didn't act on it": 20, 'Not consciously, but I may have noticed it in-store': 10, "No — it didn't trigger any action": 0 }
  const intent      = intentMap[q('q6_2')] ?? 10
  const convMap     = { "Yes — I bought it and I think the campaign played a role": 30, 'Yes — but I would have bought it anyway': 20, "No — but I'm more likely to next time": 15, "No — and my likelihood hasn't really changed": 5, "No — and if anything, I'm less inclined": 0 }
  const conversion  = convMap[q('q6_3')] ?? 5
  const score_purchase_intent = Math.min(100, Math.round(consideration + intent + conversion))

  // Resonance
  const strengths      = (q('q7_2') ?? []).length
  const strengthScore  = Math.min(strengths * 12, 50)
  const contentMap     = { 'A story — real, emotional, characters I connect with': 50, 'Proof — show me the product doing what it claims': 40, 'Humour — make me genuinely laugh': 45, 'Community — people like me, using and loving it': 45, 'Values — show me what the brand actually stands for': 42, 'Inspiration — elevate me, give me something to aspire to': 40, 'Information — teach me something I didn\'t know': 35 }
  const contentScore   = contentMap[q('q7_5')] ?? 30
  const score_resonance = Math.min(100, Math.round(strengthScore + contentScore))

  // Exposure
  const freqMap2 = { 'Constantly — it felt like it was everywhere': 90, 'A fair amount — I noticed it more than once': 70, 'Once or twice — it showed up but didn\'t pursue me': 40, 'Barely — more of a blink-and-miss-it moment': 15 }
  const score_exposure = freqMap2[q('q2_5')] ?? 50

  return {
    score_recall:          parseFloat(score_recall.toFixed(1)),
    score_emotion:         parseFloat(score_emotion.toFixed(1)),
    score_brand_equity:    parseFloat(score_brand_equity.toFixed(1)),
    score_purchase_intent: parseFloat(score_purchase_intent.toFixed(1)),
    score_resonance:       parseFloat(score_resonance.toFixed(1)),
    score_exposure:        parseFloat(score_exposure.toFixed(1)),
  }
}

// ── Create initial response record ────────────────────────────────
export async function createResponseRecord(campaignId) {
  const { data, error } = await supabase
    .from('survey_responses')
    .insert({ campaign_id: campaignId, track: 'unknown', started_at: new Date().toISOString(), user_agent: navigator?.userAgent ?? null })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// ── Submit completed survey ───────────────────────────────────────
export async function submitSurveyResponse({ campaignId, responseId, track, answers, completionPct }) {
  const segments = deriveSegments(answers)
  const scores   = computeScores(answers)

  // Update response record
  const { error: respErr } = await supabase
    .from('survey_responses')
    .update({ track, ...segments, ...scores, completed_at: new Date().toISOString(), completion_pct: completionPct })
    .eq('id', responseId)
  if (respErr) throw respErr

  // Insert answers
  const answerRows = Object.entries(answers).map(([questionId, value]) => {
    const sectionNum = parseInt(questionId.split('_')[0].replace('q', ''), 10) || 1
    const row = { response_id: responseId, question_id: questionId, section_num: sectionNum, question_type: inferType(value) }
    if (typeof value === 'string')                                              row.answer_single  = value
    if (typeof value === 'number')                                              row.answer_numeric = value
    if (Array.isArray(value))                                                   row.answer_multi   = value
    if (typeof value === 'object' && value && !Array.isArray(value))            row.answer_json    = value
    return row
  })

  // Insert in batches of 20 to avoid payload limits
  const batchSize = 20
  for (let i = 0; i < answerRows.length; i += batchSize) {
    const batch = answerRows.slice(i, i + batchSize)
    const { error: ansErr } = await supabase.from('survey_answers').insert(batch)
    if (ansErr) console.error('Answer batch error:', ansErr)
  }

  return { responseId, scores, segments }
}

function inferType(value) {
  if (typeof value === 'string')                                return 'single'
  if (typeof value === 'number')                                return 'scale'
  if (Array.isArray(value))                                     return 'multi'
  if (typeof value === 'object' && value?.answer !== undefined) return 'yes_no_open'
  return 'json'
}

// ── Fetch campaign analytics ──────────────────────────────────────
export async function fetchCampaignAnalytics(campaignId) {
  const { data, error } = await supabase.from('campaign_analytics').select('*').eq('campaign_id', campaignId).single()
  if (error) throw error
  return data
}

// ── Fetch responses ───────────────────────────────────────────────
export async function fetchResponses(campaignId, filters = {}) {
  let q = supabase.from('survey_responses').select('*').eq('campaign_id', campaignId).not('completed_at', 'is', null).order('created_at', { ascending: false })
  if (filters.track)              q = q.eq('track', filters.track)
  if (filters.segment_life_stage) q = q.eq('segment_life_stage', filters.segment_life_stage)
  if (filters.segment_brand_rel)  q = q.eq('segment_brand_rel', filters.segment_brand_rel)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

// ── Fetch segment breakdown ───────────────────────────────────────
export async function fetchSegmentBreakdown(campaignId) {
  const { data, error } = await supabase.from('segment_analytics').select('*').eq('campaign_id', campaignId)
  if (error) throw error
  return data ?? []
}

// ── Fetch emotion data ────────────────────────────────────────────
export async function fetchEmotionData(campaignId) {
  const { data: responses } = await supabase.from('survey_responses').select('id').eq('campaign_id', campaignId).not('completed_at', 'is', null)
  if (!responses?.length) return []
  const ids = responses.map(r => r.id)
  const { data, error } = await supabase.from('survey_answers').select('answer_multi').eq('question_id', 'q4_1').in('response_id', ids)
  if (error) throw error
  const counts = {}
  data?.forEach(row => { (row.answer_multi ?? []).forEach(e => { counts[e] = (counts[e] ?? 0) + 1 }) })
  const total = responses.length
  return Object.entries(counts).map(([emotion, count]) => ({ emotion, value: Math.round((count / total) * 100) })).sort((a, b) => b.value - a.value).slice(0, 8)
}

// ── Fetch channel data ────────────────────────────────────────────
export async function fetchChannelData(campaignId) {
  const { data: responses } = await supabase.from('survey_responses').select('id, score_purchase_intent, score_resonance').eq('campaign_id', campaignId).not('completed_at', 'is', null)
  if (!responses?.length) return []
  const ids = responses.map(r => r.id)
  const { data, error } = await supabase.from('survey_answers').select('response_id, answer_multi').eq('question_id', 'q2_4').in('response_id', ids)
  if (error) throw error
  const responseMap  = Object.fromEntries(responses.map(r => [r.id, r]))
  const channelAgg   = {}
  data?.forEach(row => {
    const resp = responseMap[row.response_id]
    ;(row.answer_multi ?? []).forEach(channel => {
      if (!channelAgg[channel]) channelAgg[channel] = { reach: 0, resonanceSum: 0, purchaseSum: 0, count: 0 }
      channelAgg[channel].reach++
      channelAgg[channel].resonanceSum += resp?.score_resonance ?? 0
      channelAgg[channel].purchaseSum  += resp?.score_purchase_intent ?? 0
      channelAgg[channel].count++
    })
  })
  const total = responses.length
  return Object.entries(channelAgg).map(([channel, agg]) => ({
    channel:   channel.replace(' / ', '/').split(' —')[0].trim(),
    reach:     Math.round((agg.reach / total) * 100),
    resonance: Math.round(agg.resonanceSum / agg.count),
    purchase:  Math.round((agg.purchaseSum / agg.count) * 0.4),
  })).sort((a, b) => b.reach - a.reach).slice(0, 7)
}
