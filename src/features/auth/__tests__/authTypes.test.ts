import { describe, it, expect } from 'vitest'
import type { User, LoginRequest, LoginResponse, PermissionSummary, TokenPair, AuthError, ApiEnvelope } from '../types/auth.types'

describe('Auth Types', () => {
  describe('User interface', () => {
    it('should create a valid user object', () => {
      const user: User = {
        id: 'user-001',
        username: 'admin',
        name: '管理员',
        department: 'IT',
        role: 'admin',
      }
      expect(user.id).toBe('user-001')
      expect(user.role).toBe('admin')
    })

    it('should support optional email', () => {
      const user: User = {
        id: 'user-002',
        username: 'zhangsan',
        name: '张三',
        email: 'zhangsan@company.com',
        department: 'Sales',
        role: 'user',
      }
      expect(user.email).toBe('zhangsan@company.com')
    })

    it('should support optional status', () => {
      const user: User = {
        id: 'user-003',
        username: 'lisi',
        name: '李四',
        department: 'HR',
        role: 'user',
        status: 'active',
      }
      expect(user.status).toBe('active')
    })

    it('should support multiple roles', () => {
      const user: User = {
        id: 'user-004',
        username: 'wangwu',
        name: '王五',
        department: 'Finance',
        role: 'user',
        roles: ['user', 'finance_admin'],
      }
      expect(user.roles).toHaveLength(2)
      expect(user.roles).toContain('finance_admin')
    })
  })

  describe('PermissionSummary interface', () => {
    it('should create a valid permission summary', () => {
      const perms: PermissionSummary = {
        roles: ['admin', 'hr_manager'],
        permissions: ['hr_employee_read', 'hr_employee_write', 'finance_invoice_read'],
        dataScopes: { department: 'all' },
      }
      expect(perms.roles).toContain('admin')
      expect(perms.permissions).toHaveLength(3)
    })

    it('should support optional department_ids', () => {
      const perms: PermissionSummary = {
        roles: ['user'],
        permissions: ['hr_employee_read'],
        dataScopes: {},
        department_ids: ['dept-001', 'dept-002'],
      }
      expect(perms.department_ids).toHaveLength(2)
    })
  })

  describe('LoginRequest interface', () => {
    it('should create a valid login request', () => {
      const request: LoginRequest = {
        username: 'admin',
        password: 'password123',
      }
      expect(request.username).toBe('admin')
      expect(request.rememberMe).toBeUndefined()
    })

    it('should support rememberMe option', () => {
      const request: LoginRequest = {
        username: 'admin',
        password: 'password123',
        rememberMe: true,
      }
      expect(request.rememberMe).toBe(true)
    })
  })

  describe('LoginResponse interface', () => {
    it('should create a valid login response', () => {
      const response: LoginResponse = {
        user: { id: '1', username: 'admin', name: 'Admin', department: 'IT', role: 'admin' },
        accessToken: 'at-xxx',
        refreshToken: 'rt-xxx',
        expiresIn: 3600,
      }
      expect(response.user.username).toBe('admin')
      expect(response.expiresIn).toBe(3600)
    })
  })

  describe('TokenPair interface', () => {
    it('should create a valid token pair', () => {
      const tokens: TokenPair = {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        expiresIn: 7200,
      }
      expect(tokens.accessToken).toBe('new-at')
    })
  })

  describe('AuthError interface', () => {
    it('should create a valid auth error', () => {
      const error: AuthError = {
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误',
      }
      expect(error.code).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('ApiEnvelope interface', () => {
    it('should create a successful envelope', () => {
      const envelope: ApiEnvelope<{ token: string }> = {
        success: true,
        data: { token: 'abc' },
      }
      expect(envelope.success).toBe(true)
      expect(envelope.data?.token).toBe('abc')
    })

    it('should create an error envelope', () => {
      const envelope: ApiEnvelope<never> = {
        success: false,
        message: 'Server error',
        code: '500',
      }
      expect(envelope.success).toBe(false)
    })
  })
})
