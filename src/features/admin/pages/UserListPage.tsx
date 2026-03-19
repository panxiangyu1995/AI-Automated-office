/**
 * 用户列表页面
 *
 * @module UserListPage
 * @description 展示用户列表，支持分页和筛选
 */

import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTable, UserFilters } from '../components'
import { useUsers } from '../hooks/useUsers'
import { useUserMutations } from '../hooks/useUserMutations'
import type { UserFilters as UserFiltersType, UserStatus, DepartmentOption } from '../types/user.types'

// Mock departments - in real app, this would come from an API
const mockDepartments: DepartmentOption[] = [
  { id: '1', name: '研发部' },
  { id: '2', name: '市场部' },
  { id: '3', name: '人事部' },
  { id: '4', name: '财务部' },
  { id: '5', name: '销售部' },
]

export function UserListPage() {
  const navigate = useNavigate()
  const {
    users,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    refresh,
  } = useUsers()

  const { error: mutationError, updateStatus } = useUserMutations()
  const [localError, setLocalError] = useState<string | null>(null)

  // Combine errors
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

  const handleEditUser = useCallback((userId: string) => {
    navigate(`/admin/users/${userId}/edit`)
  }, [navigate])

  const handleStatusChange = useCallback(async (userId: string, status: UserStatus) => {
    const success = await updateStatus(userId, status)
    if (success) {
      refresh()
    }
  }, [updateStatus, refresh])

  const handleFilter = useCallback((newFilters: UserFiltersType) => {
    setFilters(newFilters)
  }, [setFilters])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <Button onClick={handleCreateUser} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
          <UserPlus className="h-4 w-4" />
          创建用户
        </Button>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 space-y-6">
          {/* Filters */}
          <UserFilters
            filters={filters}
            departments={mockDepartments}
            onFilter={handleFilter}
          />

          {/* Table */}
          <UserTable
            users={users}
            loading={loading}
            onEdit={handleEditUser}
            onStatusChange={handleStatusChange}
          />

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-600">
                共 <span className="font-medium">{total}</span> 条记录，
                第 <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span> 页
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
  )
}
