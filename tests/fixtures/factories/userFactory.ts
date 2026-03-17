export type TestUser = {
  id: string
  username: string
  name: string
  department: string
  role: string
}

export const buildUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'user-1',
  username: 'demo',
  name: 'Demo User',
  department: 'General',
  role: 'viewer',
  ...overrides,
})
