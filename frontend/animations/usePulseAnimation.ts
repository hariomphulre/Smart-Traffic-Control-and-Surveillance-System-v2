'use client'

import { useEffect, useRef } from 'react'

/** Shared rAF pulse 0–1 for siren / route glow effects */
export function usePulseAnimation(active: boolean, speed = 0.04): number {
  const phase = useRef(0)
  const frame = useRef(0)

  useEffect(() => {
    if (!active) return
    let id = 0
    const tick = () => {
      phase.current += speed
      frame.current = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [active, speed])

  return 0.5 + Math.sin(phase.current) * 0.5
}
