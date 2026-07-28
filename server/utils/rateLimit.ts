export interface RateLimiter { check: (key: string) => boolean }

const SWEEP_THRESHOLD = 10_000

export function createRateLimiter(opts: { max: number, windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()

  function sweep(windowStart: number) {
    for (const [k, timestamps] of hits) {
      if (!timestamps.some(t => t > windowStart)) {
        hits.delete(k)
      }
    }
  }

  return {
    check(key) {
      const now = Date.now()
      const windowStart = now - opts.windowMs
      const recent = (hits.get(key) ?? []).filter(t => t > windowStart)
      if (recent.length >= opts.max) {
        if (recent.length === 0) {
          hits.delete(key)
        }
        else {
          hits.set(key, recent)
        }
        return false
      }
      recent.push(now)
      hits.set(key, recent)

      if (hits.size > SWEEP_THRESHOLD) {
        sweep(windowStart)
      }

      return true
    },
  }
}
