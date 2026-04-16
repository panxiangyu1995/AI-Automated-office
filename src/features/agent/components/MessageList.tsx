/**
 * MessageList - 消息列表组件
 * Story 4.1 - AI对话界面实现
 * Story 51.8 - Streaming Render Optimization
 *
 * 支持功能：
 * - 消息列表渲染
 * - 自动滚动
 * - 空状态展示
 * - 快速操作
 * - 虚拟化列表（1000+消息流畅滚动）
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Sparkles, FileText, HelpCircle, ArrowUp } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { useActiveMessages, useStreamingStatus } from '../hooks/useChatStore'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface MessageListProps {
  className?: string
}

// ==================== Quick Actions ====================

interface QuickAction {
  icon: React.ReactNode
  label: string
  prompt: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Sparkles size={16} />,
    label: '帮我分析',
    prompt: '请帮我分析一下当前的数据情况',
  },
  {
    icon: <FileText size={16} />,
    label: '生成报告',
    prompt: '请帮我生成一份工作报告',
  },
  {
    icon: <HelpCircle size={16} />,
    label: '使用帮助',
    prompt: '请介绍一下您能帮我做什么',
  },
]

// ==================== Empty State ====================

interface EmptyStateProps {
  onQuickAction?: (prompt: string) => void
}

function EmptyState({ onQuickAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      {/* Welcome Icon */}
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--ao-button.background)' }}
      >
        <Sparkles size={32} className="text-white" />
      </div>
      
      {/* Welcome Text */}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        欢迎使用 AI 助手
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        我可以帮助您处理日常办公任务，包括数据分析、文档处理、智能决策等。
      </p>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_ACTIONS.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction?.(action.prompt)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'text-sm font-medium',
              'bg-slate-100 text-slate-700 hover:bg-slate-200',
              'transition-colors'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export function MessageList({ className }: MessageListProps) {
  const messages = useActiveMessages()
  const { isStreaming, streamingContent } = useStreamingStatus()
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  // 虚拟化配置
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback((index: number) => {
      // 估算消息高度：基础高度 + 根据角色和内容调整
      const message = messages[index]
      if (!message) return 80

      // 粗略估算：用户消息约60-100px，助手消息约100-300px
      const baseHeight = message.role === 'user' ? 80 : 150
      const contentHeight = message.parts.length * 50

      return Math.max(60, baseHeight + contentHeight)
    }, [messages]),
    overscan: 5, // 上下各渲染5条额外消息
  })

  // 自动滚动到底部（当有新消息或流式更新时）
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { behavior: 'smooth' })
    }
  }, [messages, streamingContent, autoScroll, rowVirtualizer])

  // 检测用户是否手动滚动
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setAutoScroll(isAtBottom)

      // 显示"滚动到顶部"按钮当用户向上滚动时
      setShowScrollToTop(scrollTop > 300)
    }
  }, [])

  // 滚动到顶部（加载历史消息）
  const scrollToTop = useCallback(() => {
    rowVirtualizer.scrollToIndex(0, { behavior: 'smooth' })
  }, [rowVirtualizer])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    rowVirtualizer.scrollToIndex(messages.length - 1, { behavior: 'smooth' })
    setAutoScroll(true)
  }, [messages.length, rowVirtualizer])

  // 如果没有消息，显示空状态
  if (messages.length === 0) {
    return (
      <div className={cn('h-full relative', className)}>
        <EmptyState />
      </div>
    )
  }

  // 找到最后一条助手消息（用于流式显示）
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className={cn('h-full relative', className)}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const message = messages[virtualRow.index]
            const isLastAssistant = message?.id === lastAssistantMessage?.id
            const showStreaming = isLastAssistant && isStreaming

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: '0 16px',
                }}
              >
                {message && (
                  <ChatMessage
                    message={message}
                    streamingContent={showStreaming ? streamingContent : undefined}
                    isStreaming={showStreaming}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 滚动到顶部按钮 */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
          title="滚动到顶部"
        >
          <ArrowUp size={16} />
        </button>
      )}

      {/* 滚动到底部按钮（当不在底部时显示） */}
      {!autoScroll && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
          title="滚动到底部"
        >
          <ArrowUp size={16} className="rotate-180" />
        </button>
      )}
    </div>
  )
}

export default MessageList