import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionPanel } from '@/features/agent/components/SessionPanel'
import { useChatStore } from '@/features/agent/hooks/useChatStore'
import { useUIStore } from '@/stores/uiStore'

vi.mock('@/features/agent/components/AgentChatPanel', () => ({
  AgentChatPanel: ({
    onOpenSessions,
    onOpenHistory,
    onNewSession,
  }: {
    onOpenSessions?: () => void
    onOpenHistory?: () => void
    onNewSession?: () => void
  }) => (
    <div>
      <button onClick={onOpenSessions}>打开会话列表</button>
      <button onClick={onOpenHistory}>打开历史记录</button>
      <button onClick={onNewSession}>新对话</button>
    </div>
  ),
}))

vi.mock('@/features/agent/components/SessionList', () => ({
  SessionList: ({
    onSelectSession,
    onNewSession,
  }: {
    onSelectSession?: (sessionId: string) => void
    onNewSession?: () => void
  }) => (
    <div>
      <div>会话列表内容</div>
      <button onClick={() => onSelectSession?.('session-1')}>选择会话</button>
      <button onClick={onNewSession}>新建会话</button>
    </div>
  ),
}))

vi.mock('@/features/agent/components/HistoryPanel', () => ({
  HistoryPanel: ({
    onSelectSession,
  }: {
    onSelectSession?: (sessionId: string) => void
  }) => (
    <div>
      <div>历史记录内容</div>
      <button onClick={() => onSelectSession?.('history-session')}>选择历史会话</button>
    </div>
  ),
}))

describe('SessionPanel secondary surfaces', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
    useUIStore.setState({
      chatPanelCollapsed: false,
      agentSecondarySurface: 'none',
    })
  })

  it('opens the sessions surface on demand and closes it from the backdrop', () => {
    render(<SessionPanel />)

    fireEvent.click(screen.getByText('打开会话列表'))

    expect(screen.getByLabelText('会话列表')).toBeInTheDocument()
    expect(useUIStore.getState().agentSecondarySurface).toBe('sessions')

    fireEvent.click(screen.getByLabelText('关闭次级面板'))

    expect(screen.queryByLabelText('会话列表')).not.toBeInTheDocument()
    expect(useUIStore.getState().agentSecondarySurface).toBe('none')
  })

  it('opens history on demand and closes after selecting a historical session', () => {
    render(<SessionPanel />)

    fireEvent.click(screen.getByText('打开历史记录'))

    expect(screen.getByLabelText('历史记录')).toBeInTheDocument()
    expect(useUIStore.getState().agentSecondarySurface).toBe('history')

    fireEvent.click(screen.getByText('选择历史会话'))

    expect(screen.queryByLabelText('历史记录')).not.toBeInTheDocument()
    expect(useUIStore.getState().agentSecondarySurface).toBe('none')
  })
})
