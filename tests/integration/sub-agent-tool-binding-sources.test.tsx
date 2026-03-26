import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SubAgentToolBinding } from '@/features/settings/components/SubAgentToolBinding'

describe('Sub-agent tool binding skill sources', () => {
  it('surfaces platform, department, and user skill sources separately', async () => {
    const user = userEvent.setup()

    render(<SubAgentToolBinding />)

    await user.click(screen.getByRole('button', { name: /文档起草助手/ }))

    expect(screen.getAllByText(/平台内置/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/部门内置/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/用户安装/).length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: '绑定 Skill' }))

    expect(screen.getAllByText('平台内置 Skills').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('部门内置 Skills').length).toBeGreaterThanOrEqual(1)
  })
})
