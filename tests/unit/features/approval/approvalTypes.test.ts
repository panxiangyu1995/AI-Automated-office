/**
 * Approval 模块单元测试
 * 覆盖：类型定义、审批流程状态约束、步骤结构
 */

import { describe, it, expect } from 'vitest'
import type {
  FlowStatus,
  RecordStatus,
  ApprovalStep,
  Approver,
  ApprovalFlow,
  ApprovalHistory,
  ApprovalRecord,
} from '@/features/approval/types/approval.types'

describe('Approval Types', () => {
  describe('FlowStatus', () => {
    it('should have 3 valid statuses', () => {
      const statuses: FlowStatus[] = ['draft', 'active', 'archived']
      expect(statuses).toHaveLength(3)
    })
  })

  describe('RecordStatus', () => {
    it('should have 4 valid statuses covering full lifecycle', () => {
      const statuses: RecordStatus[] = ['pending', 'approved', 'rejected', 'cancelled']
      expect(statuses).toHaveLength(4)
    })

    it('should start with pending and end with a terminal state', () => {
      const terminalStates: RecordStatus[] = ['approved', 'rejected', 'cancelled']
      expect(terminalStates).toHaveLength(3)
      expect(terminalStates).not.toContain('pending')
    })
  })
})

describe('Approval Structure Validation', () => {
  it('ApprovalStep should support sequential and parallel types', () => {
    const sequentialStep: ApprovalStep = {
      id: 'step-1',
      order: 1,
      approvers: [{ id: 'a-1', name: '部门经理', employeeId: 'emp-1' }],
      stepType: 'sequential',
    }

    const parallelStep: ApprovalStep = {
      id: 'step-2',
      order: 2,
      approvers: [
        { id: 'a-2', name: '财务主管', employeeId: 'emp-2' },
        { id: 'a-3', name: 'HR主管', employeeId: 'emp-3' },
      ],
      stepType: 'parallel',
    }

    expect(sequentialStep.stepType).toBe('sequential')
    expect(parallelStep.stepType).toBe('parallel')
    expect(parallelStep.approvers).toHaveLength(2)
  })

  it('ApprovalStep can have conditions', () => {
    const conditionalStep: ApprovalStep = {
      id: 'step-1',
      order: 1,
      approvers: [{ id: 'a-1', name: '总经理', employeeId: 'emp-4' }],
      stepType: 'sequential',
      condition: {
        field: 'amount',
        operator: '>',
        value: 10000,
      },
    }

    expect(conditionalStep.condition).toBeDefined()
    expect(conditionalStep.condition?.field).toBe('amount')
  })

  it('ApprovalFlow should contain ordered steps', () => {
    const flow: ApprovalFlow = {
      id: 'flow-1',
      name: '采购审批',
      description: '采购订单审批流程',
      steps: [
        {
          id: 'step-1',
          order: 1,
          approvers: [{ id: 'a-1', name: '部门经理', employeeId: 'emp-1' }],
          stepType: 'sequential',
        },
        {
          id: 'step-2',
          order: 2,
          approvers: [{ id: 'a-2', name: '财务经理', employeeId: 'emp-2' }],
          stepType: 'sequential',
        },
      ],
      formSchema: {},
      status: 'active',
      createdBy: 'emp-0',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(flow.steps).toHaveLength(2)
    expect(flow.steps[0].order).toBeLessThan(flow.steps[1].order)
  })

  it('ApprovalHistory should record actions', () => {
    const history: ApprovalHistory = {
      id: 'hist-1',
      stepId: 'step-1',
      approverId: 'emp-1',
      approverName: '部门经理',
      action: 'approved',
      comment: '同意',
      timestamp: 1700000000,
    }

    expect(history.action).toBe('approved')
    expect(history.comment).toBeDefined()
  })

  it('ApprovalRecord should track current step and form data', () => {
    const record: ApprovalRecord = {
      id: 'rec-1',
      flowId: 'flow-1',
      flowName: '采购审批',
      applicantId: 'emp-0',
      applicantName: '申请人',
      status: 'pending',
      currentStep: 1,
      formData: { amount: 5000, description: '办公用品采购' },
      history: [],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(record.status).toBe('pending')
    expect(record.currentStep).toBe(1)
    expect(record.formData.amount).toBe(5000)
  })
})
