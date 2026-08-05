import { LOCATION_DB } from '@/map/MapData2'
import type { IdentityLocation } from '@/lib/api'

export type LocationScope = 'national' | 'state' | 'city' | 'square'
export type LocationLevel = 'national' | 'state' | 'city' | 'square'

export function getLocationLevel(pathSegments: string[]): LocationLevel {
  if (pathSegments.length === 0) return 'national'
  if (pathSegments.length === 1) return 'state'
  if (pathSegments.length >= 2 && pathSegments.length <= 3) return 'city'
  return 'square'
}

export function getViewLocationFilter(pathSegments: string[]): {
  state?: string
  city?: string
  squareId?: string
} {
  const level = getLocationLevel(pathSegments)
  if (level === 'national') return {}
  if (level === 'state') return { state: pathSegments[0] }
  if (level === 'city') {
    return { state: pathSegments[0], city: pathSegments[1] }
  }
  return {
    state: pathSegments[0],
    city: pathSegments[1],
    squareId: pathSegments[3],
  }
}

export function getAvailableOptions(path: string[]): string[] {
  let currentLevel: unknown = LOCATION_DB
  for (const segment of path) {
    if (!currentLevel || typeof currentLevel !== 'object' || Array.isArray(currentLevel)) {
      return []
    }
    const next = (currentLevel as Record<string, unknown>)[segment]
    if (next === undefined) return []
    currentLevel = next
  }
  if (Array.isArray(currentLevel)) return currentLevel as string[]
  if (currentLevel && typeof currentLevel === 'object') {
    return Object.keys(currentLevel as Record<string, unknown>)
  }
  return []
}

export function globalScopeLabel(lockedPath: string[]): string {
  const level = getLocationLevel(lockedPath)
  if (level === 'national') return 'Global scope (India)'
  if (level === 'state') return `Global scope (entire ${lockedPath[0]})`
  if (level === 'city') return `Global scope (entire ${lockedPath[1]})`
  return 'Global scope'
}

export function canUseGlobalScope(lockedPath: string[]): boolean {
  return getLocationLevel(lockedPath) !== 'square'
}

/** Build identity location from picker path + optional global toggle. */
export function resolveIdentityLocation(
  path: string[],
  lockedBase: string[],
  useGlobal: boolean
): { location: IdentityLocation; error?: undefined } | { location?: undefined; error: string } {
  if (useGlobal) {
    const level = getLocationLevel(lockedBase)
    if (level === 'national') {
      return {
        location: {
          scope: 'national',
          country: 'India',
          state: null,
          city: null,
          area: null,
          squareId: null,
        },
      }
    }
    if (level === 'state') {
      return {
        location: {
          scope: 'state',
          country: 'India',
          state: lockedBase[0],
          city: null,
          area: null,
          squareId: null,
        },
      }
    }
    if (level === 'city') {
      return {
        location: {
          scope: 'city',
          country: 'India',
          state: lockedBase[0],
          city: lockedBase[1],
          area: null,
          squareId: null,
        },
      }
    }
    return {
      location: {
        scope: 'square',
        country: 'India',
        state: lockedBase[0],
        city: lockedBase[1],
        area: lockedBase[2],
        squareId: lockedBase[3],
      },
    }
  }

  if (path.length < lockedBase.length) {
    return { error: 'Location cannot go above the current IAM path' }
  }

  for (let i = 0; i < lockedBase.length; i++) {
    if (path[i] !== lockedBase[i]) {
      return { error: 'Location must stay within the current IAM path' }
    }
  }

  if (path.length === 0) {
    return { error: 'Select a location path or enable Global scope' }
  }

  if (path.length === 1) {
    return {
      location: {
        scope: 'state',
        country: 'India',
        state: path[0],
        city: null,
        area: null,
        squareId: null,
      },
    }
  }

  if (path.length === 2 || path.length === 3) {
    return {
      location: {
        scope: 'city',
        country: 'India',
        state: path[0],
        city: path[1],
        area: null,
        squareId: null,
      },
    }
  }

  if (path.length >= 4) {
    return {
      location: {
        scope: 'square',
        country: 'India',
        state: path[0],
        city: path[1],
        area: path[2],
        squareId: path[3],
      },
    }
  }

  return { error: 'Invalid location path' }
}

/** When not using global, require a concrete assignment under the locked base. */
export function isAddLocationReady(
  path: string[],
  lockedBase: string[],
  useGlobal: boolean
): boolean {
  if (useGlobal) return canUseGlobalScope(lockedBase) || lockedBase.length >= 4
  if (lockedBase.length >= 4) return true
  return path.length > lockedBase.length
}
