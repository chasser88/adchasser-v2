import { supabase } from "./supabase.js"
const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || "campaign-assets"
export async function uploadAsset(file, campaignId) {
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
