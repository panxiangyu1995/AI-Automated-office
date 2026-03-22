import { useMemo } from 'react'
import { DetailSectionRenderer } from '@/features/forms/runtime/DetailSectionRenderer'
import type { DetailSectionSchema } from '@/features/forms/runtime/detailSectionSchema'
import type { ApprovalInstance, ApprovalPermissionContext, ApprovalNode } from '../types/approval.types'

export interface ApprovalContentRendererProps {
  instance: ApprovalInstance
  permissionContext: ApprovalPermissionContext
  onFieldClick?: (fieldId: string) => void
  onRelationClick?: (relationId: string, relationType: string) => void
  onAttachmentClick?: (attachmentId: string) => void
}

/**
 * Renders approval content dynamically using DetailSectionRenderer
 * while respecting approval permissions
 */
export function ApprovalContentRenderer({
  instance,
  permissionContext,
  onFieldClick,
  onRelationClick,
  onAttachmentClick,
}: ApprovalContentRendererProps) {
  const { contentSchema, formData } = instance

  // Build permission context for detail section renderer
  const rendererPermissionContext = useMemo(
    () => ({
      canView: permissionContext.canView,
      canEdit: permissionContext.canEditForm,
    }),
    [permissionContext]
  )

  // Filter sections based on approval status and visibility rules
  const filteredSchema = useMemo<DetailSectionSchema>(() => {
    const schema = contentSchema.detailSchema

    // Return schema with enriched data
    return {
      ...schema,
      // Add approval-specific sections if not already defined
      sections: [
        // Standard sections from schema
        ...schema.sections,
      ],
    }
  }, [contentSchema])

  return (
    <div className="approval-content-renderer">
      <DetailSectionRenderer
        schema={filteredSchema}
        data={{
          ...formData,
          __approval: {
            status: instance.status,
            initiator: instance.flow.initiatorName,
            startedAt: instance.flow.startedAt,
          },
        }}
        permissionContext={rendererPermissionContext}
        onFieldClick={onFieldClick}
        onRelationClick={onRelationClick}
        onAttachmentClick={onAttachmentClick}
      />
    </div>
  )
}

/**
 * Renders approval flow progress
 */
export function ApprovalFlowProgress({ flow }: { flow: ApprovalInstance['flow'] }) {
  const sortedNodes = [...flow.nodes].sort((a, b) => a.order - b.order)

  return (
    <div className="approval-flow-progress border-b border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 text-sm font-medium text-slate-700">Approval Progress</div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sortedNodes.map((node, index) => (
          <div key={node.id} className="flex items-center">
            <FlowNodeIndicator node={node} isActive={node.id === flow.currentNodeId} />
            {index < sortedNodes.length - 1 && (
              <div className="mx-2 h-px w-8 bg-slate-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Individual flow node indicator
 */
function FlowNodeIndicator({ node, isActive }: { node: ApprovalNode; isActive: boolean }) {
  const statusColor = {
    draft: 'bg-slate-300',
    pending: isActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-300',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-amber-500',
    cancelled: 'bg-slate-400',
  }[node.status]

  const statusIcon = {
    draft: '○',
    pending: isActive ? '●' : '○',
    approved: '✓',
    rejected: '✕',
    withdrawn: '↩',
    cancelled: '—',
  }[node.status]

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${statusColor} text-xs font-bold text-white`}
        title={`${node.name} - ${node.status}`}
      >
        {statusIcon}
      </div>
      <div className="mt-1 max-w-16 truncate text-xs text-slate-600">{node.name}</div>
      {node.operatorName && (
        <div className="text-xs text-slate-400">{node.operatorName}</div>
      )}
    </div>
  )
}
