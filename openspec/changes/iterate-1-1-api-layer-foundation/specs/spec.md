# Spec: 前端API层与类型定义基础设施

## 接口定义

### ApiResponse<T>

```typescript
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}
```

### PaginatedResponse<T>

```typescript
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
```

### ApiError

```typescript
export class ApiError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: Record<string, string>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### useApi Hook返回值

```typescript
interface UseApiReturn<T, A extends any[] = []> {
  data: T | null
  loading: boolean
  error: ApiError | null
  execute: (...args: A) => Promise<T>
  reset: () => void
}
```

## 验收标准

1. TypeScript编译零错误
2. npm run build 成功
3. 所有新增文件可正确导入
4. useApi Hook在组件中可正常使用
5. 不影响现有任何页面功能
