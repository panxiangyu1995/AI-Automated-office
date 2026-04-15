import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserForm } from '../components'
import { useUserMutations } from '../hooks/useUserMutations'
import { useAdminOptions } from '../hooks/useAdminOptions'
import { FormSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { CreateUserRequest } from '../types/user.types'

export function UserCreatePage() {
  const navigate = useNavigate()
  const { creating, error, createUser } = useUserMutations()
  const { departments, roles, loading } = useAdminOptions()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = error || localError

  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => setLocalError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [displayError])

  const handleSubmit = useCallback(
    async (data: CreateUserRequest) => {
      const result = await createUser(data)
      if (result) {
        setSuccessMessage(`用户创建成功！临时密码: ${result.temp_password}`)
      }
    },
    [createUser]
  )

  const handleBack = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  const handleGoToList = useCallback(() => {
    navigate('/admin/users')
  }, [navigate])

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">创建用户</h1>
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

        {!successMessage && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              {loading ? (
                <FormSkeleton fields={6} />
              ) : (
                <UserForm
                  mode="create"
                  departments={departments}
                  roles={roles}
                  onSubmit={handleSubmit}
                  loading={creating}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
