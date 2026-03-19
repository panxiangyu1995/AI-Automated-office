/**
 * 创建用户页面
 *
 * @module UserCreatePage
 * @description 创建新用户的页面
 */

import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '../components'
import { useUserMutations } from '../hooks/useUserMutations'
import type { CreateUserRequest, DepartmentOption, RoleOption } from '../types/user.types'

// Mock data - in real app, this would come from APIs
const mockDepartments: DepartmentOption[] = [
  { id: '1', name: '研发部' },
  { id: '2', name: '市场部' },
  { id: '3', name: '人事部' },
  { id: '4', name: '财务部' },
  { id: '5', name: '销售部' },
]

const mockRoles: RoleOption[] = [
  { id: '1', name: '管理员', code: 'admin' },
  { id: '2', name: '普通用户', code: 'user' },
  { id: '3', name: '部门经理', code: 'dept_manager' },
]

export function UserCreatePage() {
  const navigate = useNavigate()
  const { creating, error, createUser } = useUserMutations()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Combine errors
  const displayError = error || localError

  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => setLocalError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [displayError])

  const handleSubmit = useCallback(async (data: CreateUserRequest) => {
    const result = await createUser(data)
    if (result) {
      setSuccessMessage(`用户创建成功！临时密码: ${result.temp_password}`)
    }
  }, [createUser])

  const handleBack = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  const handleGoToList = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">创建用户</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleGoToList}>
              返回列表
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* Form Card */}
      {!successMessage && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <UserForm
              mode="create"
              departments={mockDepartments}
              roles={mockRoles}
              onSubmit={handleSubmit}
              loading={creating}
            />
          </div>
        </div>
      )}
    </div>
  )
}
