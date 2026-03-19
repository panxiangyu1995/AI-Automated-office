/**
 * 用户表单组件
 *
 * @module UserForm
 * @description 创建和编辑用户的表单组件
 */

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type {
  DepartmentOption,
  RoleOption,
  UserDetail,
} from '../types/user.types'

interface UserFormProps {
  mode: 'create' | 'edit'
  initialValues?: UserDetail
  departments: DepartmentOption[]
  roles: RoleOption[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

interface FormData {
  username: string
  real_name: string
  employee_code: string
  email: string
  phone: string
  department_ids: string[]
  role_ids: string[]
  send_notification: boolean
}

interface FormErrors {
  username?: string
  real_name?: string
  employee_code?: string
  email?: string
  phone?: string
}

export function UserForm({
  mode,
  initialValues,
  departments,
  roles,
  onSubmit,
  loading = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    real_name: '',
    employee_code: '',
    email: '',
    phone: '',
    department_ids: [],
    role_ids: [],
    send_notification: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setFormData({
        username: initialValues.username || '',
        real_name: initialValues.real_name || '',
        employee_code: initialValues.employee_code || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        department_ids: initialValues.departments?.map((d) => d.id) || [],
        role_ids: initialValues.roles?.map((r) => r.id) || [],
        send_notification: false,
      })
    }
  }, [mode, initialValues])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (mode === 'create') {
      if (!formData.username.trim()) {
        newErrors.username = '请输入用户名'
      }
      if (!formData.employee_code.trim()) {
        newErrors.employee_code = '请输入工号'
      }
    }

    if (!formData.real_name.trim()) {
      newErrors.real_name = '请输入真实姓名'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (mode === 'create') {
      await onSubmit({
        username: formData.username,
        real_name: formData.real_name,
        employee_code: formData.employee_code,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        department_ids: formData.department_ids,
        role_ids: formData.role_ids,
        send_notification: formData.send_notification,
      })
    } else {
      await onSubmit({
        real_name: formData.real_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        department_ids: formData.department_ids,
        role_ids: formData.role_ids,
      })
    }
  }

  const handleDepartmentToggle = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter((id) => id !== deptId)
        : [...prev.department_ids, deptId],
    }))
  }

  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 用户名 - 仅创建模式 */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="username">
            用户名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
            placeholder="请输入用户名"
            disabled={loading}
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username}</p>
          )}
        </div>
      )}

      {/* 真实姓名 */}
      <div className="space-y-2">
        <Label htmlFor="real_name">
          真实姓名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="real_name"
          value={formData.real_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, real_name: e.target.value }))
          }
          placeholder="请输入真实姓名"
          disabled={loading}
        />
        {errors.real_name && (
          <p className="text-sm text-red-500">{errors.real_name}</p>
        )}
      </div>

      {/* 工号 - 仅创建模式 */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="employee_code">
            工号 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="employee_code"
            value={formData.employee_code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, employee_code: e.target.value }))
            }
            placeholder="请输入工号"
            disabled={loading}
          />
          {errors.employee_code && (
            <p className="text-sm text-red-500">{errors.employee_code}</p>
          )}
        </div>
      )}

      {/* 邮箱 */}
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="请输入邮箱"
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* 手机号 */}
      <div className="space-y-2">
        <Label htmlFor="phone">手机号</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          placeholder="请输入手机号"
          disabled={loading}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* 部门选择 */}
      <div className="space-y-2">
        <Label>所属部门</Label>
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <label
              key={dept.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              <Checkbox
                checked={formData.department_ids.includes(dept.id)}
                onCheckedChange={() => handleDepartmentToggle(dept.id)}
              />
              <span className="text-sm">{dept.name}</span>
            </label>
          ))}
        </div>
        {departments.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无可选部门</p>
        )}
      </div>

      {/* 角色选择 */}
      <div className="space-y-2">
        <Label>分配角色</Label>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
            >
              <Checkbox
                checked={formData.role_ids.includes(role.id)}
                onCheckedChange={() => handleRoleToggle(role.id)}
              />
              <span className="text-sm">{role.name}</span>
            </label>
          ))}
        </div>
        {roles.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无可选角色</p>
        )}
      </div>

      {/* 发送通知 - 仅创建模式 */}
      {mode === 'create' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="send_notification"
            checked={formData.send_notification}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                send_notification: checked === true,
              }))
            }
          />
          <Label htmlFor="send_notification" className="cursor-pointer">
            发送账号创建通知
          </Label>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              提交中...
            </>
          ) : mode === 'create' ? (
            <>
              <UserPlus className="h-4 w-4" />
              创建用户
            </>
          ) : (
            '保存修改'
          )}
        </Button>
      </div>
    </form>
  )
}
