/**
 * 用户列表数据 Hook
 *
 * @module useUsers
 * @description 用于获取和管理用户列表数据
 */

import { useState, useEffect, useCallback } from 'react'
import { userApi, resolveErrorMessage } from '../api/userApi'
import type { UserListItem, UserFilters, ListUsersResponse } from '../types/user.types'

interface UseUsersOptions {
  initialPage?: number
  initialPageSize?: number
}

interface UseUsersReturn {
  users: UserListItem[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  filters: UserFilters
  setFilters: (filters: UserFilters) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  refresh: () => Promise<void>
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { initialPage = 1, initialPageSize = 20 } = options

  const [users, setUsers] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserFilters>({})

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response: ListUsersResponse = await userApi.listUsers({
        page,
        page_size: pageSize,
        name: filters.name,
        employee_code: filters.employee_code,
        department_id: filters.department_id,
        status: filters.status === 'all' ? undefined : filters.status,
      })

      setUsers(response.items)
      setTotal(response.total)
    } catch (err) {
      setError(resolveErrorMessage(err, '获取用户列表'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const handleSetFilters = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }, [])

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when page size changes
  }, [])

  const refresh = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  return {
    users,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refresh,
  }
}
