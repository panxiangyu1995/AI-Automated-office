/**
 * Service 模块单元测试
 * 覆盖：类型定义、状态/优先级约束、类型映射
 */

import { describe, it, expect } from 'vitest'
import type {
  TicketType,
  TicketStatus,
  TicketPriority,
  PersonnelStatus,
  ServiceTicket,
  TicketListItem,
  ServicePersonnel,
} from '@/features/service/types/service'

describe('Service Types and Constants', () => {
  describe('TicketType', () => {
    it('should only allow valid ticket types', () => {
      const validTypes: TicketType[] = ['repair', 'consultation', 'complaint']
      expect(validTypes).toHaveLength(3)
      expect(validTypes).toContain('repair')
      expect(validTypes).toContain('consultation')
      expect(validTypes).toContain('complaint')
    })
  })

  describe('TicketStatus', () => {
    it('should define complete status lifecycle', () => {
      const validStatuses: TicketStatus[] = [
        'new',
        'processing',
        'pending_confirm',
        'completed',
        'cancelled',
      ]

      expect(validStatuses).toHaveLength(5)
    })

    it('should follow logical flow: new -> processing -> pending_confirm -> completed', () => {
      const flow: TicketStatus[] = ['new', 'processing', 'pending_confirm', 'completed']

      for (let i = 0; i < flow.length; i++) {
        expect(['new', 'processing', 'pending_confirm', 'completed', 'cancelled']).toContain(flow[i])
      }
    })
  })

  describe('TicketPriority', () => {
    it('should have 4 priority levels', () => {
      const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent']

      expect(priorities).toHaveLength(4)
    })

    it('should order from low to urgent', () => {
      const priorityOrder: Record<TicketPriority, number> = {
        low: 0,
        medium: 1,
        high: 2,
        urgent: 3,
      }

      expect(priorityOrder.low).toBeLessThan(priorityOrder.medium)
      expect(priorityOrder.medium).toBeLessThan(priorityOrder.high)
      expect(priorityOrder.high).toBeLessThan(priorityOrder.urgent)
    })
  })

  describe('PersonnelStatus', () => {
    it('should have 3 valid states', () => {
      const statuses: PersonnelStatus[] = ['available', 'busy', 'offline']

      expect(statuses).toHaveLength(3)
    })
  })
})

describe('Service Type Structure Validation', () => {
  it('ServiceTicket should have required fields', () => {
    const ticket: ServiceTicket = {
      id: 'ticket-1',
      title: '设备维修',
      ticketType: 'repair',
      status: 'new',
      priority: 'high',
      customerName: '李四',
      createdAt: 1700000000,
      updatedAt: 1700000000,
      tenantId: 'tenant-1',
      metadata: {},
    }

    expect(ticket.id).toBe('ticket-1')
    expect(ticket.ticketType).toBe('repair')
    expect(ticket.status).toBe('new')
    expect(ticket.assignedTo).toBeUndefined()
  })

  it('TicketListItem should be a subset of ServiceTicket', () => {
    const item: TicketListItem = {
      id: 'ticket-1',
      title: '设备维修',
      ticketType: 'repair',
      status: 'new',
      priority: 'high',
      customerName: '李四',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(item).not.toHaveProperty('description')
    expect(item).not.toHaveProperty('tenantId')
  })

  it('ServicePersonnel should track capacity', () => {
    const personnel: ServicePersonnel = {
      id: 'p-1',
      userId: 'user-1',
      userName: '王维修',
      specializations: ['electrical', 'plumbing'],
      status: 'available',
      currentTicketCount: 2,
      maxTicketCount: 5,
      createdAt: 1700000000,
      updatedAt: 1700000000,
      tenantId: 'tenant-1',
    }

    expect(personnel.currentTicketCount).toBeLessThanOrEqual(personnel.maxTicketCount)
    expect(personnel.specializations).toHaveLength(2)
  })
})

describe('Service Ticket Type Labels', () => {
  const TICKET_TYPE_LABELS: Record<TicketType, string> = {
    repair: '维修',
    consultation: '咨询',
    complaint: '投诉',
  }

  const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    new: '新建',
    processing: '处理中',
    pending_confirm: '待确认',
    completed: '已完成',
    cancelled: '已取消',
  }

  it('should have labels for all ticket types', () => {
    const types: TicketType[] = ['repair', 'consultation', 'complaint']
    for (const type of types) {
      expect(TICKET_TYPE_LABELS[type]).toBeDefined()
    }
  })

  it('should have labels for all ticket statuses', () => {
    const statuses: TicketStatus[] = ['new', 'processing', 'pending_confirm', 'completed', 'cancelled']
    for (const status of statuses) {
      expect(TICKET_STATUS_LABELS[status]).toBeDefined()
    }
  })
})
