# Design: Admin模块mock数据替换与UX增强

## 涉及文件

- `src/features/admin/services/adminApi.ts` (新增)
- `src/features/admin/pages/UserListPage.tsx` (修改)
- `src/features/admin/pages/UserCreatePage.tsx` (修改)
- `src/features/admin/pages/UserEditPage.tsx` (修改)
- `src/features/admin/pages/OrganizationPage.tsx` (修改)

## 技术设计

### 1. Admin API Service

使用已有的 ApiClient 封装 admin 相关 API：

```typescript
// src/features/admin/services/adminApi.ts
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export const adminApi = {
  getDepartments: () => apiClient.request<Department[]>({ method: 'GET', url: '/api/hr/departments' }),
  getPositions: () => apiClient.request<Position[]>({ method: 'GET', url: '/api/hr/positions' }),
  getRoles: () => apiClient.request<Role[]>({ method: 'GET', url: '/api/admin/roles' }),
  getUsers: (params?: PaginationParams) => apiClient.request<PaginatedResponse<User>>({ ... }),
  getUser: (id: string) => apiClient.request<User>({ ... }),
  createUser: (data: CreateUserDTO) => apiClient.request<User>({ method: 'POST', ... }),
  updateUser: (id: string, data: UpdateUserDTO) => apiClient.request<User>({ method: 'PUT', ... }),
  updateStatus: (id: string, status: string) => apiClient.request<void>({ method: 'PATCH', ... }),
}
```

### 2. UserListPage改造

- 移除 mockDepartments 硬编码
- 用 useApi 获取部门数据
- 加载时显示 TableSkeleton
- 无数据时显示 EmptyState
- ErrorBoundary 包裹整个页面

### 3. UserCreatePage/UserEditPage改造

- 移除 mockDepartments/mockRoles 硬编码
- 用 useApi 获取部门和角色数据
- 加载时显示 FormSkeleton

## 数据流变化

mock硬编码 → useApi Hook → ApiClient → 后端API（当前无后端时优雅降级到空数据+EmptyState）
