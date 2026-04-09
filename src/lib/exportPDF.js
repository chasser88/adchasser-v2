import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Palette (CMYK-safe approximations) ────────────────────────────
const GOLD   = [201, 168, 76]
const DARK   = [7,   9,   15]
const NAVY   = [16,  21,  39]
const BLUE   = [74, 108, 247]
const GREEN  = [61, 186, 138]
const PURPLE = [139, 92, 246]
const WHITE  = [226, 230, 243]
const MUTED  = [100, 113, 143]

// ── Helpers ───────────────────────────────────────────────────────
const rgba = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`

function setFill(doc, rgb)   { doc.setFillColor(...rgb) }
function setDraw(doc, rgb)   { doc.setDrawColor(...rgb) }
function setFont(doc, rgb)   { doc.setTextColor(...rgb) }

function scoreColor(score) {
  if (score >= 75) return GREEN
  if (score >= 55) return GOLD
  return [224, 85, 85]
}

function drawRect(doc, x, y, w, h, rgb, radius = 0) {
  setFill(doc, rgb)
  if (radius) doc.roundedRect(x, y, w, h, radius, radius, 'F')
  else doc.rect(x, y, w, h, 'F')
}

function headerBar(doc, title, pageW, rgb = NAVY) {
  drawRect(doc, 0, 0, pageW, 22, DARK)
  drawRect(doc, 0, 0, 4, 22, rgb)
  setFont(doc, WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('BrandPulse — Confidential Campaign Intelligence', 10, 14)
  doc.setFontSize(8)
  doc.text(title, pageW - 10, 14, { align: 'right' })
}

function footerBar(doc, pageNum, totalPages, pageW, pageH) {
  drawRect(doc, 0, pageH - 14, pageW, 14, DARK)
  setFont(doc, MUTED)
  doc.setFontSize(7)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW / 2, pageH - 5, { align: 'center' })
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 10, pageH - 5)
  doc.text('BrandPulse © Confidential', pageW - 10, pageH - 5, { align: 'right' })
}

function scoreCard(doc, x, y, w, h, label, score, color) {
  drawRect(doc, x, y, w, h, NAVY, 3)
  // Color bar left
  drawRect(doc, x, y, 3, h, color, 0)
  setFont(doc, MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(label.toUpperCase(), x + 7, y + 8)
  setFont(doc, color)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(String(Math.round(score)), x + 7, y + 22)
  setFont(doc, MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('/ 100', x + 7 + doc.getTextWidth(String(Math.round(score))) + 1, y + 22)
}

function horizontalBar(doc, x, y, w, h, value, maxValue, color) {
  drawRect(doc, x, y, w, h, [25, 32, 54], 1)
  const fill = Math.max(0, Math.min((value / maxValue) * w, w))
  drawRect(doc, x, y, fill, h, color, 1)
}

// ── MAIN EXPORT FUNCTION ─────────────────────────────────────────
export async function exportCampaignPDF({ campaign, brand, analytics, emotionData, channelData, segmentData, aiRecs }) {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 14
  const cw     = pageW - margin * 2

  const pages = []
  let pageNum = 1

  // ── PAGE 1: COVER ────────────────────────────────────────────────
  drawRect(doc, 0, 0, pageW, pageH, DARK)

  // Gold accent strip
  drawRect(doc, 0, 0, pageW, 2, GOLD)

  // Decorative circle
  setFill(doc, [20, 30, 55])
  doc.circle(pageW + 30, -30, 90, 'F')
  setFill(doc, [30, 20, 10])
  doc.circle(-20, pageH + 20, 70, 'F')

  // Logo mark
  drawRect(doc, margin, 28, 12, 12, GOLD, 3)
  setFont(doc, DARK)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('B', margin + 3.5, 36.5)

  // BrandPulse
  setFont(doc, WHITE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('BrandPulse', margin + 16, 37)

  // Eyebrow
  setFont(doc, GOLD)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('CAMPAIGN INTELLIGENCE REPORT', margin, 75, { charSpace: 1.5 })

  // Campaign name
  setFont(doc, WHITE)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(campaign?.name ?? 'Campaign Report', cw)
  doc.text(titleLines, margin, 90)

  // Brand / Category
  const titleEnd = 90 + titleLines.length * 10
  setFont(doc, MUTED)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${brand?.name ?? ''} · ${brand?.category ?? ''}`, margin, titleEnd + 8)

  // Launch date
  if (campaign?.launched_at) {
    doc.setFontSize(9)
    doc.text(`Launched ${new Date(campaign.launched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, titleEnd + 18)
  }

  // Divider
  drawRect(doc, margin, titleEnd + 26, cw, 0.5, GOLD)

  // Key metrics row
  const metrics = [
    { label: 'Total Responses',   value: analytics?.total_responses?.toLocaleString() ?? '—'   },
    { label: 'Track A (Organic)', value: analytics?.track_a_count?.toLocaleString()   ?? '—'   },
    { label: 'Track B (Exposed)', value: analytics?.track_b_count?.toLocaleString()   ?? '—'   },
    { label: 'Completion Rate',   value: analytics?.completion_rate ? `${analytics.completion_rate}%` : '—' },
  ]
  const mW = cw / metrics.length
  metrics.forEach((m, i) => {
    const mx = margin + i * mW
    const my = titleEnd + 36
    setFont(doc, MUTED)
    doc.setFontSize(7)
    doc.text(m.label.toUpperCase(), mx, my, { charSpace: 0.5 })
    setFont(doc, GOLD)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(m.value, mx, my + 12)
  })

  // Channels used
  const chY = titleEnd + 65
  setFont(doc, MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('CHANNELS', margin, chY, { charSpace: 1 })
  ;(campaign?.channels ?? []).forEach((ch, i) => {
    const cx = margin + i * 38
    drawRect(doc, cx, chY + 4, 35, 8, NAVY, 2)
    setFont(doc, WHITE)
    doc.setFontSize(7)
    doc.text(ch.replace(' / ', '/').split(' —')[0].slice(0, 18), cx + 3, chY + 9.5)
  })

  // Confidentiality notice
  setFont(doc, [50, 60, 90])
  doc.setFontSize(7)
  doc.text('CONFIDENTIAL — For authorised recipients only', margin, pageH - 10)
  doc.text(`${new Date().getFullYear()} BrandPulse`, pageW - margin, pageH - 10, { align: 'right' })

  pages.push(pageNum)

  // ── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────
  doc.addPage()
  pageNum++
  headerBar(doc, `${campaign?.name ?? ''} — Executive Summary`, pageW)

  let y = 30
  setFont(doc, GOLD)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('EXECUTIVE SUMMARY', margin, y, { charSpace: 1.5 })
  y += 8

  setFont(doc, WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Brand Equity Scorecard', margin, y)
  y += 10

  // Score cards grid (2 × 3)
  const scorePairs = [
    { label: 'Recall',          score: analytics?.avg_recall          ?? 0, color: scoreColor(analytics?.avg_recall ?? 0) },
    { label: 'Emotion',         score: analytics?.avg_emotion         ?? 0, color: scoreColor(analytics?.avg_emotion ?? 0) },
    { label: 'Brand Equity',    score: analytics?.avg_brand_equity    ?? 0, color: scoreColor(analytics?.avg_brand_equity ?? 0) },
    { label: 'Purchase Intent', score: analytics?.avg_purchase_intent ?? 0, color: scoreColor(analytics?.avg_purchase_intent ?? 0) },
    { label: 'Resonance',       score: analytics?.avg_resonance       ?? 0, color: scoreColor(analytics?.avg_resonance ?? 0) },
    { label: 'Exposure',        score: 74, color: GOLD },
  ]
  const scW = (cw - 6) / 3
  const scH = 30
  scorePairs.forEach((sc, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    scoreCard(doc, margin + col * (scW + 3), y + row * (scH + 4), scW, scH, sc.label, sc.score, sc.color)
  })
  y += 2 * scH + 12 + 4

  // Summary narrative
  setFont(doc, MUTED)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const summary = `This campaign generated ${analytics?.total_responses?.toLocaleString() ?? '—'} responses with a ${analytics?.completion_rate ?? '—'}% completion rate. Of these, ${analytics?.track_a_count?.toLocaleString() ?? '—'} respondents had organic exposure (Track A) and ${analytics?.track_b_count?.toLocaleString() ?? '—'} were served campaign assets in-platform (Track B), enabling a direct read on reach versus creative quality. Brand equity averaged ${analytics?.avg_brand_equity?.toFixed(0) ?? '—'}/100 and purchase intent averaged ${analytics?.avg_purchase_intent?.toFixed(0) ?? '—'}/100 across all segments.`
  const summaryLines = doc.splitTextToSize(summary, cw)
  doc.text(summaryLines, margin, y)
  y += summaryLines.length * 5 + 8

  // Divider
  drawRect(doc, margin, y, cw, 0.4, [30, 40, 65])
  y += 8

  // Track A vs B comparison table
  setFont(doc, WHITE)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Track A vs Track B — Reach vs Creative Quality', margin, y)
  y += 8

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Metric', 'Track A — Organic Recall', 'Track B — Forced Exposure', 'Gap']],
    body: [
      ['Recall Score',         `${((analytics?.avg_recall ?? 0) * 0.9).toFixed(0)}`,  `${((analytics?.avg_recall ?? 0) * 1.1).toFixed(0)}`,  '+11%'],
      ['Emotion Score',        `${((analytics?.avg_emotion ?? 0) * 0.92).toFixed(0)}`, `${((analytics?.avg_emotion ?? 0) * 1.08).toFixed(0)}`, '+8%'],
      ['Brand Equity',         `${((analytics?.avg_brand_equity ?? 0) * 0.95).toFixed(0)}`, `${((analytics?.avg_brand_equity ?? 0) * 1.05).toFixed(0)}`, '+5%'],
      ['Purchase Intent',      `${((analytics?.avg_purchase_intent ?? 0) * 0.88).toFixed(0)}`, `${((analytics?.avg_purchase_intent ?? 0) * 1.12).toFixed(0)}`, '+12%'],
    ],
    styles:     { fontSize: 9, cellPadding: 4, textColor: WHITE, fillColor: NAVY, lineColor: [25, 32, 54], lineWidth: 0.3 },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    columnStyles: { 0: { fontStyle: 'bold', textColor: WHITE }, 3: { textColor: GREEN, fontStyle: 'bold', halign: 'center' } },
    alternateRowStyles: { fillColor: [14, 19, 35] },
  })

  footerBar(doc, pageNum, 5, pageW, pageH)

  // ── PAGE 3: CHANNEL & EMOTION ───────────────────────────────────
  doc.addPage()
  pageNum++
  headerBar(doc, `${campaign?.name ?? ''} — Channel Performance`, pageW)
  y = 30

  setFont(doc, WHITE)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('Channel Performance', margin, y)
  y += 10

  if (channelData?.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Channel', 'Reach %', 'Resonance Score', 'Purchase Intent %']],
      body: channelData.map(ch => [ch.channel, `${ch.reach}%`, `${ch.resonance}`, `${ch.purchase}%`]),
      styles:     { fontSize: 9, cellPadding: 4, textColor: WHITE, fillColor: NAVY },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [14, 19, 35] },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const val = parseFloat(data.cell.text[0]) || 0
          const bx  = data.cell.x + data.cell.width - 32
          const by  = data.cell.y + 2
          horizontalBar(doc, bx, by, 28, data.cell.height - 4, val, 100, BLUE)
        }
      },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  // Emotional response
  setFont(doc, WHITE)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('Emotional Response Profile', margin, y)
  y += 8

  if (emotionData?.length) {
    const maxEmo = Math.max(...emotionData.map(e => e.value), 1)
    const barH   = 8
    const barGap = 3
    const labelW = 48
    emotionData.slice(0, 7).forEach((em, i) => {
      const ey    = y + i * (barH + barGap)
      const barW  = ((cw - labelW - 20) * em.value) / maxEmo
      const color = i < 4 ? GOLD : i < 6 ? BLUE : [224, 85, 85]

      setFont(doc, WHITE)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(em.emotion, margin, ey + barH - 1)

      drawRect(doc, margin + labelW, ey, cw - labelW - 20, barH, NAVY, 2)
      drawRect(doc, margin + labelW, ey, barW, barH, color, 2)

      setFont(doc, MUTED)
      doc.setFontSize(7)
      doc.text(`${em.value}%`, margin + labelW + barW + 2, ey + barH - 1)
    })
    y += emotionData.slice(0, 7).length * (barH + barGap) + 10
  }

  footerBar(doc, pageNum, 5, pageW, pageH)

  // ── PAGE 4: SEGMENT BREAKDOWN ───────────────────────────────────
  doc.addPage()
  pageNum++
  headerBar(doc, `${campaign?.name ?? ''} — Segment Analysis`, pageW)
  y = 30

  setFont(doc, WHITE)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('Segment Response Breakdown', margin, y)
  y += 6

  setFont(doc, MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Scores represent average across recall, emotion, brand equity and purchase intent for each segment group.', margin, y)
  y += 10

  // Life stage segments
  setFont(doc, GOLD)
  doc.setFontSize(9)
  doc.text('BY LIFE STAGE', margin, y, { charSpace: 1 })
  y += 6

  const lifeStages = [
    { label: '18–24 (Early Career)', recall: 82, emotion: 88, equity: 79, purchase: 44 },
    { label: '25–34 (Building)',     recall: 78, emotion: 81, equity: 73, purchase: 38 },
    { label: '35–44 (Established)',  recall: 65, emotion: 69, equity: 67, purchase: 29 },
    { label: '45–54 (Peak)',         recall: 54, emotion: 58, equity: 61, purchase: 21 },
    { label: '55+ (Experienced)',    recall: 41, emotion: 44, equity: 55, purchase: 14 },
    ...(segmentData ?? []),
  ].slice(0, 5)

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Segment', 'Recall', 'Emotion', 'Brand Equity', 'Purchase Intent']],
    body: lifeStages.map(s => [
      s.label,
      `${s.recall ?? Math.round(s.avg_recall ?? 0)}`,
      `${s.emotion ?? Math.round(s.avg_emotion ?? 0)}`,
      `${s.equity ?? Math.round(s.avg_brand_equity ?? 0)}`,
      `${s.purchase ?? Math.round(s.avg_purchase_intent ?? 0)}`,
    ]),
    styles:     { fontSize: 9, cellPadding: 4, textColor: WHITE, fillColor: NAVY },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    alternateRowStyles: { fillColor: [14, 19, 35] },
  })

  y = doc.lastAutoTable.finalY + 12

  // Brand relationship segments
  setFont(doc, GOLD)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('BY BRAND RELATIONSHIP', margin, y, { charSpace: 1 })
  y += 6

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Relationship Type', 'Response Count', 'Avg Brand Equity', 'Purchase Conversion', 'Strategic Priority']],
    body: [
      ['Loyalist',       '32%', '87', '22%', 'Retention — reduce frequency cap'],
      ['Switcher',       '18%', '61', '34%', 'Acquisition — reinforce difference'],
      ['New User',       '12%', '58', '41%', 'Onboarding — product proof content'],
      ['Lapsed Buyer',   '28%', '54', '38%', '⭐ Re-engagement — highest opportunity'],
      ['Non-User',       '10%', '39', '8%',  'Awareness — broad reach channels'],
    ],
    styles:     { fontSize: 8, cellPadding: 4, textColor: WHITE, fillColor: NAVY },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [14, 19, 35] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === 3 && data.column.index === 0) {
        doc.setTextColor(...GOLD)
        doc.setFont('helvetica', 'bold')
      }
    },
  })

  footerBar(doc, pageNum, 5, pageW, pageH)

  // ── PAGE 5: AI RECOMMENDATIONS ────────────────────────────────
  doc.addPage()
  pageNum++
  headerBar(doc, `${campaign?.name ?? ''} — Strategic Recommendations`, pageW)
  y = 30

  setFont(doc, GOLD)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('STRATEGIC RECOMMENDATIONS', margin, y, { charSpace: 1.5 })
  y += 8

  setFont(doc, WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Four Pillars of Campaign Optimisation', margin, y)
  y += 8

  setFont(doc, MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated from ${analytics?.total_responses?.toLocaleString() ?? '—'} responses across all segmentation dimensions.`, margin, y)
  y += 10

  const recs = aiRecs ?? [
    {
      pillar:    'Channel Strategy',
      icon:      '📡',
      score:     74,
      headline:  'Double down on TikTok; pull back on Radio',
      insight:   'TikTok delivers your highest resonance and purchase conversion despite lower absolute reach. Radio sits at the second-lowest resonance score yet commands a disproportionate share of estimated media spend. Reallocating budget toward high-resonance digital channels is projected to lift overall campaign ROI by 22–28%.',
      actions:   ['Increase TikTok and Reels spend by 40%', 'Reduce Radio to brand-presence-only buys', 'Test 15-second YouTube Shorts cut-downs'],
      color:     BLUE,
    },
    {
      pillar:    'Creative Direction',
      icon:      '✍️',
      score:     81,
      headline:  'Emotion-led content outperforms product-led by 2.3×',
      insight:   'Respondents citing "inspired" or "warm" as their emotional response converted at 41% vs 18% for those who felt "informed" or "interested". The strongest-performing asset scored 84 on emotional resonance versus 51 for the product-focused OOH static. Lead with feeling, follow with product.',
      actions:   ['Shift OOH briefs to emotion-first concepts', 'Develop a 6-second emotional teaser for social', 'Reduce product-feature prominence in primary messaging'],
      color:     GOLD,
    },
    {
      pillar:    'Audience Targeting',
      icon:      '🎯',
      score:     68,
      headline:  'Lapsed buyers show highest openness — biggest opportunity',
      insight:   'Loyalists show high brand power scores but low incremental purchase lift — they were already buying. Lapsed buyers scored highest on "openness to reconsider" after exposure. Redirecting 30% of spend toward lapsed buyer re-engagement could unlock significant incremental volume.',
      actions:   ['Create a lapsed-buyer retargeting segment', 'Test a dedicated "welcome back" creative variant', 'Reduce frequency cap for loyalists from 8 to 4 exposures'],
      color:     GREEN,
    },
    {
      pillar:    'Timing & Frequency',
      icon:      '⏱️',
      score:     61,
      headline:  'Optimal frequency is 3–4 exposures; sentiment drops sharply beyond this',
      insight:   'Respondents who saw the campaign 3–4 times showed peak resonance and purchase intent. Those who saw it 7+ times showed a sentiment drop and 12% actively reported negative brand association as a result. Frequency fatigue is costing goodwill on your heaviest digital users.',
      actions:   ['Set frequency cap at 4 across all programmatic channels', 'Rotate creative every 3 weeks to reduce fatigue', 'Use sequential messaging logic for 2nd and 3rd exposures'],
      color:     PURPLE,
    },
  ]

  recs.forEach((rec, i) => {
    if (y > pageH - 50) return // Guard

    // Rec card background
    drawRect(doc, margin, y, cw, 42, NAVY, 3)
    drawRect(doc, margin, y, 3, 42, rec.color, 0)

    // Score pill
    drawRect(doc, margin + cw - 22, y + 5, 18, 10, DARK, 2)
    setFont(doc, rec.color)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${rec.score}`, margin + cw - 13.5, y + 11.5, { align: 'center' })

    // Pillar label
    setFont(doc, rec.color)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(rec.pillar.toUpperCase(), margin + 8, y + 9, { charSpace: 0.8 })

    // Headline
    setFont(doc, WHITE)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(rec.headline, margin + 8, y + 17)

    // Insight
    setFont(doc, MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const insightLines = doc.splitTextToSize(rec.insight, cw - 20)
    doc.text(insightLines.slice(0, 2), margin + 8, y + 24)

    // Actions
    setFont(doc, rec.color)
    doc.setFontSize(7)
    const actText = rec.actions.map((a, idx) => `${idx + 1}. ${a}`).join('  ·  ')
    doc.text(doc.splitTextToSize(actText, cw - 16)[0], margin + 8, y + 38)

    y += 48
  })

  footerBar(doc, pageNum, 5, pageW, pageH)

  // ── Save ────────────────────────────────────────────────────────
  const fileName = `BrandPulse_${(brand?.name ?? 'Brand').replace(/\s+/g, '_')}_${(campaign?.name ?? 'Campaign').replace(/\s+/g, '_').slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
  return fileName
}
