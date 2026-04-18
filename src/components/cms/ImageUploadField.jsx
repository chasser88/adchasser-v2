import { useRef, useState } from 'react'
import { C, F } from '../../tokens.js'
import { uploadCMSImage } from '../../lib/useCMS.js'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ALL_TYPES   = [...IMAGE_TYPES, ...VIDEO_TYPES]

export default function ImageUploadField({
  label,
  value,
  onChange,
  aspectRatio = '16/9',
  maxWidth = '100%',
  acceptVideo = false,
}) {
  const inputRef    = useRef()
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)

  const ALLOWED   = acceptVideo ? ALL_TYPES : IMAGE_TYPES
  const isVideo   = (url) => url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov'))
  const maxSizeMB = acceptVideo ? 50 : 5

  const handleFile = async (file) => {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      setError(acceptVideo
        ? 'Please upload JPG, PNG, WEBP, SVG, GIF or MP4'
        : 'Please upload JPG, PNG, WEBP, SVG or GIF')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const url = await uploadCMSImage(file)
      onChange(url)
    } catch (e) {
      setError(e.message)
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const accept = acceptVideo
    ? 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/quicktime,video/webm'
    : 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif'

  const lbl = {
    display: 'block', fontSize: '10px', color: C.muted, fontFamily: F.sans,
    fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px',
  }

  return (
    <div style={{ marginBottom: '12px', maxWidth }}>
      {label && <label style={lbl}>{label}</label>}

      {value ? (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}`, background: C.bg }}>
          {isVideo(value) ? (
            <video
              src={value}
              muted
              loop
              autoPlay
              playsInline
              style={{ width: '100%', aspectRatio, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={value}
              alt="Uploaded"
              style={{ width: '100%', aspectRatio, objectFit: 'cover', display: 'block' }}
            />
          )}
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '6px' }}>
            <button
              onClick={() => inputRef.current?.click()}
              style={{ padding: '5px 10px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: F.sans, backdropFilter: 'blur(8px)' }}
            >
              {uploading ? '…' : '↺ Replace'}
            </button>
            <button
              onClick={() => onChange('')}
              style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
          {isVideo(value) && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: '#fff', fontFamily: F.sans }}>
              🎬 MP4 Video
            </div>
          )}
        </div>
      ) : (
        <label
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio, borderRadius: '10px', border: `2px dashed ${C.border}`, background: C.bg, cursor: uploading ? 'not-allowed' : 'pointer', gap: '8px', transition: 'border-color 0.2s', padding: '20px' }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = C.gold }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div style={{ fontSize: '13px', color: C.gold, fontFamily: F.sans }}>Uploading…</div>
          ) : (
            <>
              <div style={{ fontSize: '28px' }}>{acceptVideo ? '🎬' : '🖼️'}</div>
              <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, textAlign: 'center', lineHeight: 1.5 }}>
                <span style={{ color: C.gold }}>Click to upload</span> or drag & drop<br />
                <span style={{ fontSize: '11px' }}>
                  {acceptVideo
                    ? 'JPG, PNG, WEBP, SVG, GIF, MP4 · max 50MB'
                    : 'JPG, PNG, WEBP, SVG · max 5MB'}
                </span>
              </p>
            </>
          )}
        </label>
      )}

      {error && <p style={{ fontSize: '11px', color: '#ef4444', fontFamily: F.sans, marginTop: '4px' }}>{error}</p>}
    </div>
  )
}
