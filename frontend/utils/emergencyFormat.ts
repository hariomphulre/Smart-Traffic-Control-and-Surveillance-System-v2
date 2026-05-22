export function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

export type MissionLabel = 'Ready' | 'Starting' | 'On the way' | 'Arrived'

export function missionStatus(
  running: boolean,
  active: boolean,
  progress: number
): MissionLabel {
  if (!running) return 'Ready'
  if (!active && progress >= 0.99) return 'Arrived'
  if (active && progress < 0.05) return 'Starting'
  if (active) return 'On the way'
  return 'Ready'
}

export function missionStatusClass(label: MissionLabel): string {
  const map: Record<MissionLabel, string> = {
    Ready: 'STANDBY',
    Starting: 'DISPATCHED',
    'On the way': 'EN_ROUTE',
    Arrived: 'ARRIVED',
  }
  return map[label]
}

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
