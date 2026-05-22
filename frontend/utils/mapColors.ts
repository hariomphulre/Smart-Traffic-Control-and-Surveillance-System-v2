export const THEME = {
  bg: '#0B1220',
  panel: '#111827',
  route: '#22d3ee',
  ambulance: '#3b82f6',
  fire: '#f97316',
  corridor: 'rgba(34, 211, 238, 0.25)',
} as const

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
