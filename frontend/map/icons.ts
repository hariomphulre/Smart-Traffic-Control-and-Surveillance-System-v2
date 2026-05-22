import L from 'leaflet'

function imageIcon(url: string, size: [number, number], anchor: [number, number]): L.Icon {
  return L.icon({
    iconUrl: url,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1] + 4],
  })
}

export const ambulanceIcon = imageIcon('/icons/ambulance.svg', [52, 52], [26, 26])
export const fireBrigadeIcon = imageIcon('/icons/fire-truck.svg', [44, 44], [22, 22])
export const hospitalIcon = imageIcon('/icons/hospital.svg', [40, 40], [20, 20])
export const fireStationIcon = imageIcon('/icons/fire-station.svg', [40, 40], [20, 20])

function signalDivIcon(
  corridor: boolean,
  override: boolean,
  active: 'red' | 'yellow' | 'green'
): L.DivIcon {
  const html = `
<div class="icon-wrap signal-icon ${corridor ? 'signal-corridor' : ''} ${override ? 'signal-override' : ''}">
  <div class="signal-lights">
    <span class="lamp red ${active === 'red' ? 'on' : ''}"></span>
    <span class="lamp yellow ${active === 'yellow' ? 'on' : ''}"></span>
    <span class="lamp green ${active === 'green' ? 'on' : ''}"></span>
  </div>
</div>`
  return L.divIcon({
    html,
    className: 'emergency-map-icon',
    iconSize: [28, 36],
    iconAnchor: [14, 18],
  })
}

export function signalIcon(
  corridor: boolean,
  override: boolean,
  active: 'red' | 'yellow' | 'green'
) {
  return signalDivIcon(corridor, override, active)
}

/** Main phase shown on the signal marker */
export function dominantSignal(int: {
  north: { state: string }
  south: { state: string }
  east: { state: string }
  west: { state: string }
  greenCorridorActive?: boolean
}): 'red' | 'yellow' | 'green' {
  if (int.greenCorridorActive) return 'green'
  const dirs = [int.north, int.south, int.east, int.west]
  if (dirs.every((d) => d.state === 'green')) return 'green'
  if (dirs.some((d) => d.state === 'green')) return 'green'
  if (dirs.some((d) => d.state === 'yellow')) return 'yellow'
  return 'red'
}
