/**
 * 岗位数据 Hook
 *
 * @module usePositions
 * @description 用于获取和管理岗位列表数据
 */

import { useState, useEffect, useCallback } from 'react'
import { positionApi, resolveErrorMessage } from '../api/organizationApi'
import type { PositionListItem, ListPositionsRequest, ListPositionsResponse } from '../types/organization.types'

interface UsePositionsOptions {
  initialPage?: number
  initialPageSize?: number
  departmentId?: string
}

interface UsePositionsReturn {
  positions: PositionListItem[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  departmentId: string | undefined
  setDepartmentId: (id: string | undefined) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  refresh: () => Promise<void>
}

export function usePositions(options: UsePositionsOptions = {}): UsePositionsReturn {
  const { initialPage = 1, initialPageSize = 20, departmentId: initialDeptId } = options

  const [positions, setPositions] = useState<PositionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | undefined>(initialDeptId)

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: ListPositionsRequest = {
        page,
        page_size: pageSize,
      }
      
      if (departmentId) {
        params.department_id = departmentId
      }

      const response: ListPositionsResponse = await positionApi.list(params)
      setPositions(response.items)
      setTotal(response.total)
    } catch (err) {
      setError(resolveErrorMessage(err, '获取岗位列表'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, departmentId])

  useEffect(() => {
    void fetchPositions()
  }, [fetchPositions])

  const handleSetDepartmentId = useCallback((id: string | undefined) => {
    setDepartmentId(id)
    setPage(1) // 重置到第一页
  }, [])

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(async () => {
    await fetchPositions()
  }, [fetchPositions])

  return {
    positions,
    total,
    page,
    pageSize,
    loading,
    error,
    departmentId,
    setDepartmentId: handleSetDepartmentId,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refresh,
  }
}
