import type { Intersection, DirectionSignal, SignalColor } from '../types.js'
import { SIGNAL_CYCLE, NEXT_PHASE } from '../traffic/signalCycles.js'

export function tickSignals(intersections: Intersection[]): Intersection[] {
  return intersections.map((int) => {
    if (int.greenCorridorActive) return tickGreenCorridor(int)
    if (int.overrideActive) return tickManualHold(int)
    return tickNormalIntersection(int)
  })
}

/** Emergency path — all lights stay green */
function tickGreenCorridor(int: Intersection): Intersection {
  const holdGreen = (d: DirectionSignal): DirectionSignal => {
    let countdown = d.countdown - 1
    if (countdown <= 0) countdown = SIGNAL_CYCLE.green
    return { state: 'green', countdown, defaultCycle: SIGNAL_CYCLE.green }
  }
  return {
    ...int,
    north: holdGreen(int.north),
    south: holdGreen(int.south),
    east: holdGreen(int.east),
    west: holdGreen(int.west),
  }
}

/** Manual control — keep current color, refresh timer at zero */
function tickManualHold(int: Intersection): Intersection {
  const tickDir = (d: DirectionSignal): DirectionSignal => {
    let countdown = d.countdown - 1
    if (countdown <= 0) {
      return { ...d, countdown: d.defaultCycle || SIGNAL_CYCLE[d.state] }
    }
    return { ...d, countdown }
  }
  return {
    ...int,
    north: tickDir(int.north),
    south: tickDir(int.south),
    east: tickDir(int.east),
    west: tickDir(int.west),
  }
}

/** Normal operation — north/south share phase, east/west share phase */
function tickNormalIntersection(int: Intersection): Intersection {
  const tickAxis = (d: DirectionSignal): DirectionSignal => {
    let countdown = d.countdown - 1
    if (countdown <= 0) {
      const next = NEXT_PHASE[d.state]
      return { state: next, countdown: SIGNAL_CYCLE[next], defaultCycle: SIGNAL_CYCLE[next] }
    }
    return { ...d, countdown }
  }

  const north = tickAxis(int.north)
  const east = tickAxis(int.east)

  return {
    ...int,
    north,
    south: { ...north },
    east,
    west: { ...east },
    congestionScore: Math.min(
      100,
      Math.max(0, int.congestionScore + int.congestionTrend * 2 + (Math.random() - 0.5) * 2)
    ),
  }
}

export function setAllDirections(
  int: Intersection,
  state: SignalColor,
  countdown?: number
): Intersection {
  const cycle = SIGNAL_CYCLE[state]
  const apply = (): DirectionSignal => ({
    state,
    countdown: countdown ?? cycle,
    defaultCycle: cycle,
  })
  const d = apply()
  return { ...int, north: d, south: { ...d }, east: { ...d }, west: { ...d } }
}

export function manualOverride(
  intersections: Intersection[],
  intersectionId: string,
  action: 'green' | 'red' | 'extend-green' | 'emergency'
): Intersection[] {
  return intersections.map((int) => {
    if (int.id !== intersectionId) return int

    const base = {
      ...int,
      savedStates: int.savedStates ?? {
        north: { ...int.north },
        south: { ...int.south },
        east: { ...int.east },
        west: { ...int.west },
      },
      overrideActive: true,
    }

    switch (action) {
      case 'green':
        return setAllDirections(base, 'green', SIGNAL_CYCLE.green + 15)
      case 'red':
        return setAllDirections(base, 'red', SIGNAL_CYCLE.red)
      case 'extend-green':
        return setAllDirections(base, 'green', (base.north.countdown || 0) + 20)
      case 'emergency':
        return {
          ...setAllDirections(base, 'green', SIGNAL_CYCLE.green + 30),
          greenCorridorActive: true,
        }
      default:
        return int
    }
  })
}

export function restoreIntersection(int: Intersection): Intersection {
  if (!int.savedStates) {
    return { ...int, overrideActive: false, greenCorridorActive: false }
  }
  return {
    ...int,
    north: { ...int.savedStates.north },
    south: { ...int.savedStates.south },
    east: { ...int.savedStates.east },
    west: { ...int.savedStates.west },
    savedStates: undefined,
    overrideActive: false,
    greenCorridorActive: false,
  }
}
