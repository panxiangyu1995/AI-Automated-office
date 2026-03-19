/**
 * 用户变更 Hook
 *
 * @module useUserMutations
 * @description 用于用户创建、更新、状态变更等操作
 */

import { useState, useCallback } from 'react'
import { userApi, resolveErrorMessage } from '../api/userApi'
import type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserStatus,
} from '../types/user.types'

interface UseUserMutationsReturn {
  creating: boolean
  updating: boolean
  statusUpdating: boolean
  error: string | null
  createUser: (request: CreateUserRequest) => Promise<CreateUserResponse | null>
  updateUser: (userId: string, request: UpdateUserRequest) => Promise<boolean>
  updateStatus: (userId: string, status: UserStatus, reason?: string) => Promise<boolean>
  clearError: () => void
}

export function useUserMutations(): UseUserMutationsReturn {
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = useCallback(async (request: CreateUserRequest): Promise<CreateUserResponse | null> => {
    setCreating(true)
    setError(null)

    try {
      const response = await userApi.createUser(request)
      return response
    } catch (err) {
      const message = resolveErrorMessage(err, '创建用户')
      setError(message)
      return null
    } finally {
      setCreating(false)
    }
  }, [])

  const updateUser = useCallback(async (userId: string, request: UpdateUserRequest): Promise<boolean> => {
    setUpdating(true)
    setError(null)

    try {
      await userApi.updateUser(userId, request)
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '更新用户')
      setError(message)
      return false
    } finally {
      setUpdating(false)
    }
  }, [])

  const updateStatus = useCallback(async (userId: string, status: UserStatus, reason?: string): Promise<boolean> => {
    setStatusUpdating(true)
    setError(null)

    try {
      await userApi.updateUserStatus(userId, { status, reason })
      return true
    } catch (err) {
      const message = resolveErrorMessage(err, '更新用户状态')
      setError(message)
      return false
    } finally {
      setStatusUpdating(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    creating,
    updating,
    statusUpdating,
    error,
    createUser,
    updateUser,
    updateStatus,
    clearError,
  }
}
