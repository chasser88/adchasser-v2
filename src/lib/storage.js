import { supabase } from "./supabase.js"

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || "campaign-assets"

const ALLOWED_TYPES = {
  video:  ['video/mp4', 'video/quicktime'],
  audio:  ['audio/mpeg', 'audio/wav'],
  static: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
}

export async function uploadAsset({ file, campaignId, assetType }) {
  const allowed = ALLOWED_TYPES[assetType] ?? []
  if (allowed.length && !allowed.includes(file.type)) {
    const labels = { video: 'MP4, MOV', audio: 'MP3, WAV', static: 'JPG, PNG, WEBP, SVG' }
    throw new Error(`Invalid file type for ${assetType}. Please upload: ${labels[assetType] ?? allowed.join(', ')}`)
  }

  const ext = file.name.split(".").pop()
  const path = `${campaignId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: urlData.publicUrl }
}

export async function fetchAssets(campaignId) {
  const { data, error } = await supabase.storage.from(BUCKET).list(campaignId)
  if (error) throw error
  return data
}

export async function deleteAsset(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
