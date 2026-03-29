/**
 * CreateWorkspaceDialog Component
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * Dialog for creating a new workspace.
 */

import { useState } from 'react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { CreateWorkspaceRequest, Workspace, WorkspaceVisibility } from '../../features/workspace/types'

// ==================== Icons ====================

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ==================== CreateWorkspaceDialog Component ====================

interface CreateWorkspaceDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog is closed */
  onClose: () => void
  /** Callback when workspace is created */
  onCreated?: (workspace: Workspace) => void
}

/**
 * Dialog for creating a new workspace
 */
export function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const { createWorkspace, isLoading } = useWorkspaceStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<WorkspaceVisibility>(WorkspaceVisibility.Private)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('请输入工作区名称')
      return
    }

    setError(null)

    const request: CreateWorkspaceRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
    }

    const workspace = await createWorkspace(request)

    if (workspace) {
      setName('')
      setDescription('')
      setVisibility(WorkspaceVisibility.Private)
      onCreated?.(workspace)
      onClose()
    } else {
      setError('创建工作区失败，请重试')
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setName('')
    setDescription('')
    setVisibility(WorkspaceVisibility.Private)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">创建工作区</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-sm font-medium mb-1.5"
              >
                工作区名称 <span className="text-destructive">*</span>
              </label>
              <input
                id="workspace-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入工作区名称"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="workspace-description"
                className="block text-sm font-medium mb-1.5"
              >
                描述
              </label>
              <textarea
                id="workspace-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入工作区描述（可选）"
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium mb-2">
                可见性
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={WorkspaceVisibility.Private}
                    checked={visibility === WorkspaceVisibility.Private}
                    onChange={() => setVisibility(WorkspaceVisibility.Private)}
                    className="rounded-full border-foreground/20 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">私有</div>
                    <div className="text-xs text-muted-foreground">
                      只有成员可以访问
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={WorkspaceVisibility.Organization}
                    checked={visibility === WorkspaceVisibility.Organization}
                    onChange={() => setVisibility(WorkspaceVisibility.Organization)}
                    className="rounded-full border-foreground/20 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">组织内</div>
                    <div className="text-xs text-muted-foreground">
                      所有组织成员可以访问
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={WorkspaceVisibility.Public}
                    checked={visibility === WorkspaceVisibility.Public}
                    onChange={() => setVisibility(WorkspaceVisibility.Public)}
                    className="rounded-full border-foreground/20 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">公开</div>
                    <div className="text-xs text-muted-foreground">
                      任何人都可以访问
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateWorkspaceDialog
