/**
 * 编辑用户页面
 *
 * @module UserEditPage
 * @description 编辑现有用户的页面
 */

import { useCallback, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '../components'
import { useUserMutations } from '../hooks/useUserMutations'
import { userApi } from '../api/userApi'
import type { UpdateUserRequest, UserDetail, DepartmentOption, RoleOption } from '../types/user.types'

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

export function UserEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { updating, error, updateUser } = useUserMutations()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Combine errors
  const displayError = error || localError

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setLocalError('用户ID不存在')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userData = await userApi.getUser(id)
        setUser(userData)
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : '获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }

    void fetchUser()
  }, [id])

  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => setLocalError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [displayError])

  const handleSubmit = useCallback(async (data: UpdateUserRequest) => {
    if (!id) return

    const success = await updateUser(id, data)
    if (success) {
      setSuccessMessage('用户信息更新成功！')
    }
  }, [id, updateUser])

  const handleBack = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  const handleGoToList = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载用户信息...</p>
        </div>
      </div>
    )
  }

  if (!user && !loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <p className="text-muted-foreground">用户不存在</p>
        <Button onClick={handleBack}>返回列表</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">编辑用户</h1>
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
      {!successMessage && user && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <UserForm
              mode="edit"
              initialValues={user}
              departments={mockDepartments}
              roles={mockRoles}
              onSubmit={handleSubmit}
              loading={updating}
            />
          </div>
        </div>
      )}
    </div>
  )
}
