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

  // Helper: get block content by type, returns null if page not published
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

// ── Admin mutations ───────────────────────────────────────────────
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

export async function deleteCMSBlock(id) {
  const { error } = await supabase.from('cms_blocks').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCMSBlocks(updates) {
  for (const { id, sort_order } of updates) {
    await supabase.from('cms_blocks').update({ sort_order }).eq('id', id)
  }
}
