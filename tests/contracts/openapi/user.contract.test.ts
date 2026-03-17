import { describe, expect, it } from 'vitest'
import { buildUser } from '../../fixtures/factories/userFactory'

describe('user contract', () => {
  it('matches required fields', () => {
    const user = buildUser()
    expect(typeof user.id).toBe('string')
    expect(typeof user.username).toBe('string')
    expect(typeof user.name).toBe('string')
    expect(typeof user.department).toBe('string')
    expect(typeof user.role).toBe('string')
  })
})
