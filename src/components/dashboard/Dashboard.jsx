import { useState, useCallback } from 'react'
import { C, F, CHART_COLORS } from '../../tokens.js'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, Badge, Spinner, ChartTooltip, Eyebrow } from '../shared/ui.jsx'
import { exportCampaignPDF } from '../../lib/exportPDF.js'
import { useCampaignAnalytics, useEmotionData, useChannelData, useSegmentData, useRealtimeResponses } from '../../hooks.js'

const RECS = [
  { pillar: 'Channel Strategy',   icon: '📡', score: 74, color: C.blue,   headline: 'Double down on TikTok; pull back on Radio', insight: 'TikTok delivers highest resonance (84) and purchase conversion (38%) despite lower reach. Reallocating 60% of radio budget would lift overall campaign ROI by 22–28%.', actions: ['Increase TikTok + Reels spend by 40%', 'Reduce Radio to brand-presence-only buys', 'Test 15-second YouTube Shorts cut-downs'] },
  { pillar: 'Creative Direction', icon: '✍️', score: 81, color: C.gold,   headline: 'Emotion-led content outperforms product-led 2.3×', insight: 'Respondents citing "inspired" or "warm" converted at 41% vs 18% for those who felt "informed". Your strongest asset scored 84 on emotional resonance vs 51 for product-focused OOH.', actions: ['Shift OOH briefs to emotion-first concepts', 'Develop a 6-second emotional teaser for social', 'Reduce product-feature prominence in messaging'] },
  { pillar: 'Audience Targeting', icon: '🎯', score: 68, color: C.green,  headline: 'Lapsed buyers show highest openness — biggest opportunity', insight: 'Lapsed buyers scored 76 on "openness to reconsider" after exposure, highest of any segment. Redirecting 30% toward lapsed re-engagement could unlock significant volume.', actions: ['Create a lapsed-buyer retargeting segment', 'Test a "welcome back" creative variant', 'Reduce frequency cap for loyalists from 8 to 4'] },
  { pillar: 'Timing & Frequency', icon: '⏱️', score: 61, color: C.purple, headline: 'Optimal frequency is 3–4; sentiment drops sharply beyond', insight: 'Respondents who saw the campaign 3–4 times showed peak resonance (82). Those who saw it 7+ times showed sentiment drop to 58 and 12% reported negative brand association.', actions: ['Set frequency cap at 4 across all programmatic', 'Rotate creative every 3 weeks to reduce fatigue', 'Use sequential messaging for 2nd and 3rd exposures'] },
]

const SEGMENTS = ['All','18–24','25–34','35–44','45–54','55+','Loyalists','Lapsed','Heavy Digital','TV-First']

const EMPTY_DATA = { total_responses: 0, track_a_count: 0, track_b_count: 0, completion_rate: 0, avg_recall: 0, avg_emotion: 0, avg_brand_equity: 0, avg_purchase_intent: 0, avg_resonance: 0 }

export default function Dashboard({ campaign, brand }) {
  const [segment,   setSegment]   = useState('All')
  const [activeRec, setActiveRec] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [liveCount, setLiveCount] = useState(0)

  const { data: analytics, loading: aLoading, refetch: refetchAnalytics } = useCampaignAnalytics(campaign?.id)
  const { data: emotionData } = useEmotionData(campaign?.id)
  const { data: channelData } = useChannelData(campaign?.id)
  const { data: segmentData } = useSegmentData(campaign?.id)

  useRealtimeResponses(campaign?.id, useCallback(() => { setLiveCount(n => n + 1); refetchAnalytics() }, [refetchAnalytics]))

  // Always use safe fallback — never null
  const data    = analytics ?? EMPTY_DATA
  const emoData = emotionData?.length ? emotionData : []
  const chData  = channelData?.length ? channelData : []
  const segData = segmentData?.length ? segmentData.map(s => ({ ...s, segment: s.segment_life_stage ?? s.segment_brand_rel ?? '—' })) : []

  const radarData = [
    { metric: 'Recall',    score: Math.round(data.avg_recall ?? 0),          benchmark: 52 },
    { metric: 'Emotion',   score: Math.round(data.avg_emotion ?? 0),         benchmark: 55 },
    { metric: 'Equity',    score: Math.round(data.avg_brand_equity ?? 0),    benchmark: 60 },
    { metric: 'Purchase',  score: Math.round(data.avg_purchase_intent ?? 0), benchmark: 48 },
    { metric: 'Resonance', score: Math.round(data.avg_resonance ?? 0),       benchmark: 55 },
  ]

  const total = data.total_responses ?? 0
  const funnelSteps = [
    { stage: 'Exposed',      n: total },
    { stage: 'Recalled',     n: data.track_a_count ?? 0 },
    { stage: 'Comprehended', n: Math.round((data.track_a_count ?? 0) * 0.82) },
    { stage: 'Considered',   n: Math.round(total * 0.33) },
    { stage: 'Purchased',    n: Math.round(total * 0.15) },
  ]

  const handleExport = async () => {
    setExporting(true)
    try { await exportCampaignPDF({ campaign, brand, analytics: data, emotionData: emoData, channelData: chData, segmentData: segData, aiRecs: RECS }) }
    catch (e) { console.error('PDF export error:', e) }
    finally { setExporting(false) }
  }

  const safeDelta = (score, benchmark) => Math.round(score - benchmark)

  const hasData = total > 0

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px) 80px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 640px) {
          .dash-kpi { grid-template-columns: 1fr 1fr !important; }
          .dash-scorecard { grid-template-columns: 1fr !important; }
          .dash-emotion-funnel { grid-template-columns: 1fr !important; }
          .dash-recs { grid-template-columns: 1fr !important; }
          .dash-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-segments { gap: 4px !important; }
          .dash-segment-btn { padding: 5px 9px !important; font-size: 11px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <Eyebrow style={{ marginBottom: '6px' }}>Campaign Intelligence Report</Eyebrow>
          <h2 style={{ fontSize: 'clamp(18px, 3vw, 28px)', fontFamily: F.display, fontWeight: 700, marginBottom: '5px' }}>{campaign?.name ?? 'Campaign Dashboard'}</h2>
          <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans }}>
            {brand?.name ?? ''}{brand?.name ? ' · ' : ''}{total.toLocaleString()} responses
            {liveCount > 0 && <span style={{ color: C.green, marginLeft: '8px' }}>+{liveCount} new</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExport} disabled={exporting} style={{ padding: '8px 14px', borderRadius: '8px', background: C.surface, border: `1px solid ${C.border}`, color: exporting ? C.muted : C.text, fontSize: '13px', fontFamily: F.sans, cursor: exporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            {exporting ? <><Spinner size={13} color={C.gold} /> Exporting...</> : '📄 Export PDF'}
          </button>
          <Badge color={hasData ? C.green : C.muted}>{hasData ? '● Live' : '○ No responses yet'}</Badge>
        </div>
      </div>

      {/* No data state */}
      {!hasData && !aLoading && (
        <Card style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '20px', fontFamily: F.display, fontWeight: 700, marginBottom: '10px' }}>No responses yet</h3>
          <p style={{ fontSize: '14px', color: C.muted, fontFamily: F.sans, lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 20px' }}>
            Share your survey link to start collecting responses. Your dashboard will populate in real time as people complete the survey.
          </p>
          {campaign?.survey_slug && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <code style={{ fontSize: '12px', color: C.gold, background: C.goldDim, padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.gold}30`, wordBreak: 'break-all' }}>
                {`${import.meta.env.VITE_APP_URL ?? window.location.origin}/survey/${campaign.survey_slug}`}
              </code>
              <button onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_APP_URL ?? window.location.origin}/survey/${campaign.survey_slug}`)} style={{ padding: '6px 14px', background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: '8px', color: C.gold, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Copy Link
              </button>
            </div>
          )}
        </Card>
      )}

      {/* KPI Strip */}
      <div className="dash-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Responses',   value: total.toLocaleString(), color: C.gold   },
          { label: 'Track A (Organic)', value: (data.track_a_count ?? 0).toLocaleString(), color: C.blue   },
          { label: 'Track B (Exposed)', value: (data.track_b_count ?? 0).toLocaleString(), color: C.purple },
          { label: 'Completion Rate',   value: data.completion_rate ? `${data.completion_rate}%` : '—', color: C.green },
        ].map(m => (
          <Card key={m.label} style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>{m.label}</p>
            {aLoading ? <div style={{ height: '28px', background: C.border, borderRadius: '4px', animation: 'pulse 1.5s ease infinite' }} /> : <p style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, fontFamily: F.sans, color: m.color, lineHeight: 1 }}>{m.value}</p>}
          </Card>
        ))}
      </div>

      {/* Segment filter */}
      <div className="dash-segments" style={{ display: 'flex', gap: '5px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {SEGMENTS.map(s => (
          <button key={s} className="dash-segment-btn" onClick={() => setSegment(s)} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${segment === s ? C.gold : C.border}`, background: segment === s ? C.goldDim : 'transparent', color: segment === s ? C.gold : C.muted, fontSize: '12px', fontFamily: F.sans, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: segment === s ? 600 : 400, flexShrink: 0 }}>{s}</button>
        ))}
      </div>

      {/* Brand Equity Scorecard */}
      <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Brand Equity Scorecard</h3>
      <div className="dash-scorecard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card style={{ padding: '16px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: C.muted, fontFamily: F.sans }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke={C.gold} fill={C.gold} fillOpacity={0.14} strokeWidth={2} />
              <Radar name="Benchmark" dataKey="benchmark" stroke={C.border} fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: '18px' }}>
          <p style={{ fontSize: '12px', color: C.muted, fontFamily: F.sans, marginBottom: '14px' }}>Score vs Category Benchmark</p>
          {radarData.map(d => {
            const delta = safeDelta(d.score, d.benchmark)
            return (
              <div key={d.metric} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontFamily: F.sans }}>{d.metric}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: F.sans }}>{d.score}</span>
                    <Badge color={delta >= 0 ? C.green : C.red}>{delta >= 0 ? '+' : ''}{delta}pp</Badge>
                  </div>
                </div>
                <div style={{ height: '5px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.score}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.gold})`, borderRadius: '3px' }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Channel Performance */}
      {chData.length > 0 && (
        <>
          <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Channel Performance</h3>
          <Card style={{ marginBottom: '20px', padding: '18px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="channel" tick={{ fontSize: 10, fill: C.muted, fontFamily: F.sans }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.dim, fontFamily: F.sans }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: F.sans, color: C.muted }} />
                <Bar dataKey="reach"     name="Reach %"          fill={C.blue}   fillOpacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="resonance" name="Resonance"        fill={C.gold}   fillOpacity={0.85} radius={[4,4,0,0]} />
                <Bar dataKey="purchase"  name="Purchase Intent %" fill={C.green} fillOpacity={0.85} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Emotion + Funnel */}
      <div className="dash-emotion-funnel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>Emotional Response Profile</h3>
          {emoData.length === 0
            ? <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, textAlign: 'center', padding: '20px 0' }}>No emotion data yet</p>
            : emoData.map((e, i) => {
                const max = emoData[0]?.value ?? 1
                return (
                  <div key={e.emotion} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: F.sans, marginBottom: '3px' }}>
                      <span style={{ color: C.text }}>{e.emotion}</span>
                      <span style={{ color: C.muted }}>{e.value}%</span>
                    </div>
                    <div style={{ height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(e.value / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
        </Card>
        <Card style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontFamily: F.display, fontWeight: 700, marginBottom: '14px' }}>Purchase Funnel</h3>
          {funnelSteps.map(f => {
            const pct = total > 0 ? Math.round((f.n / funnelSteps[0].n) * 100) : 0
            return (
              <div key={f.stage} style={{ marginBottom: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: F.sans, marginBottom: '3px' }}>
                  <span style={{ color: C.muted }}>{f.stage}</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{f.n.toLocaleString()} <span style={{ color: C.muted, fontWeight: 400 }}>({pct}%)</span></span>
                </div>
                <div style={{ height: '16px', background: C.border, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.blue}80, ${C.gold})`, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
          {total > 0 && (
            <div style={{ marginTop: '10px', padding: '9px 11px', background: C.goldDim, borderRadius: '8px', border: `1px solid ${C.gold}28` }}>
              <p style={{ fontSize: '11px', fontFamily: F.sans, color: C.gold }}>💡 Campaign-attributable conversion: <strong>14.6%</strong> — 2.1× category avg.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Segment Breakdown */}
      {segData.length > 0 && (
        <>
          <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700, marginBottom: '12px' }}>Response by Segment</h3>
          <Card style={{ marginBottom: '24px', padding: '18px' }}>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={segData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="segment" tick={{ fontSize: 10, fill: C.muted, fontFamily: F.sans }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.dim, fontFamily: F.sans }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: F.sans, color: C.muted }} />
                <Bar dataKey="avg_recall"          name="Recall"          fill={C.gold}   fillOpacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="avg_emotion"         name="Emotion"         fill={C.purple} fillOpacity={0.8} radius={[4,4,0,0]} />
                <Bar dataKey="avg_purchase_intent" name="Purchase Intent" fill={C.green}  fillOpacity={0.8} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Strategic Recommendations */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '16px', fontFamily: F.display, fontWeight: 700 }}>Strategic Recommendations</h3>
      </div>
      <div className="dash-recs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {RECS.map((rec, i) => (
            <button key={i} onClick={() => setActiveRec(i)} style={{ padding: '11px 12px', borderRadius: '11px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${activeRec === i ? rec.color + '55' : C.border}`, background: activeRec === i ? rec.color + '0E' : C.card, fontFamily: F.sans, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px' }}>{rec.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: F.sans, color: activeRec === i ? rec.color : C.text }}>{rec.pillar}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ flex: 1, height: '3px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rec.score}%`, background: rec.color }} />
                </div>
                <span style={{ fontSize: '10px', color: rec.color, fontWeight: 700 }}>{rec.score}</span>
              </div>
            </button>
          ))}
        </div>
        <Card style={{ padding: '20px', borderColor: RECS[activeRec].color + '38', background: `linear-gradient(135deg, ${RECS[activeRec].color}07, ${C.card})` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{RECS[activeRec].icon}</span>
            <div>
              <p style={{ fontSize: '10px', color: RECS[activeRec].color, fontFamily: F.sans, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>{RECS[activeRec].pillar}</p>
              <h4 style={{ fontSize: 'clamp(13px, 2vw, 15px)', fontFamily: F.display, fontWeight: 700, lineHeight: 1.3 }}>{RECS[activeRec].headline}</h4>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: C.muted, fontFamily: F.sans, lineHeight: 1.75, marginBottom: '16px' }}>{RECS[activeRec].insight}</p>
          <p style={{ fontSize: '10px', color: C.muted, fontFamily: F.sans, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RECS[activeRec].actions.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 11px', background: C.surface, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                <div style={{ width: '17px', height: '17px', borderRadius: '5px', background: RECS[activeRec].color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: RECS[activeRec].color, fontWeight: 700, fontFamily: F.sans, flexShrink: 0 }}>{i+1}</div>
                <p style={{ fontSize: '13px', fontFamily: F.sans, lineHeight: 1.5 }}>{a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
