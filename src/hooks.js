import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { uploadAsset as uploadAssetFn, fetchAssets, deleteAsset as deleteAssetFn } from '../lib/storage.js'
import {
  fetchResponses, fetchCampaignAnalytics,
  fetchEmotionData, fetchChannelData, fetchSegmentBreakdown,
} from '../lib/responses.js'

// ── Constants ──────────────────────────────────────────────────────
// Super-admin UUID. Mirrors the value baked into the brands_owner_full and
// campaigns_all RLS policies. Updating either side requires updating the other.
const SUPER_ADMIN_USER_ID = '4a05e9c5-005b-4dba-8160-5b3354c5df37'

// Returns the current user, or null if not authenticated.
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

function isSuperAdmin(user) {
  return user?.id === SUPER_ADMIN_USER_ID
}

// ── Utility ────────────────────────────────────────────────────────
function useAsync(asyncFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setData(await asyncFn()) }
    catch (e) { setError(e) }
    finally   { setLoading(false) }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run() }, [run])
  return { data, loading, error, refetch: run }
}

// ── BRANDS ─────────────────────────────────────────────────────────
// Lists brands owned by the current user. Super-admin sees all brands.
// Anonymous (signed-out) users get an empty list.
export function useBrands() {
  return useAsync(async () => {
    const user = await getCurrentUser()
    if (!user) return []

    let q = supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })
    if (!isSuperAdmin(user)) {
      q = q.eq('user_id', user.id)
    }
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  }, [])
}

export async function createBrand(payload) {
  // Auto-inject user_id from current session so RLS policy `brands_owner_full`
  // (USING: user_id = auth.uid() OR super-admin) accepts the insert.
  const user = await getCurrentUser()
  if (!user) throw new Error('Must be authenticated to create a brand')
  const { data, error } = await supabase
    .from('brands')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBrand(id, payload) {
  const { data, error } = await supabase.from('brands').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── CAMPAIGNS ──────────────────────────────────────────────────────
// Lists campaigns owned by the current user. Super-admin sees all campaigns.
// Anonymous (signed-out) users get an empty list.
// Optional brandId filter narrows further to a single brand's campaigns.
export function useCampaigns(brandId = null) {
  return useAsync(async () => {
    const user = await getCurrentUser()
    if (!user) return []

    let q = supabase
      .from('campaigns')
      .select('*, brands(name, category, logo_char, color)')
      .order('created_at', { ascending: false })
    if (!isSuperAdmin(user)) {
      q = q.eq('user_id', user.id)
    }
    if (brandId) q = q.eq('brand_id', brandId)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  }, [brandId])
}

export function useCampaign(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return null
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, brands(*)')
      .eq('id', campaignId)
      .single()
    if (error) throw error
    return data
  }, [campaignId])
}

export async function createCampaign(payload) {
  // Auto-inject user_id from current session so RLS policy `campaigns_all`
  // (USING: user_id = auth.uid() OR super-admin) accepts the insert.
  const user = await getCurrentUser()
  if (!user) throw new Error('Must be authenticated to create a campaign')
  const slug = generateSlug(payload.name, payload.brand_id)
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...payload, survey_slug: slug, status: 'draft', user_id: user.id })
    .select('*, brands(*)')
    .single()
  if (error) throw error
  return data
}

export async function activateCampaign(campaignId) {
  const { data, error } = await supabase
    .from('campaigns').update({ status: 'active' }).eq('id', campaignId).select().single()
  if (error) throw error
  return data
}

function generateSlug(name, brandId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${base}-${brandId?.slice(0, 6) ?? 'bp'}-${Date.now().toString(36)}`
}

// ── ASSETS ─────────────────────────────────────────────────────────
export function useAssets(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return []
    return await fetchAssets(campaignId)
  }, [campaignId])
}

export async function uploadAsset(params) {
  return await uploadAssetFn(params)
}

export async function deleteAsset(params) {
  return await deleteAssetFn(params)
}

// ── RESPONSES & ANALYTICS ─────────────────────────────────────────
export function useCampaignAnalytics(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return null
    return await fetchCampaignAnalytics(campaignId)
  }, [campaignId])
}

export function useResponses(campaignId, filters = {}) {
  const filterKey = JSON.stringify(filters)
  return useAsync(async () => {
    if (!campaignId) return []
    return await fetchResponses(campaignId, filters)
  }, [campaignId, filterKey]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useEmotionData(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return []
    return await fetchEmotionData(campaignId)
  }, [campaignId])
}

export function useChannelData(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return []
    return await fetchChannelData(campaignId)
  }, [campaignId])
}

export function useSegmentData(campaignId) {
  return useAsync(async () => {
    if (!campaignId) return []
    return await fetchSegmentBreakdown(campaignId)
  }, [campaignId])
}

// ── REALTIME SUBSCRIPTION ─────────────────────────────────────────
export function useRealtimeResponses(campaignId, onNewResponse) {
  useEffect(() => {
    if (!campaignId) return
    const channel = supabase
      .channel(`responses:${campaignId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'survey_responses',
        filter: `campaign_id=eq.${campaignId}`,
      }, payload => {
        if (payload.new?.completed_at) onNewResponse(payload.new)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [campaignId, onNewResponse])
}

// ── CAMPAIGN MUTATIONS ─────────────────────────────────────────────
export async function updateCampaign(id, payload) {
  const { data, error } = await supabase.from('campaigns').update(payload).eq('id', id).select('*, brands(name, category, logo_char, color)').single()
  if (error) throw error
  return data
}

export async function deleteCampaign(id) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw error
}
