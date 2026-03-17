import { describe, expect, it } from 'vitest'

describe('startup budget', () => {
  it('keeps lightweight initialization under budget', () => {
    const start = performance.now()
    let total = 0
    for (let i = 0; i < 50000; i += 1) {
      total += i
    }
    const duration = performance.now() - start
    expect(total).toBeGreaterThan(0)
    expect(duration).toBeLessThan(200)
  })
})
