import { useCallback, useEffect } from 'react'
import { History, MessageSquare, X, type LucideIcon } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { HistoryPanel } from './HistoryPanel'
import { SessionList } from './SessionList'
import { AgentChatPanel } from './AgentChatPanel'
import { useChatStore } from '../hooks/useChatStore'
import { cn } from '@/lib/utils'
import { useUIStore, type AgentSecondarySurface } from '@/stores/uiStore'

interface SessionPanelProps {
  className?: string
  onSendMessage?: (content: string) => Promise<void>
  onStopGeneration?: () => void
}

const SURFACE_META: Record<
  Exclude<AgentSecondarySurface, 'none'>,
  { title: string; description: string; icon: LucideIcon }
> = {
  sessions: {
    title: '会话列表',
    description: '切换、管理或新建当前 AI 对话会话。',
    icon: MessageSquare,
  },
  history: {
    title: '历史记录',
    description: '按需检索与恢复历史会话，不再默认常驻占位。',
    icon: History,
  },
}

export function SessionPanel({ className, onSendMessage, onStopGeneration }: SessionPanelProps) {
  const activeSessionId = useChatStore((state) => state.activeSessionId)
  const createSession = useChatStore((state) => state.createSession)
  const { agentSecondarySurface, openAgentSecondarySurface, closeAgentSecondarySurface } = useUIStore(
    useShallow((state) => ({
      agentSecondarySurface: state.agentSecondarySurface,
      openAgentSecondarySurface: state.openAgentSecondarySurface,
      closeAgentSecondarySurface: state.closeAgentSecondarySurface,
    }))
  )

  useEffect(() => {
    if (!activeSessionId) {
      createSession()
    }
  }, [activeSessionId, createSession])

  useEffect(() => {
    if (agentSecondarySurface === 'none') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAgentSecondarySurface()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [agentSecondarySurface, closeAgentSecondarySurface])

  const handleCreateSession = useCallback(() => {
    createSession()
    closeAgentSecondarySurface()
  }, [createSession, closeAgentSecondarySurface])

  const handleOpenSessions = useCallback(() => {
    openAgentSecondarySurface('sessions')
  }, [openAgentSecondarySurface])

  const handleOpenHistory = useCallback(() => {
    openAgentSecondarySurface('history')
  }, [openAgentSecondarySurface])

  const currentSurface = agentSecondarySurface === 'none' ? null : SURFACE_META[agentSecondarySurface]

  return (
    <div className={cn('relative flex h-full bg-white', className)}>
      <AgentChatPanel
        className="h-full min-w-0 flex-1"
        onSendMessage={onSendMessage}
        onStopGeneration={onStopGeneration}
        onNewSession={handleCreateSession}
        onOpenSessions={handleOpenSessions}
        onOpenHistory={handleOpenHistory}
      />

      {agentSecondarySurface !== 'none' && currentSurface && (
        <>
          <button
            type="button"
            aria-label="关闭次级面板"
            className="absolute inset-y-0 right-0 left-[320px] z-10 bg-slate-900/20 backdrop-blur-[1px]"
            onClick={closeAgentSecondarySurface}
          />

          <section
            className="absolute inset-y-0 left-0 z-20 flex w-full max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-xl"
            aria-label={currentSurface.title}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-slate-900">
                  <currentSurface.icon size={16} />
                  <h3 className="text-sm font-semibold">{currentSurface.title}</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{currentSurface.description}</p>
              </div>
              <button
                type="button"
                onClick={closeAgentSecondarySurface}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="关闭"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {agentSecondarySurface === 'sessions' ? (
                <SessionList
                  className="h-full"
                  onNewSession={closeAgentSecondarySurface}
                  onSelectSession={() => closeAgentSecondarySurface()}
                />
              ) : (
                <HistoryPanel
                  className="h-full"
                  onSelectSession={() => closeAgentSecondarySurface()}
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default SessionPanel
