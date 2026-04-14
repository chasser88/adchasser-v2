import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'

// ── Public hook — fetch a published page with its blocks ──────────
export function useCMSPage(slug) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    supabase
      .from('cms_pages')
      .select('*, cms_blocks(*)')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.cms_blocks) {
          data.cms_blocks.sort((a, b) => a.sort_order - b.sort_order)
        }
        setData(data)
        setLoading(false)
      })
  }, [slug])

  const block = useCallback((type) => {
    return data?.cms_blocks?.find(b => b.type === type)?.content ?? null
  }, [data])

  return { data, loading, block }
}

// ── Admin hook — fetch all pages with blocks ──────────────────────
export function useCMSPages() {
  const [pages,   setPages]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cms_pages')
      .select('*, cms_blocks(*)')
      .order('slug')
    if (data) {
      data.forEach(p => p.cms_blocks?.sort((a, b) => a.sort_order - b.sort_order))
      setPages(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  return { pages, loading, refetch: fetchPages }
}

// ── Brand settings ────────────────────────────────────────────────
export function useBrandSettings() {
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cms_brand_settings')
      .select('*')
      .limit(1)
      .single()
    setSettings(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { settings, loading, refetch: fetch }
}

export async function saveBrandSettings(id, payload) {
  const { error } = await supabase
    .from('cms_brand_settings')
    .update(payload)
    .eq('id', id)
  if (error) throw error
}

// ── Block mutations ───────────────────────────────────────────────
export async function saveCMSBlock(id, content) {
  const { error } = await supabase.from('cms_blocks').update({ content }).eq('id', id)
  if (error) throw error
}

export async function setCMSPagePublished(id, published) {
  const { error } = await supabase.from('cms_pages').update({ published }).eq('id', id)
  if (error) throw error
}

export async function addCMSBlock(pageId, type, content, sortOrder) {
  const { data, error } = await supabase
    .from('cms_blocks')
    .insert({ page_id: pageId, type, content, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function duplicateCMSBlock(block, sortOrder) {
  const { data, error } = await supabase
    .from('cms_blocks')
    .insert({
      page_id:    block.page_id,
      type:       block.type,
      content:    { ...block.content },
      sort_order: sortOrder,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCMSBlock(id) {
  const { error } = await supabase.from('cms_blocks').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCMSBlocks(updates) {
  for (const { id, sort_order } of updates) {
    await supabase.from('cms_blocks').update({ sort_order }).eq('id', id)
  }
}

// ── CMS image upload ──────────────────────────────────────────────
export async function uploadCMSImage(file) {
  const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'campaign-assets'
  const ext    = file.name.split('.').pop()
  const path   = `cms/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
