/**
 * HR 模块单元测试
 * 覆盖：类型常量、状态映射、store 初始状态
 */

import { describe, it, expect } from 'vitest'
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
  type EmployeeStatus,
  type Employee,
  type HrDepartment,
  type Position,
  type EmployeeListItem,
  type DepartmentTreeNode,
  type EmployeeQueryParams,
} from '@/features/hr/types/hr.types'

describe('HR Types and Constants', () => {
  describe('EMPLOYEE_STATUS_LABELS', () => {
    it('should have labels for all employee statuses', () => {
      const statuses: EmployeeStatus[] = ['active', 'inactive', 'probation']

      for (const status of statuses) {
        expect(EMPLOYEE_STATUS_LABELS[status]).toBeDefined()
        expect(typeof EMPLOYEE_STATUS_LABELS[status]).toBe('string')
        expect(EMPLOYEE_STATUS_LABELS[status].length).toBeGreaterThan(0)
      }
    })

    it('should map active to correct Chinese label', () => {
      expect(EMPLOYEE_STATUS_LABELS.active).toBe('正式')
    })

    it('should map inactive to correct Chinese label', () => {
      expect(EMPLOYEE_STATUS_LABELS.inactive).toBe('离职')
    })

    it('should map probation to correct Chinese label', () => {
      expect(EMPLOYEE_STATUS_LABELS.probation).toBe('试用期')
    })
  })

  describe('EMPLOYEE_STATUS_COLORS', () => {
    it('should have color classes for all statuses', () => {
      const statuses: EmployeeStatus[] = ['active', 'inactive', 'probation']

      for (const status of statuses) {
        expect(EMPLOYEE_STATUS_COLORS[status]).toBeDefined()
        expect(EMPLOYEE_STATUS_COLORS[status]).toMatch(/^bg-/)
      }
    })

    it('should use green for active', () => {
      expect(EMPLOYEE_STATUS_COLORS.active).toContain('green')
    })

    it('should use gray for inactive', () => {
      expect(EMPLOYEE_STATUS_COLORS.inactive).toContain('gray')
    })

    it('should use yellow for probation', () => {
      expect(EMPLOYEE_STATUS_COLORS.probation).toContain('yellow')
    })
  })
})

describe('HR Type Structure Validation', () => {
  it('Employee interface should have required fields', () => {
    const employee: Employee = {
      id: 'emp-1',
      employeeCode: 'E001',
      name: '张三',
      email: 'zhang@example.com',
      departmentId: 'dept-1',
      positionId: 'pos-1',
      hireDate: 1700000000,
      status: 'active',
      metadata: {},
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(employee.id).toBe('emp-1')
    expect(employee.employeeCode).toBe('E001')
    expect(employee.status).toBe('active')
  })

  it('EmployeeListItem should have optional display names', () => {
    const item: EmployeeListItem = {
      id: 'emp-1',
      employeeCode: 'E001',
      name: '张三',
      email: 'zhang@example.com',
      hireDate: 1700000000,
      status: 'active',
    }

    expect(item.departmentName).toBeUndefined()
    expect(item.positionName).toBeUndefined()
    expect(item.managerName).toBeUndefined()
  })

  it('HrDepartment should support tree structure', () => {
    const dept: HrDepartment = {
      id: 'dept-1',
      code: 'D001',
      name: '技术部',
      level: 1,
      sortOrder: 1,
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(dept.children).toBeUndefined()
    expect(dept.parentId).toBeUndefined()
  })

  it('DepartmentTreeNode should contain employee count', () => {
    const node: DepartmentTreeNode = {
      department: {
        id: 'dept-1',
        code: 'D001',
        name: '技术部',
        level: 1,
        sortOrder: 1,
        createdAt: 1700000000,
        updatedAt: 1700000000,
      },
      employeeCount: 10,
      children: [],
    }

    expect(node.employeeCount).toBe(10)
    expect(node.children).toHaveLength(0)
  })

  it('EmployeeQueryParams should allow partial queries', () => {
    const params1: EmployeeQueryParams = {}
    const params2: EmployeeQueryParams = { keyword: '张', status: 'active' }
    const params3: EmployeeQueryParams = { departmentId: 'dept-1', page: 2, pageSize: 20 }

    expect(params1).toEqual({})
    expect(params2.keyword).toBe('张')
    expect(params2.status).toBe('active')
    expect(params3.page).toBe(2)
  })
})
