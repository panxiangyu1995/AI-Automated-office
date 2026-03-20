/**
 * 岗位表单组件
 *
 * @module PositionForm
 * @description 创建和编辑岗位的表单组件
 */

import { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import type { PositionDetail, DepartmentOption } from '../types/organization.types'

interface PositionFormProps {
  mode: 'create' | 'edit'
  initialValues?: PositionDetail
  departments: DepartmentOption[]
  defaultDepartmentId?: string
  onSubmit: (data: CreatePositionData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface CreatePositionData {
  name: string
  code: string
  department_id: string
  level: string
  description?: string
  responsibilities?: string
  requirements?: string
  status: 'active' | 'inactive'
}

interface FormData {
  name: string
  code: string
  department_id: string
  level: string
  description: string
  responsibilities: string
  requirements: string
  status: 'active' | 'inactive'
}

interface FormErrors {
  name?: string
  code?: string
  department_id?: string
  level?: string
}

// 常用岗位级别
const POSITION_LEVELS = [
  { value: 'P1', label: 'P1 - 初级' },
  { value: 'P2', label: 'P2 - 初中级' },
  { value: 'P3', label: 'P3 - 中级' },
  { value: 'P4', label: 'P4 - 中高级' },
  { value: 'P5', label: 'P5 - 高级' },
  { value: 'P6', label: 'P6 - 资深' },
  { value: 'P7', label: 'P7 - 专家' },
  { value: 'P8', label: 'P8 - 高级专家' },
  { value: 'M1', label: 'M1 - 主管' },
  { value: 'M2', label: 'M2 - 经理' },
  { value: 'M3', label: 'M3 - 高级经理' },
  { value: 'M4', label: 'M4 - 总监' },
  { value: 'M5', label: 'M5 - 高级总监' },
]

export function PositionForm({
  mode,
  initialValues,
  departments,
  defaultDepartmentId,
  onSubmit,
  onCancel,
  loading = false,
}: PositionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    department_id: defaultDepartmentId || '',
    level: '',
    description: '',
    responsibilities: '',
    requirements: '',
    status: 'active',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setFormData({
        name: initialValues.name || '',
        code: initialValues.code || '',
        department_id: initialValues.department_id || '',
        level: initialValues.level || '',
        description: initialValues.description || '',
        responsibilities: initialValues.responsibilities || '',
        requirements: initialValues.requirements || '',
        status: initialValues.status || 'active',
      })
    } else if (mode === 'create' && defaultDepartmentId) {
      setFormData((prev) => ({
        ...prev,
        department_id: defaultDepartmentId,
      }))
    }
  }, [mode, initialValues, defaultDepartmentId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入岗位名称'
    }

    if (!formData.code.trim()) {
      newErrors.code = '请输入岗位编码'
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.code)) {
      newErrors.code = '编码只能包含字母、数字、下划线和连字符'
    }

    if (!formData.department_id) {
      newErrors.department_id = '请选择所属部门'
    }

    if (!formData.level.trim()) {
      newErrors.level = '请选择岗位级别'
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
      department_id: formData.department_id,
      level: formData.level,
      description: formData.description || undefined,
      responsibilities: formData.responsibilities || undefined,
      requirements: formData.requirements || undefined,
      status: formData.status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 岗位名称 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          岗位名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="例如：前端高级工程师"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* 岗位编码 */}
      <div className="space-y-2">
        <Label htmlFor="code">
          岗位编码 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
          }
          placeholder="例如：POS-FE-01"
          disabled={loading}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code}</p>
        )}
      </div>

      {/* 所属部门 */}
      <div className="space-y-2">
        <Label htmlFor="department_id">
          所属部门 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.department_id}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, department_id: value }))
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择所属部门" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {'　'.repeat(dept.level)}
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.department_id && (
          <p className="text-sm text-red-500">{errors.department_id}</p>
        )}
      </div>

      {/* 岗位级别 */}
      <div className="space-y-2">
        <Label htmlFor="level">
          岗位级别 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.level}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, level: value }))
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择岗位级别" />
          </SelectTrigger>
          <SelectContent>
            {POSITION_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.level && (
          <p className="text-sm text-red-500">{errors.level}</p>
        )}
      </div>

      {/* 岗位描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">岗位描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="请输入岗位描述"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* 工作职责 */}
      <div className="space-y-2">
        <Label htmlFor="responsibilities">工作职责</Label>
        <Textarea
          id="responsibilities"
          value={formData.responsibilities}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, responsibilities: e.target.value }))
          }
          placeholder="请输入工作职责"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* 任职要求 */}
      <div className="space-y-2">
        <Label htmlFor="requirements">任职要求</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, requirements: e.target.value }))
          }
          placeholder="请输入任职要求"
          rows={3}
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
              <Briefcase className="h-4 w-4" />
              创建岗位
            </>
          ) : (
            '保存修改'
          )}
        </Button>
      </div>
    </form>
  )
}
