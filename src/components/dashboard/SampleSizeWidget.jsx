import { C, F } from '../../tokens.js'
import { getSampleAdequacy, getSampleInterpretation } from '../../lib/sampleSize.js'

export default function SampleSizeWidget({ campaign, totalResponses, onDownloadReport, exportingReport }) {
  const required   = campaign?.required_sample_size
  const reach      = campaign?.planned_reach
  const confidence = campaign?.confidence_level ?? 95
  const margin     = campaign?.margin_of_error ?? 5
  const coverage   = campaign?.coverage ?? []

  if (!required) return null

  const adequacy = getSampleAdequacy(required, totalResponses)
  if (!adequacy) return null

  const { pct, remaining, isComplete, status, color } = adequacy

  // Group coverage by country
  const coverageGrouped = coverage.reduce((acc, item) => {
    if (!acc[item.country]) acc[item.country] = []
    acc[item.country].push(item.region)
    return acc
  }, {})

  return (
    <div style={{ marginBottom: '20px' }}>

      {/* Main progress card */}
      <div style={{
        background: isComplete
          ? `linear-gradient(135deg, ${C.green}08, ${C.card})`
          : `linear-gradient(135deg, ${color}08, ${C.card})`,
        border: `1px solid ${isComplete ? C.green : color}30`,
        borderRadius: '16px',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: `radial-gradient(circle, ${color}15, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

          {/* Left: Progress info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <p style={{ fontSize: '11px', letterSpacing: '3px', color, fontFamily: F.sans, fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                Survey Progress
              </p>
              <span style={{
                background: color + '18',
                color,
                border: `1px solid ${color}30`,
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: F.sans,
              }}>{status}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '40px', fontWeight: 700, fontFamily: F.display, color, lineHeight: 1 }}>{pct}%</span>
              <span style={{ fontSize: '14px', color: C.muted, fontFamily: F.sans }}>
                {totalResponses.toLocaleString()} / {required.toLocaleString()} responses
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '8px', background: C.border, borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: isComplete
                  ? `linear-gradient(90deg, ${C.green}, ${C.green}CC)`
                  : `linear-gradient(90deg, ${color}, ${color}CC)`,
                borderRadius: '4px',
                transition: 'width 0.8s ease',
              }} />
            </div>

            {!isComplete && (
              <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, margin: 0 }}>
                <span style={{ color, fontWeight: 600 }}>{remaining.toLocaleString()} more responses needed</span> to reach statistical significance
              </p>
            )}

            {isComplete && (
              <p style={{ fontSize: '12px', color: C.green, fontFamily: F.sans, fontWeight: 600, margin: 0 }}>
                ✓ Sample target achieved — your data is statistically significant
              </p>
            )}
          </div>

          {/* Right: Stats + Download */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, margin: '0 0 2px' }}>Confidence</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: F.sans, margin: 0 }}>{confidence}%</p>
              </div>
              <div style={{ padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, margin: '0 0 2px' }}>Margin of Error</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: F.sans, margin: 0 }}>±{margin}%</p>
              </div>
              {reach && (
                <div style={{ padding: '5px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, margin: '0 0 2px' }}>Planned Reach</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: F.sans, margin: 0 }}>{Number(reach).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Download button — only shows when complete */}
            {isComplete && (
              <button
                onClick={onDownloadReport}
                disabled={exportingReport}
                style={{
                  marginTop: '4px',
                  padding: '11px 22px',
                  background: `linear-gradient(135deg, ${C.green}, ${C.green}CC)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: F.sans,
                  cursor: exportingReport ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: exportingReport ? 0.7 : 1,
                  boxShadow: `0 4px 16px ${C.green}30`,
                  whiteSpace: 'nowrap',
                }}
              >
                {exportingReport
                  ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Generating…</>
                  : '📥 Download Campaign Report'
                }
              </button>
            )}
          </div>
        </div>

        {/* Coverage summary */}
        {Object.keys(coverageGrouped).length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Coverage</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.entries(coverageGrouped).map(([country, regions]) => (
                <span key={country} style={{ fontSize: '11px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '3px 10px', color: C.muted, fontFamily: F.sans }}>
                  🌍 <strong style={{ color: C.text }}>{country}</strong> · {regions.length} region{regions.length !== 1 ? 's' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Statistical note */}
        <p style={{ fontSize: '11px', color: C.dim, fontFamily: F.sans, marginTop: '12px', lineHeight: 1.6, margin: '12px 0 0' }}>
          📐 Required sample of <strong style={{ color: C.muted }}>{required?.toLocaleString()}</strong> computed using Cochran's formula with finite population correction
          {reach ? ` for a planned reach of ${Number(reach).toLocaleString()}` : ''}.
          {' '}{confidence}% confidence · ±{margin}% margin of error.
        </p>
      </div>
    </div>
  )
}
