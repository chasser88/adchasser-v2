// useSurveyCompletion.js
// Called at the end of SurveyPage when a respondent completes a survey
// Creates the respondent_completion record, runs quality scoring, credits earnings

import { supabase } from './supabase.js'
import { computeQualityScore } from './useRespondent.js'

// Re-export so SurveyFlow can import from one place
export { computeQualityScore }

/**
 * Call this when a respondent finishes a survey
 * @param {object} params
 * @param {string} params.campaignId
 * @param {string} params.surveyResponseId  - the id from survey_responses table
 * @param {number} params.timeSpentSeconds  - total time respondent spent on survey
 * @param {array}  params.answers           - array of answer objects from survey
 * @param {number} params.expectedQuestions - total number of questions in survey
 * @returns {object} { completion, qualityResult }
 */
export async function recordSurveyCompletion({
  campaignId,
  surveyResponseId,
  timeSpentSeconds,
  answers = [],
  expectedQuestions = 38,
}) {
  // 1. Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Get the respondent profile
  const { data: respondent } = await supabase
    .from('respondents')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!respondent) return null // Not a panel respondent — anonymous survey taker

  // 3. Check if already completed this campaign
  const { data: existing } = await supabase
    .from('respondent_completions')
    .select('id, retry_count, quality_status, retry_allowed_until')
    .eq('respondent_id', respondent.id)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  // If already approved or pending — don't re-record
  if (existing?.quality_status === 'approved' || existing?.quality_status === 'pending') {
    return { completion: existing, qualityResult: null, alreadyCompleted: true }
  }

  // 4. Compute quality score
  const qualityResult = computeQualityScore({ timeSpentSeconds, answers, expectedQuestions })
  const { score, flags, passed } = qualityResult

  // 5. Determine payment and quality status
  const qualityStatus  = passed ? 'pending'  : (existing?.retry_count ?? 0) < 1 ? 'retry_allowed' : 'rejected'
  const paymentStatus  = passed ? 'pending'  : 'rejected'
  const retryAllowedUntil = qualityStatus === 'retry_allowed'
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null

  // 6. Upsert the completion record
  const completionPayload = {
    respondent_id:       respondent.id,
    campaign_id:         campaignId,
    survey_response_id:  surveyResponseId,
    completed_at:        new Date().toISOString(),
    time_spent_seconds:  timeSpentSeconds,
    quality_score:       score,
    quality_status:      qualityStatus,
    quality_flags:       flags,
    payment_status:      paymentStatus,
    retry_count:         (existing?.retry_count ?? 0) + 1,
    retry_allowed_until: retryAllowedUntil,
    respondent_notified: true,
    reward_amount:       1000,
  }

  let completion
  if (existing) {
    const { data } = await supabase
      .from('respondent_completions')
      .update(completionPayload)
      .eq('id', existing.id)
      .select()
      .single()
    completion = data
  } else {
    const { data } = await supabase
      .from('respondent_completions')
      .insert(completionPayload)
      .select()
      .single()
    completion = data
  }

  // 7. If passed — credit ₦1,000 to pending balance
  if (passed) {
    try {
      // Try RPC first
      const { error: rpcErr } = await supabase.rpc('increment_pending_balance', {
        p_respondent_id: respondent.id,
        p_amount: 1000,
      })

      if (rpcErr) {
        // RPC failed — do direct update as fallback
        const { data: earn } = await supabase
          .from('respondent_earnings')
          .select('pending_balance')
          .eq('respondent_id', respondent.id)
          .single()

        await supabase
          .from('respondent_earnings')
          .update({
            pending_balance: (earn?.pending_balance ?? 0) + 1000,
            updated_at: new Date().toISOString(),
          })
          .eq('respondent_id', respondent.id)
      }
    } catch (creditErr) {
      console.error('Credit error:', creditErr)
      // Don't block — completion record was saved, admin can reconcile
    }
  }

  return { completion, qualityResult, alreadyCompleted: false }
}

/**
 * Check if current user is a panel respondent
 * Verifies by user_id first, then email as fallback
 * Returns respondent object or null
 */
export async function getRespondentForSurvey() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Primary lookup by user_id
  let { data } = await supabase
    .from('respondents')
    .select('id, full_name, profile_score, onboarding_done, user_id, email')
    .eq('user_id', user.id)
    .maybeSingle()

  // If found but email doesn't match — fix the user_id (stale data)
  if (data && data.email && data.email !== user.email) {
    // Wrong user_id attached to this respondent — don't use it
    data = null
  }

  // Fallback: lookup by email and fix user_id if needed
  if (!data) {
    const { data: byEmail } = await supabase
      .from('respondents')
      .select('id, full_name, profile_score, onboarding_done, user_id, email')
      .eq('email', user.email)
      .maybeSingle()

    if (byEmail) {
      // Fix user_id if it's wrong or missing
      if (byEmail.user_id !== user.id) {
        await supabase
          .from('respondents')
          .update({ user_id: user.id })
          .eq('id', byEmail.id)
      }
      data = byEmail
    }
  }

  return data
}

/**
 * Check if respondent has already completed or is locked out of this campaign
 */
export async function checkSurveyEligibility(campaignId) {
  const respondent = await getRespondentForSurvey()
  if (!respondent) return { eligible: true, reason: null, isRespondent: false }

  const { data: completion } = await supabase
    .from('respondent_completions')
    .select('quality_status, retry_count, retry_allowed_until, payment_status')
    .eq('respondent_id', respondent.id)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (!completion) return { eligible: true, reason: null, isRespondent: true, respondent }

  if (completion.quality_status === 'approved' || completion.payment_status === 'credited') {
    return { eligible: false, reason: 'already_completed', isRespondent: true, respondent }
  }

  if (completion.quality_status === 'retry_allowed') {
    const retryExpired = completion.retry_allowed_until && new Date(completion.retry_allowed_until) < new Date()
    if (retryExpired) {
      return { eligible: false, reason: 'retry_expired', isRespondent: true, respondent }
    }
    return { eligible: true, reason: 'retry', isRespondent: true, respondent, completion }
  }

  if (completion.quality_status === 'rejected') {
    return { eligible: false, reason: 'rejected', isRespondent: true, respondent }
  }

  if (completion.quality_status === 'pending') {
    return { eligible: false, reason: 'pending_review', isRespondent: true, respondent }
  }

  return { eligible: true, reason: null, isRespondent: true, respondent }
}
