import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SubAgentRegistry } from '@/features/settings/components/SubAgentRegistry'
import { SubAgentPersonaConfig } from '@/features/settings/components/SubAgentPersonaConfig'

describe('Sub-agent settings alignment', () => {
  it('renders user-owned sub-agent copy and corrected presets in the registry', () => {
    render(<SubAgentRegistry />)

    expect(screen.getByText(/当前用户主 Agent 挂载的 Sub-Agent 配置/)).toBeInTheDocument()
    expect(screen.getByText('文档起草助手')).toBeInTheDocument()
    expect(screen.queryByText('HR助手')).not.toBeInTheDocument()
  })

  it('prefills persona editing from corrected sub-agent defaults', async () => {
    const user = userEvent.setup()

    render(<SubAgentPersonaConfig />)

    await user.click(screen.getByRole('button', { name: /文档起草助手/ }))

    expect(screen.getByDisplayValue(/负责把任务目标整理为候选文档结构/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/负责根据需求、历史资料和模板生成候选业务文档内容/)).toBeInTheDocument()
  })
})
