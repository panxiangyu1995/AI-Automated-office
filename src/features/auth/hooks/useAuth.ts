import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest } from '../types/auth.types'

export function useAuth() {
  const {
    setAuth,
    clearAuthSession,
    isAuthenticated,
    user,
    permissions,
    accessToken,
    refreshToken,
    updateToken,
  } = useAuthStore()
  const navigate = useNavigate()

  const login = async (request: LoginRequest) => {
    const response = await authApi.login(request)

    await setAuth({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
      permissions: response.permissions,
      rememberMe: request.rememberMe,
    })

    return response
  }

  const register = async (request: RegisterRequest) => {
    return authApi.register(request)
  }

  const logout = async () => {
    await clearAuthSession()
    navigate('/login', { replace: true })
  }

  const refreshSession = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokens = await authApi.refreshToken(refreshToken)
    updateToken(tokens.accessToken, tokens.refreshToken)
    return tokens
  }

  const hasPermission = (permission: string): boolean => {
    return permissions?.permissions.includes(permission) ?? false
  }

  const hasRole = (role: string): boolean => {
    return permissions?.roles.includes(role) ?? false
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((p) => hasPermission(p))
  }

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((p) => hasPermission(p))
  }

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some((r) => hasRole(r))
  }

  const hasAllRoles = (roleList: string[]): boolean => {
    return roleList.every((r) => hasRole(r))
  }

  return {
    isAuthenticated,
    user,
    permissions,
    accessToken,
    refreshToken,

    login,
    register,
    logout,
    refreshSession,

    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
  }
}
