import { supabase } from "./supabase.js"

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || "campaign-assets"

const ALLOWED_TYPES = {
  video:  ['video/mp4', 'video/quicktime'],
  audio:  ['audio/mpeg', 'audio/wav'],
  static: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
}

export async function uploadAsset({ file, campaignId, assetType, label, sortOrder }) {
  const allowed = ALLOWED_TYPES[assetType] ?? []
  if (allowed.length && !allowed.includes(file.type)) {
    const labels = { video: 'MP4, MOV', audio: 'MP3, WAV', static: 'JPG, PNG, WEBP, SVG' }
    throw new Error(`Invalid file type for ${assetType}. Please upload: ${labels[assetType] ?? allowed.join(', ')}`)
  }

  const ext = file.name.split(".").pop()
  const path = `${campaignId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  // Insert record into campaign_assets table
  const { error: dbError } = await supabase.from('campaign_assets').insert({
    campaign_id:  campaignId,
    asset_type:   assetType,
    label:        label || file.name,
    storage_path: path,
    public_url:   publicUrl,
    file_name:    file.name,
    file_size:    file.size,
    mime_type:    file.type,
    sort_order:   sortOrder ?? 0,
  })
  if (dbError) throw dbError

  return { path, url: publicUrl }
}

export async function fetchAssets(campaignId) {
  const { data, error } = await supabase
    .from('campaign_assets')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function deleteAsset({ path, id }) {
  if (path) {
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error
  }
  if (id) {
    const { error } = await supabase.from('campaign_assets').delete().eq('id', id)
    if (error) throw error
  }
}
