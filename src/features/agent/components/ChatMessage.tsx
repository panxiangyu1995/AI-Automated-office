/**
 * ChatMessage - 消息渲染组件
 * Story 4.1 - AI对话界面实现
 * 
 * 支持功能：
 * - 用户和助手消息渲染
 * - 流式更新
 * - Markdown 和代码显示
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，复用消息模型
 */

import { useMemo, useState, useRef, useEffect } from 'react'
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, Part, TextPart, ToolCallPart, ToolResultPart, ErrorPart } from '../../message/runtime/messageModel'

// ==================== Types ====================

interface ChatMessageProps {
  message: Message
  streamingContent?: string
  isStreaming?: boolean
}

// ==================== Simple Markdown Renderer ====================

/**
 * 简单的 Markdown 渲染器
 * 支持标题、粗体、斜体、代码块、行内代码、列表
 * 
 * TODO: 后续可替换为 react-markdown + remark-gfm
 */
function SimpleMarkdown({ content }: { content: string }) {
  const rendered = useMemo(() => {
    let html = content
    
    // 代码块 (```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre class="bg-slate-100 rounded-lg p-4 my-2 overflow-x-auto"><code class="language-${lang}">${escapedCode}</code></pre>`
    })
    
    // 行内代码 (`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    
    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    
    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    
    // 换行
    html = html.replace(/\n/g, '<br />')
    
    return html
  }, [content])
  
  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}

// ==================== Tool Call Card ====================

interface ToolCallCardProps {
  part: ToolCallPart
}

function ToolCallCard({ part }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  const statusColor = {
    pending: 'text-yellow-500',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500',
  }[part.status]
  
  return (
    <div className="border border-slate-200 rounded-lg my-2 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium', statusColor)}>
            {part.status}
          </span>
          <span className="text-sm font-medium text-slate-700">
            {part.toolName}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {/* Parameters */}
      {expanded && (
        <div className="p-3 bg-white">
          <div className="text-xs text-slate-500 mb-1">参数:</div>
          <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
            <code>{JSON.stringify(part.parameters, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

// ==================== Tool Result Card ====================

interface ToolResultCardProps {
  part: ToolResultPart
}

function ToolResultCard({ part }: ToolResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className={cn(
      'border rounded-lg my-2 overflow-hidden',
      part.success ? 'border-green-200' : 'border-red-200'
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 transition-colors',
          part.success ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium',
            part.success ? 'text-green-600' : 'text-red-600'
          )}>
            {part.success ? '成功' : '失败'}
          </span>
          <span className="text-sm font-medium text-slate-700">
            {part.toolName}
          </span>
          {part.duration && (
            <span className="text-xs text-slate-400">
              {part.duration}ms
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {/* Result */}
      {expanded && (
        <div className="p-3 bg-white">
          {part.errorMessage ? (
            <div className="text-sm text-red-600">{part.errorMessage}</div>
          ) : (
            <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
              <code>{JSON.stringify(part.result, null, 2)}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== Error Card ====================

interface ErrorCardProps {
  part: ErrorPart
}

function ErrorCard({ part }: ErrorCardProps) {
  const severityColors = {
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
    critical: 'border-red-300 bg-red-100',
  }
  
  return (
    <div className={cn('border rounded-lg p-3 my-2', severityColors[part.severity])}>
      <div className="text-sm font-medium text-red-700">
        错误: {part.message}
      </div>
      {part.details && (
        <div className="text-xs text-red-600 mt-1">{part.details}</div>
      )}
      {part.recoverable && (
        <div className="text-xs text-blue-600 mt-1">此错误可以恢复</div>
      )}
    </div>
  )
}

// ==================== Part Renderer ====================

interface PartRendererProps {
  part: Part
}

function PartRenderer({ part }: PartRendererProps) {
  switch (part.type) {
    case 'text':
      return <SimpleMarkdown content={(part as TextPart).content} />
    
    case 'tool_call':
      return <ToolCallCard part={part as ToolCallPart} />
    
    case 'tool_result':
      return <ToolResultCard part={part as ToolResultPart} />
    
    case 'error':
      return <ErrorCard part={part as ErrorPart} />
    
    case 'reasoning':
      return (
        <div className="bg-slate-50 border-l-4 border-slate-300 px-3 py-2 my-2 italic text-slate-600 text-sm">
          {(part as { content: string }).content}
        </div>
      )
    
    default:
      return (
        <div className="text-slate-400 text-sm">
          [未知消息类型: {part.type}]
        </div>
      )
  }
}

// ==================== Main Component ====================

export function ChatMessage({ message, streamingContent, isStreaming }: ChatMessageProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  useEffect(() => {
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [streamingContent, isStreaming])
  
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  
  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser 
            ? 'bg-slate-200' 
            : 'bg-primary'
        )}
        style={!isUser ? { backgroundColor: '#1E3A5F' } : undefined}
      >
        {isUser ? (
          <User size={16} className="text-slate-600" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>
      
      {/* Message Content */}
      <div
        className={cn(
          'flex-1 max-w-[85%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        <div
          className={cn(
            'inline-block px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-slate-100 text-slate-800 rounded-tl-sm'
          )}
          style={isUser ? { backgroundColor: '#1E3A5F' } : undefined}
        >
          {/* Render Parts */}
          {message.parts.map((part) => (
            <PartRenderer key={part.id} part={part} />
          ))}
          
          {/* Streaming Content */}
          {isStreaming && streamingContent && (
            <div className="mt-1">
              <SimpleMarkdown content={streamingContent} />
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            </div>
          )}
          
          {/* Empty assistant message while starting */}
          {isAssistant && message.parts.length === 0 && !isStreaming && message.status === 'pending' && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-slate-500">思考中...</span>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div
          className={cn(
            'text-xs text-slate-400 mt-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatMessage