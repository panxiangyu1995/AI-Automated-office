/**
 * WorkspaceSettingsPage Component
 * Story 41.5 - Workspace Data Model and Basic Framework
 *
 * Settings page for a specific workspace.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { UpdateWorkspaceRequest, WorkspaceRole } from '../../features/workspace/types'

// ==================== Icons ====================

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const CrownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 4l3 12h14l3-12-5 5-4-9-4 9-5-5z" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

// ==================== Role Badge ====================

const roleLabels: Record<WorkspaceRole, string> = {
  owner: '所有者',
  admin: '管理员',
  member: '成员',
  viewer: '访客',
}

const roleColors: Record<WorkspaceRole, string> = {
  owner: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${roleColors[role]}`}>
      {role === 'owner' && <CrownIcon />}
      {role === 'admin' && <ShieldIcon />}
      {roleLabels[role]}
    </span>
  )
}

// ==================== WorkspaceSettingsPage Component ====================

interface WorkspaceSettingsPageProps {
  /** Callback when navigating back */
  onBack?: () => void
}

/**
 * Workspace settings page
 */
export function WorkspaceSettingsPage({ onBack }: WorkspaceSettingsPageProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()

  const {
    currentWorkspace,
    members,
    fetchWorkspace,
    fetchMembers,
    updateWorkspace,
    deleteWorkspace,
    updateMemberRole,
    removeMember,
    isLoading,
  } = useWorkspaceStore()

  // Local state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')

  // Fetch workspace and members
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace(workspaceId)
      fetchMembers(workspaceId)
    }
  }, [workspaceId, fetchWorkspace, fetchMembers])

  // Update local state when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name)
      setDescription(currentWorkspace.description || '')
    }
  }, [currentWorkspace])

  /**
   * Handle save
   */
  const handleSave = async () => {
    if (!workspaceId || !name.trim()) return

    const request: UpdateWorkspaceRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
    }

    await updateWorkspace(workspaceId, request)
    setIsEditing(false)
  }

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!workspaceId) return

    const success = await deleteWorkspace(workspaceId)

    if (success) {
      navigate('/workspace')
    }
  }

  /**
   * Handle member role update
   */
  const handleRoleUpdate = async (memberId: string, role: WorkspaceRole) => {
    await updateMemberRole(memberId, role)
  }

  /**
   * Handle member remove
   */
  const handleMemberRemove = async (memberId: string) => {
    await removeMember(memberId)
  }

  if (!currentWorkspace && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">工作区不存在</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b">
        <button
          type="button"
          onClick={onBack || (() => navigate(-1))}
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeftIcon />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-sm text-muted-foreground">{currentWorkspace.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-2 border-b bg-muted/30">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'general'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          常规设置
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'members'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          <UsersIcon />
          成员
          <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
            {members.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">工作区名称</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-lg">{currentWorkspace.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">
                  {currentWorkspace.description || '暂无描述'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!name.trim() || isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    保存更改
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setName(currentWorkspace.name)
                      setDescription(currentWorkspace.description || '')
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  编辑工作区
                </button>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t">
              <h3 className="text-sm font-semibold text-destructive mb-4">危险区域</h3>
              <div className="p-4 border border-destructive/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">删除工作区</h4>
                    <p className="text-sm text-muted-foreground">
                      删除后无法恢复，所有项目和成员数据都将被删除
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    删除工作区
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="max-w-4xl">
            {/* Members List */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName || member.email}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium">
                          {(member.displayName || member.email || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.displayName || member.email}
                      </div>
                      {member.displayName && (
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.role !== 'owner' ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleUpdate(member.id, e.target.value as WorkspaceRole)}
                          className="px-2 py-1 text-sm border rounded-md bg-background"
                        >
                          <option value="admin">管理员</option>
                          <option value="member">成员</option>
                          <option value="viewer">访客</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMemberRemove(member.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          title="移除成员"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-muted-foreground mb-4">
              确定要删除工作区 "{currentWorkspace.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceSettingsPage
