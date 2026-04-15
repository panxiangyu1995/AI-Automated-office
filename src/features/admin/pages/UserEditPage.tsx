import { useCallback, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '../components'
import { useUserMutations } from '../hooks/useUserMutations'
import { useAdminOptions } from '../hooks/useAdminOptions'
import { userApi } from '../api/userApi'
import { FormSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { UpdateUserRequest, UserDetail, UserSummary } from '../types/user.types'

export function UserEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { updating, error, updateUser } = useUserMutations()
  const { departments, roles } = useAdminOptions()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = error || localError

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

  const handleSubmit = useCallback(
    async (data: UpdateUserRequest) => {
      if (!id) return

      const success = await updateUser(id, data)
      if (success) {
        setSuccessMessage('用户信息更新成功！')
      }
    },
    [id, updateUser]
  )

  const handleSearchManager = useCallback(
    async (query: string): Promise<UserSummary[]> => {
      if (!id) return []
      try {
        return await userApi.searchUsersForManager(id, query, 10)
      } catch (err) {
        console.error('Search manager failed:', err)
        return []
      }
    },
    [id]
  )

  const handleBack = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  const handleGoToList = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">编辑用户</h1>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <FormSkeleton fields={6} />
        </div>
      </div>
    )
  }

  if (!user && !loading) {
    return (
      <EmptyState
        variant="data"
        title="用户不存在"
        description="找不到该用户的信息，可能已被删除"
        action={{ label: '返回列表', onClick: handleBack }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">编辑用户</h1>
        </div>

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

        {displayError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        {!successMessage && user && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <UserForm
                mode="edit"
                initialValues={user}
                departments={departments}
                roles={roles}
                onSubmit={handleSubmit}
                loading={updating}
                currentUserId={id}
                onSearchManager={handleSearchManager}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
