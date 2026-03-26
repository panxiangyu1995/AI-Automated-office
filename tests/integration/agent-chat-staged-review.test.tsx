import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { AgentChatPanel } from '@/features/agent'
import {
  createCardContainerReference,
  createCardReference,
  createCardUpdateOperation,
  createCardWritebackAction,
  createTextCardContent,
  useStagedReviewStore,
} from '@/features/session/runtime'
import { useChatStore } from '@/features/agent/hooks/useChatStore'

describe('Agent chat staged review surface', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
    useStagedReviewStore.getState().reset()
  })

  it('shows a candidate change list above chat and lets the user accept or reject changes', async () => {
    const user = userEvent.setup()
    const sessionId = useChatStore.getState().createSession('审阅会话')

    const containerRef = createCardContainerReference('wb-review', 'page-review', 'dept-tender', 'workbench')
    const cardRef = createCardReference('card-review', containerRef, 0)
    const action = createCardWritebackAction(sessionId, containerRef, [
      createCardUpdateOperation(cardRef, 'create', {
        cardData: {
          title: 'AI 草稿卡片',
          description: '等待用户确认',
          contentType: 'text',
          content: createTextCardContent('候选标书摘要', 'plain'),
        },
      }),
    ])

    useStagedReviewStore.getState().stageWorkbenchWriteback(action, {
      title: 'AI 候选改动',
      summary: '变更清单与工具调用分离展示。',
    })

    render(<AgentChatPanel />)

    expect(screen.getByText('候选改动清单')).toBeInTheDocument()
    expect(screen.getByText('AI 候选改动')).toBeInTheDocument()
    expect(screen.getByText('AI 草稿卡片')).toBeInTheDocument()
    expect(screen.getByText('来源区域: workbench')).toBeInTheDocument()
    expect(screen.getByText('来源工具: workspace_stage_change')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '接受' }))
    expect(screen.getAllByText('已接受').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: '回滚' }))
    expect(screen.getByText('已回滚')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '全部拒绝' }))
    expect(screen.getAllByText('已拒绝').length).toBeGreaterThanOrEqual(1)
  })

  it('can collapse and expand the staged review list independently from the message list', async () => {
    const user = userEvent.setup()
    const sessionId = useChatStore.getState().createSession('折叠会话')

    const containerRef = createCardContainerReference('wb-collapse', 'page-collapse', 'dept-tender', 'workbench')
    const cardRef = createCardReference('card-collapse', containerRef, 0)
    const action = createCardWritebackAction(sessionId, containerRef, [
      createCardUpdateOperation(cardRef, 'create', {
        cardData: {
          title: '折叠测试卡片',
          contentType: 'text',
          content: createTextCardContent('候选内容', 'plain'),
        },
      }),
    ])

    useStagedReviewStore.getState().stageWorkbenchWriteback(action)

    render(<AgentChatPanel />)

    expect(screen.getByText('折叠测试卡片')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /候选改动清单/ }))
    expect(screen.queryByText('折叠测试卡片')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /候选改动清单/ }))
    expect(screen.getByText('折叠测试卡片')).toBeInTheDocument()
  })
})
