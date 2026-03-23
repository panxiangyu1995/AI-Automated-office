/**
 * MessageList - 消息列表组件
 * Story 4.1 - AI对话界面实现
 * 
 * 支持功能：
 * - 消息列表渲染
 * - 自动滚动
 * - 空状态展示
 * - 快速操作
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 */

import { useRef, useEffect, useState } from 'react'
import { Sparkles, FileText, HelpCircle } from 'lucide-react'
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
        style={{ backgroundColor: '#1E3A5F' }}
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, autoScroll])
  
  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setAutoScroll(isAtBottom)
    }
  }
  
  // 如果没有消息，显示空状态
  if (messages.length === 0) {
    return (
      <div className={cn('h-full', className)}>
        <EmptyState />
      </div>
    )
  }
  
  // 找到最后一条助手消息（用于流式显示）
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
  
  return (
    <div 
      ref={containerRef}
      className={cn('overflow-y-auto', className)}
      onScroll={handleScroll}
    >
      <div className="p-4 space-y-4">
        {messages.map((message) => {
          const isLastAssistant = message.id === lastAssistantMessage?.id
          const showStreaming = isLastAssistant && isStreaming
          
          return (
            <ChatMessage
              key={message.id}
              message={message}
              streamingContent={showStreaming ? streamingContent : undefined}
              isStreaming={showStreaming}
            />
          )
        })}
        
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList