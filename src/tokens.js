// ── Design Tokens ────────────────────────────────────────────────
export const C = {
  bg:          '#07090F',
  surface:     '#0C1018',
  card:        '#101520',
  cardHover:   '#141A27',
  border:      '#1A2035',
  borderLight: '#222A42',
  gold:        '#C9A84C',
  goldLight:   '#E8C56A',
  goldDim:     'rgba(201,168,76,0.12)',
  goldDimmer:  'rgba(201,168,76,0.06)',
  blue:        '#4A6CF7',
  blueDim:     'rgba(74,108,247,0.12)',
  text:        '#E2E6F3',
  textSoft:    '#A8B3CF',
  muted:       '#64718F',
  dim:         '#2E3650',
  red:         '#E05555',
  redDim:      'rgba(224,85,85,0.12)',
  green:       '#3DBA8A',
  greenDim:    'rgba(61,186,138,0.12)',
  purple:      '#8B5CF6',
  purpleDim:   'rgba(139,92,246,0.12)',
  teal:        '#2DD4BF',
  orange:      '#E87C4A',
}

export const F = {
  display: "'Playfair Display', Georgia, serif",
  sans:    "'DM Sans', 'Helvetica Neue', sans-serif",
}

export const CHART_COLORS = [
  C.gold, C.blue, C.green, C.purple, C.teal, C.orange, C.red,
]

export const SECTION_META = [
  { id: 1, name: 'Your World',                    icon: '👤', color: C.gold    },
  { id: 2, name: "What's Been Catching Your Eye", icon: '👁️', color: C.blue   },
  { id: 3, name: 'What Stayed With You',          icon: '🧠', color: C.purple  },
  { id: 4, name: 'How It Made You Feel',          icon: '💛', color: C.orange  },
  { id: 5, name: 'The Brand, Right Now',          icon: '🏆', color: C.green   },
  { id: 6, name: 'What It Did to Your Wallet',    icon: '🛒', color: C.teal    },
  { id: 7, name: 'What Actually Connects',        icon: '🎯', color: C.gold    },
]
