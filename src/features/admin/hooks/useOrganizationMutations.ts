/**
 * 组织管理变更 Hook
 *
 * @module useOrganizationMutations
 * @description 用于部门和岗位的增删改操作
 */

import { useState, useCallback } from 'react'
import { departmentApi, positionApi, resolveErrorMessage } from '../api/organizationApi'
import type {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
} from '../types/organization.types'

interface UseDepartmentMutationsReturn {
  loading: boolean
  error: string | null
  create: (request: CreateDepartmentRequest) => Promise<{ id: string } | null>
  update: (id: string, request: UpdateDepartmentRequest) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  clearError: () => void
}

export function useDepartmentMutations(): UseDepartmentMutationsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (request: CreateDepartmentRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await departmentApi.create(request)
      return result
    } catch (err) {
      const message = resolveErrorMessage(err, '创建部门')
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, request: UpdateDepartmentRequest) => {
    setLoading(true)
    setError(null)

    try {
      await departmentApi.update(id, request)
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '更新部门')
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await departmentApi.delete(id)
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '删除部门')
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    create,
    update,
    remove,
    clearError,
  }
}

interface UsePositionMutationsReturn {
  loading: boolean
  error: string | null
  create: (request: CreatePositionRequest) => Promise<{ id: string } | null>
  update: (id: string, request: UpdatePositionRequest) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  clearError: () => void
}

export function usePositionMutations(): UsePositionMutationsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (request: CreatePositionRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await positionApi.create(request)
      return result
    } catch (err) {
      const message = resolveErrorMessage(err, '创建岗位')
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, request: UpdatePositionRequest) => {
    setLoading(true)
    setError(null)

    try {
      await positionApi.update(id, request)
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '更新岗位')
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await positionApi.delete(id)
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '删除岗位')
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    create,
    update,
    remove,
    clearError,
  }
}
