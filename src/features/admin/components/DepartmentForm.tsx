/**
 * 部门表单组件
 *
 * @module DepartmentForm
 * @description 创建和编辑部门的表单组件
 */

import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DepartmentDetail, DepartmentOption } from '../types/organization.types'

interface DepartmentFormProps {
  mode: 'create' | 'edit'
  initialValues?: DepartmentDetail
  departments: DepartmentOption[]
  parentId?: string
  onSubmit: (data: CreateDepartmentData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface CreateDepartmentData {
  name: string
  code: string
  parent_id?: string
  leader_id?: string
  sort_order: number
  status: 'active' | 'inactive'
}

interface FormData {
  name: string
  code: string
  parent_id: string
  sort_order: number
  status: 'active' | 'inactive'
}

interface FormErrors {
  name?: string
  code?: string
}

export function DepartmentForm({
  mode,
  initialValues,
  departments,
  parentId,
  onSubmit,
  onCancel,
  loading = false,
}: DepartmentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    parent_id: parentId || '',
    sort_order: 0,
    status: 'active',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setFormData({
        name: initialValues.name || '',
        code: initialValues.code || '',
        parent_id: initialValues.parent_id || '',
        sort_order: initialValues.sort_order || 0,
        status: initialValues.status || 'active',
      })
    } else if (mode === 'create' && parentId) {
      setFormData((prev) => ({
        ...prev,
        parent_id: parentId,
      }))
    }
  }, [mode, initialValues, parentId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入部门名称'
    }

    if (!formData.code.trim()) {
      newErrors.code = '请输入部门编码'
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.code)) {
      newErrors.code = '编码只能包含字母、数字、下划线和连字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit({
      name: formData.name,
      code: formData.code,
      parent_id: formData.parent_id || undefined,
      sort_order: formData.sort_order,
      status: formData.status,
    })
  }

  // 过滤掉当前部门（编辑模式）及其子部门
  const availableParents = departments.filter((dept) => {
    if (mode === 'edit' && initialValues) {
      return dept.id !== initialValues.id
    }
    return true
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 部门名称 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          部门名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="请输入部门名称"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* 部门编码 */}
      <div className="space-y-2">
        <Label htmlFor="code">
          部门编码 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
          }
          placeholder="例如：TECH-001"
          disabled={loading}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code}</p>
        )}
      </div>

      {/* 上级部门 */}
      <div className="space-y-2">
        <Label htmlFor="parent_id">上级部门</Label>
        <Select
          value={formData.parent_id || 'none'}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              parent_id: value === 'none' ? '' : value,
            }))
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择上级部门" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">无（顶级部门）</SelectItem>
            {availableParents.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {'　'.repeat(dept.level)}
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 排序号 */}
      <div className="space-y-2">
        <Label htmlFor="sort_order">排序号</Label>
        <Input
          id="sort_order"
          type="number"
          min={0}
          value={formData.sort_order}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              sort_order: parseInt(e.target.value, 10) || 0,
            }))
          }
          placeholder="数值越小越靠前"
          disabled={loading}
        />
      </div>

      {/* 状态 */}
      <div className="space-y-2">
        <Label htmlFor="status">状态</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'active' | 'inactive') =>
            setFormData((prev) => ({ ...prev, status: value }))
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              提交中...
            </>
          ) : mode === 'create' ? (
            <>
              <Building2 className="h-4 w-4" />
              创建部门
            </>
          ) : (
            '保存修改'
          )}
        </Button>
      </div>
    </form>
  )
}
