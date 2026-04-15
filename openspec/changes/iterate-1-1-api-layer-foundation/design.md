# Design: 前端API层与类型定义基础设施

## 涉及文件

- `src/lib/api/client.ts` - API客户端（新增）
- `src/lib/api/endpoints.ts` - API端点定义（新增）
- `src/lib/api/index.ts` - 统一导出（新增）
- `src/types/api.types.ts` - API响应类型定义（新增）
- `src/hooks/useApi.ts` - 通用请求Hook（新增）

## 技术设计

### 1. API客户端 (src/lib/api/client.ts)

基于fetch的统一请求客户端，支持：

- 基础URL配置（通过环境变量）
- 请求/响应拦截器（自动添加token、统一错误处理）
- 请求取消（AbortController）
- 超时处理
- 重试逻辑（指数退避）

```typescript
// 核心接口
interface ApiClientOptions {
  baseUrl: string
  timeout?: number
  retries?: number
}

interface ApiResponse<T> {
  data: T
  message: string
  code: number
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
}
```

### 2. API端点定义 (src/lib/api/endpoints.ts)

按模块组织的端点常量：

```typescript
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    currentUser: '/api/auth/me',
  },
  hr: {
    employees: '/api/hr/employees',
    departments: '/api/hr/departments',
    positions: '/api/hr/positions',
  },
  // ... 其他模块
} as const
```

### 3. useApi Hook (src/hooks/useApi.ts)

通用请求状态管理：

```typescript
interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}
```

### 4. 类型定义 (src/types/api.types.ts)

统一的API响应类型、错误类型、分页类型。

## 数据流变化

- 无变化（新增基础设施，不改动现有数据流）
