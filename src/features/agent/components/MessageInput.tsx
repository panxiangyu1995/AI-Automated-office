/**
 * MessageInput - 消息输入组件
 * Story 4.1 - AI对话界面实现
 * 
 * 支持功能：
 * - 文本输入
 * - 发送消息
 * - 停止生成
 * - 快捷键支持
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Square, Paperclip, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStreamingStatus } from '../hooks/useChatStore'

// ==================== Types ====================

interface MessageInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

// ==================== Main Component ====================

export function MessageInput({
  onSend,
  onStop,
  disabled = false,
  placeholder = '输入消息... (Enter 发送, Shift+Enter 换行)',
  className,
}: MessageInputProps) {
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isStreaming } = useStreamingStatus()
  
  // 自动调整文本框高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [inputValue])
  
  // 发送消息
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue || isStreaming || disabled) return
    
    onSend(trimmedValue)
    setInputValue('')
    
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [inputValue, isStreaming, disabled, onSend])
  
  // 停止生成
  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])
  
  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const canSend = inputValue.trim().length > 0 && !isStreaming && !disabled
  
  return (
    <div className={cn('border-t border-slate-200 bg-white', className)}>
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* 附件按钮 (暂未实现) */}
          <button
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            disabled={disabled || isStreaming}
            title="添加附件"
          >
            <Paperclip size={18} />
          </button>
          
          {/* 输入框 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl',
                'text-sm text-slate-800 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
                'resize-none transition-all',
                'disabled:bg-slate-50 disabled:cursor-not-allowed'
              )}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            
            {/* 字数统计 */}
            {inputValue.length > 0 && (
              <span className="absolute right-3 bottom-2 text-xs text-slate-400">
                {inputValue.length}
              </span>
            )}
          </div>
          
          {/* 发送/停止按钮 */}
          {isStreaming ? (
            <button
              onClick={handleStop}
              className={cn(
                'p-3 rounded-xl transition-colors',
                'bg-red-500 hover:bg-red-600 text-white'
              )}
              title="停止生成"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'p-3 rounded-xl transition-colors',
                canSend
                  ? 'text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
              style={canSend ? { backgroundColor: '#1E3A5F' } : undefined}
              title="发送消息"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        
        {/* 快捷提示 */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-slate-400">
            Enter 发送 · Shift+Enter 换行
          </span>
          
          {/* 语音按钮 (暂未实现) */}
          <button
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            disabled={disabled || isStreaming}
            title="语音输入"
          >
            <Mic size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageInput