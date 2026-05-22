import type { SignalColor } from '../types.js'

export const SIGNAL_CYCLE: Record<SignalColor, number> = {
  green: 28,
  yellow: 4,
  red: 22,
}

export const NEXT_PHASE: Record<SignalColor, SignalColor> = {
  green: 'yellow',
  yellow: 'red',
  red: 'green',
}
