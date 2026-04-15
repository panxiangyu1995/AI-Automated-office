import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTable, UserFilters } from '../components'
import { useUsers } from '../hooks/useUsers'
import { useUserMutations } from '../hooks/useUserMutations'
import { useAdminOptions } from '../hooks/useAdminOptions'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { UserFilters as UserFiltersType, UserStatus } from '../types/user.types'

export function UserListPage() {
  const navigate = useNavigate()
  const { users, total, page, pageSize, loading, error, filters, setFilters, setPage, refresh } =
    useUsers()

  const { error: mutationError, updateStatus } = useUserMutations()
  const { departments } = useAdminOptions()
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = error || mutationError || localError

  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => setLocalError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [displayError])

  const handleCreateUser = useCallback(() => {
    navigate('/admin/users/create')
  }, [navigate])

  const handleEditUser = useCallback(
    (userId: string) => {
      navigate(`/admin/users/${userId}/edit`)
    },
    [navigate]
  )

  const handleStatusChange = useCallback(
    async (userId: string, status: UserStatus) => {
      const success = await updateStatus(userId, status)
      if (success) {
        refresh()
      }
    },
    [updateStatus, refresh]
  )

  const handleFilter = useCallback(
    (newFilters: UserFiltersType) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  const totalPages = Math.ceil(total / pageSize)

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <Button onClick={handleCreateUser} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
            <UserPlus className="h-4 w-4" />
            创建用户
          </Button>
        </div>

        {displayError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 space-y-6">
            <UserFilters filters={filters} departments={departments} onFilter={handleFilter} />

            {loading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : users.length === 0 ? (
              <EmptyState
                variant="data"
                title="暂无用户"
                description="还没有创建任何用户，点击上方按钮创建第一个用户"
                action={{ label: '创建用户', onClick: handleCreateUser }}
              />
            ) : (
              <UserTable
                users={users}
                loading={loading}
                onEdit={handleEditUser}
                onStatusChange={handleStatusChange}
              />
            )}

            {total > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">
                  共 <span className="font-medium">{total}</span> 条记录， 第{' '}
                  <span className="font-medium">{page}</span> /{' '}
                  <span className="font-medium">{totalPages}</span> 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages || loading}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
