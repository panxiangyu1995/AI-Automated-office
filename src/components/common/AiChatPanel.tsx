import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Send } from 'lucide-react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'
import { useShortcutListener } from '../../hooks/useGlobalShortcuts'

interface AiChatPanelProps {
  children?: ReactNode
}

/**
 * AI 对话面板组件
 *
 * 功能：
 * - 响应 Ctrl+Shift+D (Cmd+Shift+D) 全局快捷键打开/关闭
 * - 可调整宽度（300-500px）
 * - 可折叠
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - FR085: 全局快捷键支持
 */
export function AiChatPanel({ children }: AiChatPanelProps) {
  const {
    chatPanelWidth,
    chatPanelCollapsed,
    setChatPanelWidth,
    toggleChatPanel,
  } = useUIStore()

  // 使用 ref 保存最新的 toggleChatPanel 函数
  const toggleChatPanelRef = useRef(toggleChatPanel)
  useEffect(() => {
    toggleChatPanelRef.current = toggleChatPanel
  }, [toggleChatPanel])

  useShortcutListener('open-ai-chat', () => {
    toggleChatPanelRef.current()
  })
  
  const [inputValue, setInputValue] = useState('')

  return (
    <ResizablePanel
      width={chatPanelWidth}
      minWidth={300}
      maxWidth={500}
      onWidthChange={setChatPanelWidth}
      direction="left"
      collapsed={chatPanelCollapsed}
      className="h-full"
    >
      <div 
        className="h-full flex flex-col border-l border-slate-200"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        {/* 头部 */}
        <header 
          className="h-12 flex items-center px-4 border-b border-slate-200 flex-shrink-0"
        >
          <h3 className="text-sm font-semibold text-slate-700">AI 助手</h3>
        </header>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {children || (
            <div className="space-y-4">
              {/* 欢迎消息 */}
              <div className="flex gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div 
                  className="flex-1 p-3 rounded-lg"
                  style={{ backgroundColor: '#F1F5F9' }}
                >
                  <p className="text-sm text-slate-700">
                    您好！我是 AI 助手，有什么可以帮助您的吗？
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  // TODO: 发送消息
                  setInputValue('')
                }
              }}
            />
            <button
              className="px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
              style={{ backgroundColor: '#1E3A5F' }}
              aria-label="发送"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </ResizablePanel>
  )
}
