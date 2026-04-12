import { useState, useEffect, useRef } from 'react'
import { C, F } from '../../tokens.js'
import { GoldButton, ProgressBar, Badge } from '../shared/ui.jsx'

export default function AssetCarousel({ assets = [], onComplete }) {
  const [current,    setCurrent]    = useState(0)
  const [progress,   setProgress]   = useState(0)
  const [playing,    setPlaying]    = useState(false)
  const [viewed,     setViewed]     = useState(new Set())
  const [staticTime, setStaticTime] = useState(0)
  const videoRef    = useRef(null)
  const audioRef    = useRef(null)
  const intervalRef = useRef(null)

  const assetList = assets.length ? assets : [
    { id: 'm1', asset_type: 'video',  label: 'TVC — 30 Seconds',   public_url: null },
    { id: 'm2', asset_type: 'audio',  label: 'Radio — 30 Seconds', public_url: null },
    { id: 'm3', asset_type: 'static', label: 'OOH — Billboard',    public_url: null },
  ]

  const asset      = assetList[current]
  const isMock     = !asset?.public_url
  const isLast     = current === assetList.length - 1
  const STATIC_MIN = 5
  const VIDEO_MIN  = 80

  const canProceed = () => {
    if (asset.asset_type === 'static') return staticTime >= STATIC_MIN
    if (asset.asset_type === 'video' || asset.asset_type === 'audio') return progress >= VIDEO_MIN
    return true
  }

  // Static timer
  useEffect(() => {
    if (asset?.asset_type !== 'static') return
    setStaticTime(0)
    const t = setInterval(() => setStaticTime(s => s >= STATIC_MIN ? s : s + 0.5), 500)
    return () => clearInterval(t)
  }, [current])

  // Mock playback
  const startMockPlay = (duration = 30) => {
    if (playing) return
    setPlaying(true)
    const step = 100 / (duration * 10)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(intervalRef.current); setPlaying(false); return 100 }
        return parseFloat((p + step).toFixed(1))
      })
    }, 100)
  }

  const stopPlay = () => { clearInterval(intervalRef.current); setPlaying(false) }

  useEffect(() => () => clearInterval(intervalRef.current), [])
  useEffect(() => { stopPlay(); setProgress(0); setPlaying(false) }, [current])

  const handleVideoProgress = () => {
    const v = videoRef.current
    if (!v) return
    const pct = (v.currentTime / v.duration) * 100
    setProgress(isNaN(pct) ? 0 : pct)
  }

  const markViewed = () => setViewed(v => new Set([...v, current]))

  const goNext = () => { markViewed(); setCurrent(c => c + 1) }

  const assetIcon = t => t === 'video' ? '🎬' : t === 'audio' ? '🔊' : '🖼️'

  return (
    <div>
      {/* Progress tracks */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '16px' }}>
        {assetList.map((a, i) => (
          <div key={a.id} style={{ flex: 1, height: '3px', borderRadius: '2px', background: viewed.has(i) ? C.green : i === current ? C.gold + '60' : C.border, transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Asset card */}
      <div style={{ background: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: '16px' }}>

        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{assetIcon(asset.asset_type)}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, color: C.text }}>{asset.label}</p>
              <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{current + 1} of {assetList.length}</p>
            </div>
          </div>
          {viewed.has(current)
            ? <Badge color={C.green}>✓ Viewed</Badge>
            : <Badge color={C.gold}>{asset.asset_type === 'static' ? `${Math.max(0, STATIC_MIN - Math.floor(staticTime))}s remaining` : `${VIDEO_MIN}% required`}</Badge>}
        </div>

        {/* ── VIDEO ── */}
        {asset.asset_type === 'video' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {!isMock && asset.public_url ? (
              <video ref={videoRef} src={asset.public_url} controls onTimeUpdate={handleVideoProgress} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                style={{ width: '100%', maxWidth: '520px', borderRadius: '10px', background: '#000' }} />
            ) : (
              <div style={{ width: '100%', maxWidth: '520px', aspectRatio: '16/9', background: 'linear-gradient(135deg, #0A0F1E, #141C35)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 40%, ${C.gold}15, transparent 60%)` }} />
                {!playing
                  ? <button onClick={() => startMockPlay(30)} style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, border: 'none', cursor: 'pointer', fontSize: '22px', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                  : <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '28px' }}>
                        {[...Array(9)].map((_, i) => <div key={i} style={{ width: '4px', background: C.gold, borderRadius: '2px', animation: `waveBar ${0.4 + i * 0.08}s ease-in-out infinite` }} />)}
                      </div>
                      <button onClick={stopPlay} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: F.sans }}>⏸ Pause</button>
                    </div>}
              </div>
            )}
            <div style={{ width: '100%', maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.muted, fontFamily: F.sans, marginBottom: '5px' }}>
                <span>{Math.round(progress * 0.3)}s / 30s</span>
                <span style={{ color: progress >= VIDEO_MIN ? C.green : C.gold }}>{Math.round(progress)}% — {progress >= VIDEO_MIN ? '✓ Threshold reached' : `${VIDEO_MIN}% required`}</span>
              </div>
              <ProgressBar value={progress} color={progress >= VIDEO_MIN ? C.green : C.blue} height={6} />
            </div>
          </div>
        )}

        {/* ── AUDIO ── */}
        {asset.asset_type === 'audio' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '100%', maxWidth: '480px', padding: '20px', background: 'linear-gradient(135deg, #0A0F1E, #141C35)', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              {!isMock && asset.public_url ? (
                <audio ref={audioRef} src={asset.public_url} controls onTimeUpdate={() => { const a = audioRef.current; if (a) setProgress((a.currentTime / a.duration) * 100) }} style={{ width: '100%' }} />
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={playing ? stopPlay : () => startMockPlay(30)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, border: 'none', cursor: 'pointer', fontSize: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {playing ? '⏸' : '▶'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: F.sans, marginBottom: '2px', color: C.text }}>{asset.label}</p>
                      <p style={{ fontSize: '11px', color: C.muted, fontFamily: F.sans }}>{Math.round(progress * 0.3)}s / 30s</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '32px', marginBottom: '10px' }}>
                    {[...Array(40)].map((_, i) => {
                      const played = (i / 40) * 100 <= progress
                      const h = 6 + Math.abs(Math.sin(i * 0.7)) * 18 + Math.abs(Math.sin(i * 1.3)) * 6
                      return <div key={i} style={{ flex: 1, height: `${h}px`, borderRadius: '1px', background: played ? C.gold : C.border, transition: 'background 0.05s' }} />
                    })}
                  </div>
                </div>
              )}
              <ProgressBar value={progress} color={progress >= VIDEO_MIN ? C.green : C.gold} height={4} />
            </div>
            <p style={{ fontSize: '12px', color: progress >= VIDEO_MIN ? C.green : C.muted, fontFamily: F.sans }}>
              {progress >= VIDEO_MIN ? '✓ 80% listened — you can continue' : 'Please listen to at least 80% before continuing'}
            </p>
          </div>
        )}

        {/* ── STATIC — Image ── */}
        {asset.asset_type === 'static' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            {!isMock && asset.public_url ? (
              <img
                src={asset.public_url}
                alt={asset.label}
                style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '10px', objectFit: 'contain' }}
              />
            ) : (
              // Mock placeholder
              <div style={{ width: '100%', maxWidth: '540px', aspectRatio: '16/9', background: 'linear-gradient(135deg, #0D1424, #1A2540)', borderRadius: '12px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${C.gold}20, transparent 60%)` }} />
                <div style={{ textAlign: 'center', zIndex: 1, padding: '28px' }}>
                  <p style={{ fontSize: '36px', fontFamily: F.display, fontWeight: 700, color: C.gold, marginBottom: '6px' }}>Feel</p>
                  <p style={{ fontSize: '46px', fontFamily: F.display, fontWeight: 700, color: C.text, marginBottom: '16px', lineHeight: 1 }}>Everything.</p>
                  <div style={{ width: '36px', height: '2px', background: C.gold, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, letterSpacing: '4px', textTransform: 'uppercase' }}>Helio</p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {staticTime < STATIC_MIN
                ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: `2px solid ${C.gold}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /><p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans }}>Take a moment — {Math.ceil(STATIC_MIN - staticTime)}s remaining</p></>
                : <p style={{ fontSize: '12px', color: C.green, fontFamily: F.sans }}>✓ Viewed — you can continue</p>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {assetList.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === current ? C.gold : viewed.has(i) ? C.green : C.border, transition: 'all 0.2s' }} />
          ))}
        </div>
        {isLast
          ? <GoldButton onClick={() => { markViewed(); onComplete() }} disabled={!canProceed()} small>Continue to Questions →</GoldButton>
          : <GoldButton onClick={goNext} disabled={!canProceed()} small>Next Asset →</GoldButton>}
      </div>
    </div>
  )
}
