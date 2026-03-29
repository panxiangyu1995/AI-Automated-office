/**
 * WorkspaceSwitcher Component
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * Dropdown component for switching between workspaces.
 */

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { Workspace } from '../../features/workspace/types'

// ==================== Icons ====================

const WorkspaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

// ==================== WorkspaceSwitcher Component ====================

interface WorkspaceSwitcherProps {
  /** Callback when workspace settings is clicked */
  onSettingsClick?: (workspace: Workspace) => void
  /** Callback when create workspace is clicked */
  onCreateWorkspace?: () => void
  /** Whether to show create button */
  showCreateButton?: boolean
  /** Additional class name */
  className?: string
}

/**
 * WorkspaceSwitcher dropdown component
 */
export function WorkspaceSwitcher({
  onSettingsClick,
  onCreateWorkspace,
  showCreateButton = true,
  className = '',
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    workspaces,
    currentWorkspace,
    isLoading,
    setCurrentWorkspace,
    fetchWorkspaces,
  } = useWorkspaceStore()

  // Fetch workspaces on mount
  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces()
    }
  }, [fetchWorkspaces, workspaces.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter workspaces by search query
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /**
   * Handle workspace selection
   */
  const handleSelectWorkspace = async (workspace: Workspace) => {
    await setCurrentWorkspace(workspace.id)
    setIsOpen(false)
    setSearchQuery('')
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <WorkspaceIcon />
        <span className="font-medium truncate max-w-[120px]">
          {currentWorkspace?.name || '选择工作区'}
        </span>
        <ChevronDownIcon />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-72 bg-background border rounded-lg shadow-lg z-50"
          onKeyDown={handleKeyDown}
        >
          {/* Search */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="搜索工作区..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* Workspace List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading && workspaces.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                加载中...
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchQuery ? '未找到匹配的工作区' : '暂无工作区'}
              </div>
            ) : (
              <ul role="listbox" className="space-y-0.5">
                {filteredWorkspaces.map((workspace) => (
                  <li key={workspace.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectWorkspace(workspace)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        workspace.id === currentWorkspace?.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <WorkspaceIcon />
                      <div className="flex-1 text-left truncate">
                        <div className="font-medium truncate">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {workspace.description}
                          </div>
                        )}
                      </div>
                      {workspace.id === currentWorkspace?.id && (
                        <CheckIcon />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          {showCreateButton && (
            <div className="p-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onCreateWorkspace?.()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
              >
                <PlusIcon />
                <span>创建新工作区</span>
              </button>
            </div>
          )}

          {/* Settings */}
          {currentWorkspace && onSettingsClick && (
            <div className="p-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onSettingsClick(currentWorkspace)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground"
              >
                <SettingsIcon />
                <span>工作区设置</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== Workspace Badge ====================

interface WorkspaceBadgeProps {
  workspace: Workspace
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

/**
 * Small badge showing workspace name
 */
export function WorkspaceBadge({
  workspace,
  size = 'sm',
  showIcon = true,
}: WorkspaceBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground font-medium ${sizeClasses[size]}`}
    >
      {showIcon && <WorkspaceIcon />}
      <span className="truncate max-w-[100px]">{workspace.name}</span>
    </span>
  )
}

export default WorkspaceSwitcher
