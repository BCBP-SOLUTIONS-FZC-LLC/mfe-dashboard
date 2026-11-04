import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs` while `active`, so relative labels ("2 mins ago") keep
 * counting. The first value is the mount time; callers clamp (the label never shows under 1 min).
 */
export function useNow(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) {
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs, active])
  return now
}
