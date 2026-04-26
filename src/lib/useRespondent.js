import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'

// ── Get or create respondent profile ─────────────────────────
export function useRespondent(user) {
  const [respondent, setRespondent] = useState(undefined)
  const [earnings,   setEarnings]   = useState(null)
  const [loading,    setLoading]    = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setRespondent(null); setLoading(false); return }
    setLoading(true)

    // Primary lookup by user_id
    let { data } = await supabase
      .from('respondents')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // If not found by user_id, try by email and fix user_id
    if (!data && user.email) {
      const { data: byEmail } = await supabase
        .from('respondents')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      if (byEmail) {
        // Fix stale user_id
        await supabase
          .from('respondents')
          .update({ user_id: user.id })
          .eq('id', byEmail.id)
        data = { ...byEmail, user_id: user.id }
      }
    }

    if (data) {
      setRespondent(data)
      const { data: earn } = await supabase
        .from('respondent_earnings')
        .select('*')
        .eq('respondent_id', data.id)
        .maybeSingle()
      setEarnings(earn)
    } else {
      setRespondent(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  return { respondent, earnings, loading, refetch: fetch }
}

// ── Create respondent after auth ─────────────────────────────
export async function createRespondent(user) {
  const { data, error } = await supabase
    .from('respondents')
    .insert({
      user_id: user.id,
      email:   user.email,
      full_name: user.user_metadata?.full_name ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? '',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Update respondent profile ─────────────────────────────────
export async function updateRespondent(id, payload) {
  // Compute profile score
  const scoreFields = [
    'full_name','phone','date_of_birth','gender','state','lga',
    'education_level','employment_status','monthly_income',
    'household_size','marital_status','devices_owned',
    'social_platforms','shopping_behaviour','internet_usage'
  ]
  let score = 0
  const weights = {
    full_name: 10, phone: 15, date_of_birth: 10, gender: 5,
    state: 5, lga: 5, education_level: 5, employment_status: 5,
    monthly_income: 5, household_size: 5, marital_status: 5,
    devices_owned: 5, social_platforms: 5, shopping_behaviour: 5,
    internet_usage: 5,
  }
  const merged = { ...payload }
  scoreFields.forEach(f => {
    const val = merged[f]
    if (val && (typeof val !== 'object' || (Array.isArray(val) && val.length > 0))) {
      score += weights[f] ?? 0
    }
  })

  const isComplete = score >= 70
  const { data, error } = await supabase
    .from('respondents')
    .update({ ...payload, profile_score: score, profile_complete: isComplete, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Get available surveys for respondent ──────────────────────
export async function getAvailableSurveys(respondent) {
  if (!respondent) return []

  // Get all campaigns that are active OR have been activated
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, brands(name, logo_char, color, logo_url)')
    .in('status', ['active', 'completed'])
    .not('survey_slug', 'is', null)

  if (!campaigns?.length) return []

  // Get all completions for this respondent
  const { data: completed } = await supabase
    .from('respondent_completions')
    .select('campaign_id, quality_status, retry_allowed_until')
    .eq('respondent_id', respondent.id)

  // Build set of campaign IDs to exclude
  // Exclude: pending, approved, rejected — keep retry_allowed ONLY if window hasn't expired
  const completedIds = new Set(
    (completed ?? [])
      .filter(c => {
        if (c.quality_status === 'pending')  return true  // already submitted, awaiting review
        if (c.quality_status === 'approved') return true  // done and paid
        if (c.quality_status === 'rejected') return true  // failed twice
        if (c.quality_status === 'retry_allowed') {
          // Only exclude if retry window has expired
          if (!c.retry_allowed_until) return false // still retryable
          return new Date(c.retry_allowed_until) < new Date() // expired
        }
        return false
      })
      .map(c => c.campaign_id)
  )

  // Filter: not already completed + demographic match
  return campaigns.filter(c => {
    if (completedIds.has(c.id)) return false
    return matchesDemographic(c, respondent)
  })
}

function matchesDemographic(campaign, respondent) {
  const coverage = campaign.coverage ?? []

  // No coverage set — show to everyone
  if (!coverage.length) return true

  // If respondent has no state set — show all campaigns (profile incomplete)
  if (!respondent.state && !respondent.country) return true

  const respondentCountry = respondent.country ?? 'Nigeria'
  const respondentState   = respondent.state ?? null

  // Check if any coverage item matches respondent's location
  const countryMatch = coverage.some(c => c.country === respondentCountry)

  // If no coverage items match their country at all — don't show
  if (!countryMatch) return false

  // If respondent has a state — check state-level match
  if (respondentState) {
    return coverage.some(c =>
      c.country === respondentCountry && c.region === respondentState
    )
  }

  // Respondent has country but no state — show if country matches
  return true
}

// ── Quality score calculation ─────────────────────────────────
export function computeQualityScore({ timeSpentSeconds, answers, expectedQuestions }) {
  const flags = []
  let score = 100

  // Too fast (< 60 seconds for a full survey)
  const minTime = Math.max(60, expectedQuestions * 4)
  if (timeSpentSeconds < minTime) {
    score -= 30
    flags.push({ code: 'too_fast', message: `Survey completed too quickly (${timeSpentSeconds}s). Please take time to read and answer each question thoughtfully.` })
  }

  // Straight-lining: same answer for 5+ consecutive questions
  if (answers?.length >= 5) {
    let maxStreak = 1, streak = 1
    for (let i = 1; i < answers.length; i++) {
      if (answers[i]?.answer_value === answers[i-1]?.answer_value && answers[i]?.answer_value !== null) {
        streak++
        maxStreak = Math.max(maxStreak, streak)
      } else { streak = 1 }
    }
    if (maxStreak >= 5) {
      score -= 25
      flags.push({ code: 'straight_line', message: 'Many consecutive identical answers detected. Please re-read each question and answer honestly.' })
    }
  }

  // Incomplete open-ended responses (< 5 chars)
  const openEnded = answers?.filter(a => a.question_type === 'open' && (a.answer_text?.length ?? 0) < 5) ?? []
  if (openEnded.length > 0) {
    score -= 15
    flags.push({ code: 'short_answers', message: 'Some open-ended questions have very short answers. Please provide more detailed responses.' })
  }

  return { score: Math.max(0, score), flags, passed: score >= 60 }
}

// ── Paystack banks list ───────────────────────────────────────
export async function getPaystackBanks() {
  try {
    const res = await fetch('https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100', {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}` }
    })
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

// ── Fetch completions history ─────────────────────────────────
export async function getCompletionHistory(respondentId) {
  const { data } = await supabase
    .from('respondent_completions')
    .select('*, campaigns(name, brands(name, color, logo_char))')
    .eq('respondent_id', respondentId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ── Fetch withdrawal history ──────────────────────────────────
export async function getWithdrawalHistory(respondentId) {
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('respondent_id', respondentId)
    .order('requested_at', { ascending: false })
  return data ?? []
}

// ── Fetch saved payment methods ───────────────────────────────
export async function getPaymentMethods(respondentId) {
  const { data } = await supabase
    .from('respondent_payment_methods')
    .select('*')
    .eq('respondent_id', respondentId)
    .order('is_default', { ascending: false })
  return data ?? []
}
