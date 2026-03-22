import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type ApprovalActionType,
  type ApprovalPermissionContext,
  type ApprovalActionRequest,
  type ApprovalNode,
} from '../types/approval.types'

export interface ApprovalActionPanelProps {
  permissionContext: ApprovalPermissionContext
  currentNode?: ApprovalNode
  onAction: (request: ApprovalActionRequest) => Promise<void>
  isSubmitting?: boolean
}

interface ActionConfig {
  id: ApprovalActionType
  label: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
  icon?: string
  requiresComment?: boolean
  requiresTarget?: boolean
}

const ACTION_CONFIGS: ActionConfig[] = [
  { id: 'approve', label: 'Approve', variant: 'default' },
  { id: 'reject', label: 'Reject', variant: 'destructive', requiresComment: true },
  { id: 'withdraw', label: 'Withdraw', variant: 'outline', requiresComment: true },
  { id: 'delegate', label: 'Delegate', variant: 'secondary', requiresTarget: true },
  { id: 'transfer', label: 'Transfer', variant: 'secondary', requiresTarget: true },
  { id: 'add_signer', label: 'Add Signer', variant: 'secondary', requiresTarget: true },
  { id: 'comment', label: 'Comment', variant: 'outline', requiresComment: true },
]

export function ApprovalActionPanel({
  permissionContext,
  currentNode,
  onAction,
  isSubmitting = false,
}: ApprovalActionPanelProps) {
  const [activeAction, setActiveAction] = useState<ApprovalActionType | null>(null)
  const [comment, setComment] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  const availableActions = ACTION_CONFIGS.filter((action) =>
    permissionContext.allowedActions.includes(action.id)
  )

  const handleActionClick = (action: ApprovalActionType) => {
    const config = ACTION_CONFIGS.find((a) => a.id === action)
    if (config?.requiresComment || config?.requiresTarget) {
      setActiveAction(action)
      setShowDialog(true)
    } else {
      // Immediate action without dialog
      performAction(action)
    }
  }

  const performAction = async (action: ApprovalActionType) => {
    const request: ApprovalActionRequest = {
      instanceId: '', // Will be set by parent
      action,
      nodeId: currentNode?.id,
      comment: comment || undefined,
      delegateTo: action === 'delegate' ? targetUser : undefined,
      transferTo: action === 'transfer' ? targetUser : undefined,
    }

    await onAction(request)
    setShowDialog(false)
    setActiveAction(null)
    setComment('')
    setTargetUser('')
  }

  const handleDialogConfirm = async () => {
    if (activeAction) {
      await performAction(activeAction)
    }
  }

  const currentConfig = ACTION_CONFIGS.find((a) => a.id === activeAction)

  if (availableActions.length === 0) {
    return null
  }

  return (
    <div className="approval-action-panel border-t border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm font-medium text-slate-700">Actions</div>

      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => {
          const config = ACTION_CONFIGS.find((a) => a.id === action.id)!
          return (
            <Button
              key={action.id}
              variant={config.variant}
              size="sm"
              onClick={() => handleActionClick(action.id)}
              disabled={isSubmitting}
            >
              {config.label}
            </Button>
          )
        })}
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentConfig?.label}</DialogTitle>
            <DialogDescription>
              {currentConfig?.requiresTarget
                ? 'Select a target user for this action.'
                : 'Add a comment for this action.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {currentConfig?.requiresTarget && (
              <div className="grid gap-2">
                <Label htmlFor="target-user">Target User</Label>
                <Select value={targetUser} onValueChange={setTargetUser}>
                  <SelectTrigger id="target-user">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">John Doe</SelectItem>
                    <SelectItem value="user2">Jane Smith</SelectItem>
                    <SelectItem value="user3">Bob Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(currentConfig?.requiresComment || currentConfig?.id === 'comment') && (
              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDialogConfirm}
              disabled={
                isSubmitting ||
                (currentConfig?.requiresTarget && !targetUser) ||
                (currentConfig?.requiresComment && !comment.trim())
              }
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
