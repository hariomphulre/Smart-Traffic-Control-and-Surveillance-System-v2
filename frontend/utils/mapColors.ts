export const THEME = {
  bg: '#0B1220',
  panel: '#111827',
  route: '#22d3ee',
  ambulance: '#3b82f6',
  fire: '#f97316',
  corridor: 'rgba(34, 211, 238, 0.25)',
} as const

/** Violation pie chart base colors (red, yellow, green) */
const PIE_RED = '#ea4335'
const PIE_YELLOW = '#fbbc04'
const PIE_GREEN = '#34a853'

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)

  const toHex = (channel: number) => channel.toString(16).padStart(2, '0')
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

/** Lighten red while keeping more saturation so light red stays distinct from yellow */
function lightenRedShade(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (channel: number, factor = 1) =>
    Math.round(channel + (255 - channel) * amount * factor)

  const clampHex = (channel: number) =>
    Math.min(255, Math.max(0, channel)).toString(16).padStart(2, '0')

  return `#${clampHex(mix(r))}${clampHex(mix(g, 0.5))}${clampHex(mix(b, 0.45))}`
}

/** Shade 3 = pie color; shades 1–2 = progressively lighter */
const GREEN_SHADES = [lightenHex(PIE_GREEN, 0.5), lightenHex(PIE_GREEN, 0.25), PIE_GREEN] as const
const YELLOW_SHADES = [lightenHex(PIE_YELLOW, 0.5), lightenHex(PIE_YELLOW, 0.25), PIE_YELLOW] as const
const RED_SHADES = [lightenRedShade(PIE_RED, 0.42), lightenRedShade(PIE_RED, 0.2), PIE_RED] as const

/**
 * Traffic density fill color by vehicle count.
 *
 * Bands (analytics square map):
 * - <= 5        → green 2nd shade
 * - 6 – 10      → yellow 2nd shade
 * - 11 – 20     → red 2nd shade
 * - > 20        → red 3rd shade (base red)
 */
export function trafficVehicleCountColor(vehicleCount: number): string {
  const count = Math.max(0, Math.round(vehicleCount))

  if (count > 20) return RED_SHADES[2]
  if (count > 10) return RED_SHADES[1]
  if (count > 5) return YELLOW_SHADES[1]
  return GREEN_SHADES[1]
}

export function trafficLineColor(density: number): string {
  if (density < 35) return '#22c55e'
  if (density < 65) return '#eab308'
  return '#ef4444'
}

export function signalColor(state: string): string {
  if (state === 'green') return '#22c55e'
  if (state === 'yellow') return '#eab308'
  return '#ef4444'
}
