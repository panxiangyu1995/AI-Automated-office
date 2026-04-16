import { describe, it, expect } from 'vitest'
import type { Employee, HrDepartment, Position, EmployeeStatus } from '../types/hr.types'
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types/hr.types'

describe('HR Types', () => {
  describe('EmployeeStatus', () => {
    it('should have correct status labels', () => {
      expect(EMPLOYEE_STATUS_LABELS.active).toBe('正式')
      expect(EMPLOYEE_STATUS_LABELS.inactive).toBe('离职')
      expect(EMPLOYEE_STATUS_LABELS.probation).toBe('试用期')
    })

    it('should have status colors for all statuses', () => {
      expect(EMPLOYEE_STATUS_COLORS.active).toBeDefined()
      expect(EMPLOYEE_STATUS_COLORS.inactive).toBeDefined()
      expect(EMPLOYEE_STATUS_COLORS.probation).toBeDefined()
    })

    it('should use Tailwind bg classes for status colors', () => {
      expect(EMPLOYEE_STATUS_COLORS.active).toMatch(/^bg-/)
      expect(EMPLOYEE_STATUS_COLORS.inactive).toMatch(/^bg-/)
      expect(EMPLOYEE_STATUS_COLORS.probation).toMatch(/^bg-/)
    })
  })

  describe('Employee interface', () => {
    it('should create a valid employee object', () => {
      const employee: Employee = {
        id: 'emp-001',
        employeeCode: 'E001',
        name: '张三',
        email: 'zhangsan@example.com',
        departmentId: 'dept-001',
        positionId: 'pos-001',
        hireDate: Date.now(),
        status: 'active',
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(employee.id).toBe('emp-001')
      expect(employee.status).toBe('active')
    })

    it('should support optional phone field', () => {
      const employee: Employee = {
        id: 'emp-002',
        employeeCode: 'E002',
        name: '李四',
        email: 'lisi@example.com',
        phone: '13800138000',
        departmentId: 'dept-001',
        positionId: 'pos-001',
        hireDate: Date.now(),
        status: 'probation',
        metadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(employee.phone).toBe('13800138000')
    })
  })

  describe('HrDepartment interface', () => {
    it('should create a valid department object', () => {
      const dept: HrDepartment = {
        id: 'dept-001',
        code: 'IT',
        name: '信息技术部',
        level: 1,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(dept.id).toBe('dept-001')
      expect(dept.children).toBeUndefined()
    })

    it('should support nested department children', () => {
      const child: HrDepartment = {
        id: 'dept-002',
        code: 'FE',
        name: '前端组',
        parentId: 'dept-001',
        level: 2,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const parent: HrDepartment = {
        id: 'dept-001',
        code: 'IT',
        name: '信息技术部',
        level: 1,
        sortOrder: 0,
        children: [child],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(parent.children).toHaveLength(1)
      expect(parent.children?.[0].parentId).toBe('dept-001')
    })
  })

  describe('Position interface', () => {
    it('should create a valid position object', () => {
      const position: Position = {
        id: 'pos-001',
        code: 'SE',
        name: '高级工程师',
        level: 3,
        permissions: ['hr_employee_read', 'hr_employee_write'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(position.permissions).toContain('hr_employee_read')
    })
  })
})
