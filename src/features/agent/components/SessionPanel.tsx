/**
 * SessionPanel - 会话管理面板
 * Story 4.2 - 会话管理功能
 * 
 * 左侧会话列表 + 右侧对话区域
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，连接 runtime session store
 */

import { useState, useCallback, useEffect } from 'react'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import { SessionList } from './SessionList'
import { AgentChatPanel } from './AgentChatPanel'
import { useChatStore } from '../hooks/useChatStore'
import { cn } from '@/lib/utils'

// ==================== Types ====================

interface SessionPanelProps {
  className?: string
  onSendMessage?: (content: string) => Promise<void>
  onStopGeneration?: () => void
  defaultShowSidebar?: boolean
}

// ==================== Main Component ====================

export function SessionPanel({ 
  className,
  onSendMessage,
  onStopGeneration,
  defaultShowSidebar = true
}: SessionPanelProps) {
  const [showSidebar, setShowSidebar] = useState(defaultShowSidebar)
  const { activeSessionId, createSession } = useChatStore()
  
  // 初始化：创建默认会话
  useEffect(() => {
    if (!activeSessionId) {
      createSession()
    }
  }, [activeSessionId, createSession])
  
  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev)
  }, [])
  
  return (
    <div className={cn('flex h-full bg-white', className)}>
      {/* Sidebar - Session List */}
      <div 
        className={cn(
          'border-r border-slate-200 transition-all duration-300 overflow-hidden',
          showSidebar ? 'w-64' : 'w-0'
        )}
      >
        <SessionList 
          className="h-full"
          onNewSession={() => {
            // Sidebar 保持打开状态便于看到新会话
          }}
        />
      </div>
      
      {/* Main Content - Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="absolute left-2 top-3 z-10 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title={showSidebar ? '隐藏会话列表' : '显示会话列表'}
        >
          {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        
        <AgentChatPanel
          className="h-full"
          onSendMessage={onSendMessage}
          onStopGeneration={onStopGeneration}
        />
      </div>
    </div>
  )
}

export default SessionPanel
