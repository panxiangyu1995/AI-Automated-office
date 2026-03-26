import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// 开发模式下是否启用模拟认证
const DEV_MODE_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // 开发模式下，如果启用了绕过认证，直接设置认证状态
    if (DEV_MODE_BYPASS_AUTH && !isAuthenticated) {
      useAuthStore.setState({
        user: {
          id: 'dev-user',
          username: 'dev',
          name: '开发用户',
          email: 'dev@example.com',
          department: '开发部',
          tenant_id: 'default',
          role: 'admin',
          roles: ['admin'],
          status: 'active',
        },
        accessToken: 'dev-token',
        refreshToken: 'dev-refresh-token',
        permissions: {
          roles: ['admin'],
          permissions: ['*'],
          dataScopes: {},
          department_ids: ['*'],
        },
        isAuthenticated: true,
      })
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true })
    }
  }, [isAuthenticated, navigate, location])

  if (!isAuthenticated && !DEV_MODE_BYPASS_AUTH) {
    return null
  }

  return <>{children}</>
}
