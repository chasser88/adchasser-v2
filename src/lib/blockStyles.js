// blockStyles.js — style resolver for all CMS blocks

export const FONT_FAMILIES = {
  'DM Sans':          'DM Sans, system-ui, sans-serif',
  'Playfair Display': 'Playfair Display, Georgia, serif',
  'Georgia':          'Georgia, serif',
  'System UI':        'system-ui, sans-serif',
  'Mono':             'JetBrains Mono, Fira Code, monospace',
}

export const FONT_WEIGHTS = {
  'Regular':    400,
  'Medium':     500,
  'Semi-Bold':  600,
  'Bold':       700,
  'Extra Bold': 800,
}

export const HEADLINE_SIZES = [20, 24, 28, 32, 36, 40, 48, 56, 64]
export const BODY_SIZES     = [11, 12, 13, 14, 15, 16, 17, 18]

export const DEFAULT_STYLES = {
  fontFamily:      'DM Sans',
  headlineSize:    40,
  bodySize:        14,
  fontWeight:      'Bold',
  textAlign:       'left',
  textColor:       '#E2E6F3',
  bgColor:         'transparent',
  accentColor:     '#C9A84C',
  buttonBg:        '#C9A84C',
  buttonText:      '#07090F',
  paddingTop:      80,
  paddingBottom:   80,
  itemGap:         16,
}

/**
 * Merge brand settings into default styles
 * Call this to get brand-aware defaults for new blocks
 */
export function getDefaultStyles(brandSettings = null) {
  if (!brandSettings) return { ...DEFAULT_STYLES }
  return {
    ...DEFAULT_STYLES,
    accentColor:  brandSettings.primary_color  ?? DEFAULT_STYLES.accentColor,
    buttonBg:     brandSettings.primary_color  ?? DEFAULT_STYLES.buttonBg,
    fontFamily:   brandSettings.body_font      ?? DEFAULT_STYLES.fontFamily,
  }
}

/**
 * Resolve block styles into CSS objects for JSX
 */
export function resolveStyles(s = {}, brandSettings = null) {
  const base   = getDefaultStyles(brandSettings)
  const merged = { ...base, ...s }

  const ff = FONT_FAMILIES[merged.fontFamily] ?? FONT_FAMILIES['DM Sans']
  const fw = FONT_WEIGHTS[merged.fontWeight]  ?? 700
  const ta = merged.textAlign ?? 'left'

  return {
    section: {
      background:    merged.bgColor === 'transparent' ? undefined : merged.bgColor,
      paddingTop:    `${merged.paddingTop}px`,
      paddingBottom: `${merged.paddingBottom}px`,
    },
    headline: {
      fontFamily:  FONT_FAMILIES[brandSettings?.headline_font ?? 'Playfair Display'] ?? ff,
      fontSize:    `clamp(${Math.round(merged.headlineSize * 0.65)}px, ${parseFloat((merged.headlineSize * 0.04).toFixed(2))}vw, ${merged.headlineSize}px)`,
      fontWeight:  fw,
      color:       merged.textColor,
      textAlign:   ta,
      lineHeight:  1.1,
    },
    subheadline: {
      fontFamily: ff,
      fontSize:   `clamp(${Math.max(12, merged.bodySize - 2)}px, 2vw, ${merged.bodySize + 2}px)`,
      color:      merged.textColor + 'BB',
      textAlign:  ta,
      lineHeight: 1.75,
    },
    body: {
      fontFamily: ff,
      fontSize:   `${merged.bodySize}px`,
      color:      merged.textColor + '99',
      lineHeight: 1.75,
    },
    accent: {
      color:         merged.accentColor,
      fontSize:      '11px',
      fontWeight:    600,
      letterSpacing: '4px',
      textTransform: 'uppercase',
      textAlign:     ta,
      fontFamily:    ff,
      marginBottom:  '12px',
      display:       'block',
    },
    button: {
      background:     merged.buttonBg,
      color:          merged.buttonText,
      border:         'none',
      borderRadius:   '10px',
      padding:        '13px 28px',
      fontSize:       '14px',
      fontWeight:     700,
      fontFamily:     ff,
      cursor:         'pointer',
      display:        'inline-block',
      textDecoration: 'none',
    },
    secondaryButton: {
      background:   'transparent',
      color:        merged.textColor,
      border:       `1px solid ${merged.textColor}30`,
      borderRadius: '10px',
      padding:      '13px 28px',
      fontSize:     '14px',
      fontFamily:   ff,
      cursor:       'pointer',
    },
    grid: { gap: `${merged.itemGap}px` },
    raw:  merged,
  }
}
