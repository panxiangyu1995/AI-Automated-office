import { useState, useMemo } from 'react'
import { ApprovalContentRenderer, ApprovalFlowProgress } from './ApprovalContentRenderer'
import { ApprovalActionPanel } from './ApprovalActionPanel'
import {
  type ApprovalInstance,
  type ApprovalActionRequest,
  type ApprovalPermissionContext,
  resolveApprovalPermission,
} from '../types/approval.types'

export interface ApprovalDetailPageProps {
  instance: ApprovalInstance
  currentUserId: string
  currentUserRoles: string[]
  onAction: (request: ApprovalActionRequest) => Promise<void>
}

/**
 * Approval Detail Page - Integrates dynamic content rendering with fixed action panel
 * 
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ Header (Title, Status, Initiator)   │
 * ├─────────────────────────────────────┤
 * │ Flow Progress (horizontal timeline)  │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │ Dynamic Content Area                │
 * │ (DetailSectionRenderer)             │
 * │                                     │
 * │ - Field blocks                      │
 * │ - Attachment blocks                 │
 * │ - Relation blocks                   │
 * │ - Timeline blocks                   │
 * │                                     │
 * ├─────────────────────────────────────┤
 * │ Fixed Action Panel                  │
 * │ (Approve/Reject/Withdraw/etc.)      │
 * └─────────────────────────────────────┘
 */
export function ApprovalDetailPage({
  instance,
  currentUserId,
  currentUserRoles,
  onAction,
}: ApprovalDetailPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resolve permission context
  const permissionContext = useMemo<ApprovalPermissionContext>(
    () => resolveApprovalPermission(instance, currentUserId, currentUserRoles),
    [instance, currentUserId, currentUserRoles]
  )

  // Get current approval node
  const currentNode = useMemo(
    () => instance.flow.nodes.find((n) => n.id === instance.flow.currentNodeId),
    [instance]
  )

  // Handle approval actions
  const handleAction = async (request: ApprovalActionRequest) => {
    setIsSubmitting(true)
    try {
      await onAction({
        ...request,
        instanceId: instance.id,
        nodeId: currentNode?.id,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Status badge styling
  const statusBadgeClass = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }[instance.status]

  return (
    <div className="approval-detail-page flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{instance.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{instance.typeName}</span>
              <span>•</span>
              <span>Initiated by {instance.createdByName}</span>
              <span>•</span>
              <span>{new Date(instance.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass}`}>
            {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
          </span>
        </div>
      </header>

      {/* Flow Progress */}
      <ApprovalFlowProgress flow={instance.flow} />

      {/* Dynamic Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto p-4">
        <ApprovalContentRenderer
          instance={instance}
          permissionContext={permissionContext}
        />
      </main>

      {/* Fixed Action Panel - Always visible at bottom */}
      {permissionContext.allowedActions.length > 0 && (
        <footer className="sticky bottom-0 z-10">
          <ApprovalActionPanel
            permissionContext={permissionContext}
            currentNode={currentNode}
            onAction={handleAction}
            isSubmitting={isSubmitting}
          />
        </footer>
      )}
    </div>
  )
}

/**
 * Approval Detail Page Shell - For loading/error states
 */
export function ApprovalDetailPageShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="approval-detail-page-shell flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="h-6 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex-1 p-4">
        {children || (
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded bg-slate-100" />
            <div className="h-24 animate-pulse rounded bg-slate-100" />
            <div className="h-48 animate-pulse rounded bg-slate-100" />
          </div>
        )}
      </div>
    </div>
  )
}
