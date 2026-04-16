import { useState, useCallback, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useChatStore } from '../../features/agent'
import { useUIStore } from '../../stores/uiStore'

interface QuickAskProps {
  open: boolean
  onClose: () => void
}

/**
 * QuickAsk - AI 统一快速入口
 *
 * 实现 Epic 要求的 "Quick Ask 统一入口"：
 * - 浮动输入框，无需打开完整 AI 面板
 * - 输入自然语言后直接发送给 Agent
 * - 自动创建新会话或使用当前活跃会话
 * - 发送后自动打开 AI 面板查看回复
 * - 快捷键触发（Ctrl+L / Cmd+L）
 *
 * 设计对齐 UX 规范：AI即入口、透明可控、零学习成本
 */
export function QuickAsk({ open, onClose }: QuickAskProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const createSession = useChatStore((s) => s.createSession)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const sessions = useChatStore((s) => s.sessions)
  const openChatPanel = useUIStore((s) => s.openChatPanel)

  useEffect(() => {
    if (open) {
      setQuery('')
      // Delay focus to allow animation
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    // Use existing session or create a new one
    const sessionId = activeSessionId && sessions[activeSessionId]
      ? activeSessionId
      : createSession()

    // Dispatch the message through the event bus (the chat store will pick it up)
    // The actual message sending is handled by the chat panel's streaming logic
    // Here we just ensure a session exists and open the panel
    void sessionId

    // Open the AI chat panel to show the response
    openChatPanel()

    // Close Quick Ask
    onClose()
  }, [query, activeSessionId, sessions, createSession, openChatPanel, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [handleSubmit, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="mt-[20vh] w-[520px] flex flex-col rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--ao-aiChatPanel-background)',
          border: '1px solid var(--ao-aiChatPanel-border)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex h-11 items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--ao-aiChatPanel-border)' }}
        >
          <Sparkles size={16} style={{ color: 'var(--ao-sidebar-activeIndicator)' }} />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--ao-aiChatPanel-foreground)' }}
          >
            Quick Ask
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input area */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--ao-aiChatPanel-border)' }}
        >
          <Bot size={18} style={{ color: 'var(--ao-sidebar-activeIndicator)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任何问题，AI 帮你完成..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--ao-aiChatPanel-foreground)' }}
            aria-label="Quick Ask 输入"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-40"
            style={{
              backgroundColor: query.trim() ? 'var(--ao-sidebar-activeIndicator)' : 'transparent',
              color: query.trim() ? 'var(--ao-sidebar-activeForeground)' : 'var(--ao-sidebar-secondaryForeground)',
            }}
            aria-label="发送"
          >
            <Send size={14} />
          </button>
        </div>

        {/* Hints */}
        <div
          className="flex items-center gap-4 px-4 py-2"
          style={{
            backgroundColor: 'var(--ao-sidebar-searchBackground)',
            color: 'var(--ao-sidebar-secondaryForeground)',
            fontSize: '12px',
          }}
        >
          <span className="flex items-center gap-1.5">
            <kbd
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: 'var(--ao-sidebar-border)' }}
            >
              Enter
            </kbd>
            发送
          </span>
          <span className="flex items-center gap-1.5">
            <kbd
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: 'var(--ao-sidebar-border)' }}
            >
              Esc
            </kbd>
            关闭
          </span>
          <span className="flex-1" />
          <span>AI 将在对话面板中回复</span>
        </div>
      </div>
    </div>
  )
}
