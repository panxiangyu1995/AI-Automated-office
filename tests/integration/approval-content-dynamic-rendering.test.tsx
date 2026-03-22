import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ApprovalDetailPage,
  ApprovalDetailPageShell,
} from '@/features/approval/components/ApprovalDetailPage'
import { ApprovalActionPanel } from '@/features/approval/components/ApprovalActionPanel'
import { ApprovalContentRenderer } from '@/features/approval/components/ApprovalContentRenderer'
import {
  resolveApprovalPermission,
  type ApprovalInstance,
  type ApprovalPermissionContext,
} from '@/features/approval/types/approval.types'

// Mock instance data
const createMockInstance = (overrides?: Partial<ApprovalInstance>): ApprovalInstance => ({
  id: 'inst-001',
  title: 'Leave Application',
  type: 'leave',
  typeName: 'Leave Request',
  schemaId: 'schema-001',
  contentSchema: {
    id: 'content-schema-001',
    version: '1.0.0',
    detailSchema: {
      id: 'detail-schema-001',
      version: { version: '1.0.0' },
      sections: [
        {
          id: 'basic-info',
          title: 'Basic Information',
          order: 1,
          layout: 'grid',
          columns: 2,
          blocks: [
            { id: 'applicant', type: 'field', fieldId: 'applicantName' },
            { id: 'leave-type', type: 'field', fieldId: 'leaveType' },
            { id: 'start-date', type: 'field', fieldId: 'startDate' },
            { id: 'end-date', type: 'field', fieldId: 'endDate' },
          ],
        },
        {
          id: 'reason',
          title: 'Reason',
          order: 2,
          blocks: [{ id: 'reason-text', type: 'field', fieldId: 'reason' }],
        },
      ],
      fields: [
        { id: 'applicantName', label: 'Applicant', type: 'input' },
        { id: 'leaveType', label: 'Leave Type', type: 'input' },
        { id: 'startDate', label: 'Start Date', type: 'date' },
        { id: 'endDate', label: 'End Date', type: 'date' },
        { id: 'reason', label: 'Reason', type: 'input' },
      ],
    },
  },
  flow: {
    id: 'flow-001',
    name: 'Leave Approval Flow',
    status: 'pending',
    currentNodeId: 'node-2',
    nodes: [
      { id: 'node-1', type: 'start', name: 'Submit', order: 1, status: 'approved', operatorId: 'user-001', operatorName: 'John Doe' },
      { id: 'node-2', type: 'approval', name: 'Manager Approval', order: 2, status: 'pending', assigneeType: 'user', assigneeIds: ['user-002'] },
      { id: 'node-3', type: 'approval', name: 'HR Review', order: 3, status: 'pending' },
      { id: 'node-4', type: 'end', name: 'Complete', order: 4, status: 'pending' },
    ],
    initiatorId: 'user-001',
    initiatorName: 'John Doe',
    startedAt: '2024-01-15T10:00:00Z',
  },
  formData: {
    applicantName: 'John Doe',
    leaveType: 'Annual Leave',
    startDate: '2024-02-01',
    endDate: '2024-02-05',
    reason: 'Family vacation',
  },
  status: 'pending',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  createdBy: 'user-001',
  createdByName: 'John Doe',
  ...overrides,
})

describe('Approval Permission Resolution', () => {
  it('allows approver to approve/reject when pending', () => {
    const instance = createMockInstance()
    const permission = resolveApprovalPermission(instance, 'user-002', [])

    expect(permission.canView).toBe(true)
    expect(permission.canApprove).toBe(true)
    expect(permission.canReject).toBe(true)
    expect(permission.canWithdraw).toBe(false)
    expect(permission.allowedActions).toContain('approve')
    expect(permission.allowedActions).toContain('reject')
  })

  it('allows initiator to withdraw when pending', () => {
    const instance = createMockInstance()
    const permission = resolveApprovalPermission(instance, 'user-001', [])

    expect(permission.canView).toBe(true)
    expect(permission.canApprove).toBe(false)
    expect(permission.canWithdraw).toBe(true)
    expect(permission.allowedActions).toContain('withdraw')
  })

  it('restricts actions when not assigned', () => {
    const instance = createMockInstance()
    const permission = resolveApprovalPermission(instance, 'user-999', [])

    expect(permission.canView).toBe(false)
    expect(permission.canApprove).toBe(false)
    expect(permission.allowedActions).toHaveLength(0)
  })

  it('allows role-based assignment', () => {
    const instance = createMockInstance({
      flow: {
        ...createMockInstance().flow,
        nodes: [
          { id: 'node-1', type: 'start', name: 'Submit', order: 1, status: 'approved', operatorId: 'user-001', operatorName: 'John Doe' },
          { id: 'node-2', type: 'approval', name: 'Manager Approval', order: 2, status: 'pending', assigneeType: 'role', assigneeIds: ['manager-role'] },
          { id: 'node-3', type: 'end', name: 'Complete', order: 3, status: 'pending' },
        ],
      },
    })

    const permission = resolveApprovalPermission(instance, 'user-003', ['manager-role'])

    expect(permission.canApprove).toBe(true)
    expect(permission.allowedActions).toContain('approve')
  })
})

describe('Approval Detail Page', () => {
  it('renders approval instance with dynamic content', () => {
    const instance = createMockInstance()
    const onAction = vi.fn()

    render(
      <ApprovalDetailPage
        instance={instance}
        currentUserId="user-002"
        currentUserRoles={[]}
        onAction={onAction}
      />
    )

    expect(screen.getByText('Leave Application')).toBeInTheDocument()
    expect(screen.getByText('Leave Request')).toBeInTheDocument()
    expect(screen.getByText('Initiated by John Doe')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows action panel for approver', () => {
    const instance = createMockInstance()
    const onAction = vi.fn()

    render(
      <ApprovalDetailPage
        instance={instance}
        currentUserId="user-002"
        currentUserRoles={[]}
        onAction={onAction}
      />
    )

    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })

  it('hides action panel when no allowed actions', () => {
    const instance = createMockInstance()
    const onAction = vi.fn()

    render(
      <ApprovalDetailPage
        instance={instance}
        currentUserId="user-999"
        currentUserRoles={[]}
        onAction={onAction}
      />
    )

    expect(screen.queryByText('Actions')).toBeNull()
  })

  it('shows withdraw action for initiator', () => {
    const instance = createMockInstance()
    const onAction = vi.fn()

    render(
      <ApprovalDetailPage
        instance={instance}
        currentUserId="user-001"
        currentUserRoles={[]}
        onAction={onAction}
      />
    )

    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument()
  })
})

describe('Approval Action Panel', () => {
  const mockPermissionContext: ApprovalPermissionContext = {
    canView: true,
    canApprove: true,
    canReject: true,
    canWithdraw: false,
    canDelegate: true,
    canTransfer: false,
    canAddSigner: false,
    canComment: true,
    canEditForm: false,
    allowedActions: ['approve', 'reject', 'delegate', 'comment'],
  }

  it('renders available action buttons', () => {
    const onAction = vi.fn()

    render(
      <ApprovalActionPanel
        permissionContext={mockPermissionContext}
        onAction={onAction}
      />
    )

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delegate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comment' })).toBeInTheDocument()
  })

  it('shows dialog for reject action requiring comment', async () => {
    const onAction = vi.fn()

    render(
      <ApprovalActionPanel
        permissionContext={mockPermissionContext}
        onAction={onAction}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Comment')).toBeInTheDocument()
    })
  })

  it('calls onAction with correct parameters', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined)

    render(
      <ApprovalActionPanel
        permissionContext={mockPermissionContext}
        onAction={onAction}
      />
    )

    // Click approve (immediate action)
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'approve',
        })
      )
    })
  })

  it('requires comment for reject action', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined)

    render(
      <ApprovalActionPanel
        permissionContext={mockPermissionContext}
        onAction={onAction}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Try to confirm without comment
    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmButton).toBeDisabled()

    // Add comment
    const commentInput = screen.getByLabelText('Comment')
    fireEvent.change(commentInput, { target: { value: 'Not approved' } })

    expect(confirmButton).not.toBeDisabled()
  })
})

describe('Approval Content Renderer', () => {
  it('renders dynamic content from schema', () => {
    const instance = createMockInstance()
    const permissionContext: ApprovalPermissionContext = {
      canView: true,
      canApprove: true,
      canReject: true,
      canWithdraw: false,
      canDelegate: false,
      canTransfer: false,
      canAddSigner: false,
      canComment: true,
      canEditForm: false,
      allowedActions: ['approve', 'reject', 'comment'],
    }

    render(
      <ApprovalContentRenderer
        instance={instance}
        permissionContext={permissionContext}
      />
    )

    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    // Section title has specific styling
    expect(screen.getByRole('heading', { name: 'Reason', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Annual Leave')).toBeInTheDocument()
    expect(screen.getByText('Family vacation')).toBeInTheDocument()
  })

  it('respects read-only permission', () => {
    const instance = createMockInstance()
    const permissionContext: ApprovalPermissionContext = {
      canView: true,
      canApprove: false,
      canReject: false,
      canWithdraw: false,
      canDelegate: false,
      canTransfer: false,
      canAddSigner: false,
      canComment: false,
      canEditForm: false,
      allowedActions: [],
    }

    render(
      <ApprovalContentRenderer
        instance={instance}
        permissionContext={permissionContext}
      />
    )

    // Content should be visible but read-only
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    // No edit controls should be present
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('Approval Detail Page Shell', () => {
  it('renders loading skeleton', () => {
    render(<ApprovalDetailPageShell />)

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(5)
  })

  it('renders children content', () => {
    render(
      <ApprovalDetailPageShell>
        <div>Custom content</div>
      </ApprovalDetailPageShell>
    )

    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })
})
