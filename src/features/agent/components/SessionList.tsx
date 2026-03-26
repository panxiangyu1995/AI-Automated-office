/**
 * SessionList - 会话列表组件
 * Story 4.2 - 会话管理功能
 * 
 * 显示所有会话，支持切换、重命名、删除
 * 
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 #1E3A5F
 * - ARCH: 分层架构，连接 runtime session store
 */

import { useState, useMemo } from 'react'
import { MessageSquare, Plus, MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useChatStore, type ChatSession } from '../hooks/useChatStore'

// ==================== Types ====================

interface SessionListProps {
  className?: string
  onNewSession?: () => void
  onSelectSession?: (sessionId: string) => void
}

// ==================== Session Item ====================

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

function SessionItem({ session, isActive, onSelect, onRename, onDelete }: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)
  const [showMenu, setShowMenu] = useState(false)
  
  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
    setShowMenu(false)
  }
  
  const handleCancelEdit = () => {
    setEditTitle(session.title)
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }
  
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-slate-100 text-slate-700'
      )}
      style={isActive ? { backgroundColor: 'rgba(30, 58, 95, 0.1)' } : undefined}
      onClick={() => !isEditing && onSelect()}
    >
      {/* Icon */}
      <MessageSquare size={16} className="flex-shrink-0" />
      
      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="flex-1 px-2 py-0.5 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ borderColor: '#1E3A5F' }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session.title}</p>
          <p className="text-xs text-slate-400">{formatDate(session.updatedAt)}</p>
        </div>
      )}
      
      {/* Actions */}
      {isEditing ? (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleSaveEdit() }}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCancelEdit() }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className={cn('opacity-0 group-hover:opacity-100 transition-opacity', showMenu && 'opacity-100')}>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
            >
              <MoreVertical size={14} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={(e) => { 
                      e.stopPropagation()
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} />
                    重命名
                  </button>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation()
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Main Component ====================

export function SessionList({ className, onNewSession, onSelectSession }: SessionListProps) {
  const { 
    sessions, 
    activeSessionId, 
    setActiveSession, 
    updateSessionTitle, 
    deleteSession,
    createSession 
  } = useChatStore(
    useShallow((state) => ({
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
      setActiveSession: state.setActiveSession,
      updateSessionTitle: state.updateSessionTitle,
      deleteSession: state.deleteSession,
      createSession: state.createSession,
    }))
  )
  
  // Sort sessions by updatedAt (newest first)
  const sortedSessions = useMemo(() => {
    return Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [sessions])
  
  const handleNewSession = () => {
    createSession()
    onNewSession?.()
  }
  
  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId)
    onSelectSession?.(sessionId)
  }
  
  const handleRenameSession = (sessionId: string, title: string) => {
    updateSessionTitle(sessionId, title)
  }
  
  const handleDeleteSession = (sessionId: string) => {
    // Confirm before delete
    if (window.confirm('确定要删除这个会话吗？')) {
      deleteSession(sessionId)
    }
  }
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">会话列表</h3>
        <button
          onClick={handleNewSession}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="新建会话"
        >
          <Plus size={18} />
        </button>
      </div>
      
      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <MessageSquare size={24} className="mb-2" />
            <p className="text-sm">暂无会话</p>
            <button
              onClick={handleNewSession}
              className="mt-2 text-sm text-primary hover:underline"
              style={{ color: '#1E3A5F' }}
            >
              开始新对话
            </button>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => handleSelectSession(session.id)}
              onRename={(title) => handleRenameSession(session.id, title)}
              onDelete={() => handleDeleteSession(session.id)}
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      {sortedSessions.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-200 text-xs text-slate-400">
          共 {sortedSessions.length} 个会话
        </div>
      )}
    </div>
  )
}

export default SessionList
