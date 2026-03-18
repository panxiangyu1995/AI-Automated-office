import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from '@/features/auth/components/LoginForm'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('security input validation', () => {
  it('renders password input as password type', () => {
    render(<LoginForm />)
    const input = screen.getByLabelText('密码')
    expect(input).toHaveAttribute('type', 'password')
  })
})
