import { useState, useEffect, useCallback } from 'react'
import { departmentApi, resolveErrorMessage } from '../api/organizationApi'
import type { DepartmentOption, RoleOption } from '../types/user.types'

const FALLBACK_DEPARTMENTS: DepartmentOption[] = [
  { id: '1', name: '研发部' },
  { id: '2', name: '市场部' },
  { id: '3', name: '人事部' },
  { id: '4', name: '财务部' },
  { id: '5', name: '销售部' },
]

const FALLBACK_ROLES: RoleOption[] = [
  { id: '1', name: '管理员', code: 'admin' },
  { id: '2', name: '普通用户', code: 'user' },
  { id: '3', name: '部门经理', code: 'dept_manager' },
]

interface UseAdminOptionsReturn {
  departments: DepartmentOption[]
  roles: RoleOption[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOptions(): UseAdminOptionsReturn {
  const [departments, setDepartments] = useState<DepartmentOption[]>(FALLBACK_DEPARTMENTS)
  const [roles] = useState<RoleOption[]>(FALLBACK_ROLES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await departmentApi.list({})
      // ListDepartmentsResponse has items directly (already unwrapped from ApiEnvelope by requestApi)
      if (result?.items && Array.isArray(result.items)) {
        const items = result.items
        if (items.length > 0) {
          setDepartments(
            items.map((d) => ({
              id: d.id,
              name: d.name,
            }))
          )
        }
      }
    } catch (err) {
      setError(resolveErrorMessage(err, 'fetchOptions'))
      // Fallback data already set as initial state, so UI will still work
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return { departments, roles, loading, error, refresh: fetchOptions }
}
