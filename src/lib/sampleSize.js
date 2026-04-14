// sampleSize.js
// Cochran's formula with finite population correction
// Industry standard for survey sample size computation

const Z_SCORES = {
  99: 2.576,
  95: 1.960,
  90: 1.645,
}

/**
 * Compute required sample size
 * @param {object} params
 * @param {number} params.plannedReach      - Total population / planned campaign reach
 * @param {number} params.confidenceLevel   - e.g. 95 (percent)
 * @param {number} params.marginOfError     - e.g. 5 (percent)
 * @returns {number} Required sample size (ceiling)
 */
export function computeSampleSize({ plannedReach, confidenceLevel = 95, marginOfError = 5 }) {
  const z = Z_SCORES[confidenceLevel] ?? 1.960
  const e = marginOfError / 100
  const p = 0.5 // maximum variability — conservative estimate

  // Cochran's formula for infinite population
  const n0 = (z * z * p * (1 - p)) / (e * e)

  // Finite population correction
  let n = n0
  if (plannedReach && plannedReach > 0) {
    n = n0 / (1 + (n0 - 1) / plannedReach)
  }

  return Math.ceil(n)
}

/**
 * Compute sample adequacy metadata
 * @param {number} required   - Required sample size
 * @param {number} current    - Current completed responses
 * @returns {object}
 */
export function getSampleAdequacy(required, current) {
  if (!required || required === 0) return null

  const pct        = Math.min(100, Math.round((current / required) * 100))
  const remaining  = Math.max(0, required - current)
  const isComplete = current >= required

  let status, color
  if (pct >= 100)      { status = 'Complete';     color = '#22c55e' }
  else if (pct >= 75)  { status = 'Nearly there'; color = '#3b82f6' }
  else if (pct >= 50)  { status = 'In progress';  color = '#C9A84C' }
  else if (pct >= 25)  { status = 'Building';     color = '#f97316' }
  else                 { status = 'Just started';  color = '#a855f7' }

  return { pct, remaining, isComplete, status, color }
}

/**
 * Get sample size interpretation text
 */
export function getSampleInterpretation(required, plannedReach, confidenceLevel, marginOfError) {
  return `Based on a planned reach of ${plannedReach?.toLocaleString() ?? 'unknown'}, ` +
    `AdChasser recommends a minimum of ${required?.toLocaleString()} completed responses ` +
    `to achieve ${confidenceLevel}% confidence with ±${marginOfError}% margin of error — ` +
    `aligned with globally recommended survey sampling standards (Cochran, 1977).`
}

export const CONFIDENCE_LEVELS = [90, 95, 99]
export const MARGIN_OF_ERROR_OPTIONS = [1, 2, 3, 4, 5, 7, 10]
