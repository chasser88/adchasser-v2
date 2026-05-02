/**
 * Payment helpers for AdChasser brand campaigns.
 *
 * Wraps:
 *   - Calling the initialize-payment Edge Function
 *   - Opening Paystack Inline checkout modal
 *   - Polling the campaigns table for status change after webhook fires
 *
 * Usage:
 *   const result = await payForCampaign(campaignId, {
 *     onSuccess: () => navigate('/dashboard'),
 *     onCancel: () => alert('Cancelled'),
 *     onError: (err) => alert(err.message),
 *   })
 */

import { supabase } from './supabase.js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const PAYSTACK_PK   = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

/**
 * Calls our initialize-payment Edge Function for a given campaign.
 * Returns the response data: { paymentMethod, accessCode, reference, amountKobo, pricing }.
 *
 * Special case: if the user is super-admin, the backend returns
 * paymentMethod='skipped' and the campaign is already active.
 */
export async function initializePayment(campaignId, paymentMethod = 'card') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/initialize-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey':        SUPABASE_ANON,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ campaignId, paymentMethod }),
  })

  const result = await res.json()
  if (!result.ok) {
    throw new Error(result.error?.message ?? 'Payment initialization failed')
  }
  return { ...result.data, userEmail: session.user.email }
}

/**
 * Opens Paystack Inline checkout modal with the given access code + reference.
 * Returns a promise that resolves on success or rejects on cancel/error.
 *
 * NOTE: Requires the Paystack Inline script (https://js.paystack.co/v1/inline.js)
 * to be loaded in index.html. The script exposes window.PaystackPop globally.
 */
export function openPaystackCheckout({ email, amountKobo, reference, accessCode }) {
  return new Promise((resolve, reject) => {
    if (!window.PaystackPop) {
      reject(new Error('Paystack checkout library not loaded. Reload the page and try again.'))
      return
    }
    if (!PAYSTACK_PK) {
      reject(new Error('Paystack public key not configured. Contact support.'))
      return
    }

    const handler = window.PaystackPop.setup({
      key:         PAYSTACK_PK,
      email,
      amount:      amountKobo,
      ref:         reference,
      access_code: accessCode,
      currency:    'NGN',
      onClose:     () => reject(new Error('PAYMENT_CANCELLED')),
      callback:    (response) => resolve(response),
    })
    handler.openIframe()
  })
}

/**
 * Polls the campaigns table for status change after a Paystack webhook fires.
 * Resolves with the campaign row when status becomes 'active'.
 * Rejects after maxAttempts × intervalMs total time (default ~30s).
 */
export async function pollForActivation(campaignId, { maxAttempts = 20, intervalMs = 1500 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs))
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, brands(*)')
      .eq('id', campaignId)
      .single()
    if (error) continue           // transient error — keep polling
    if (data.status === 'active') return data
  }
  throw new Error('ACTIVATION_TIMEOUT')
}

/**
 * High-level flow: initialize → open checkout → poll for activation.
 * One-shot helper for the campaign-launch happy path.
 *
 * Returns { activated: campaignRow } on success.
 * Throws on any failure (cancel, decline, timeout, network error).
 */
export async function payForCampaign(campaignId) {
  // 1. Initialize the transaction with our backend
  const init = await initializePayment(campaignId, 'card')

  // Super-admin bypass — backend already activated the campaign
  if (init.paymentMethod === 'skipped') {
    const { data } = await supabase
      .from('campaigns')
      .select('*, brands(*)')
      .eq('id', campaignId)
      .single()
    return { activated: data, bypass: true }
  }

  // 2. Open Paystack Inline modal — user pays inside it
  await openPaystackCheckout({
    email:      init.userEmail,
    amountKobo: init.amountKobo,
    reference:  init.reference,
    accessCode: init.accessCode,
  })

  // 3. Wait for backend webhook to fire and flip campaign to 'active'
  const activated = await pollForActivation(campaignId)
  return { activated, bypass: false }
}
