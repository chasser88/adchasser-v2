import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { uploadAsset as uploadAssetFn, fetchAssets, deleteAsset as deleteAssetFn } from '../lib/storage.js'
import {
  fetchResponses, fetchCampaignAnalytics,
  fetchEmotionData, fetchChannelData, fetchSegmentBreakdown,
} from '../lib/responses.js'

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
export function useBrands() {
  return useAsync(async () => {
    const { data, error } = await supabase
      .from('brands').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }, [])
}

export async function createBrand(payload) {
  const { data, error } = await supabase.from('brands').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateBrand(id, payload) {
  const { data, error } = await supabase.from('brands').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── CAMPAIGNS ──────────────────────────────────────────────────────
export function useCampaigns(brandId = null) {
  return useAsync(async () => {
    let q = supabase
      .from('campaigns')
      .select('*, brands(name, category, logo_char, color)')
      .order('created_at', { ascending: false })
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
  const slug = generateSlug(payload.name, payload.brand_id)
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...payload, survey_slug: slug, status: 'draft' })
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
