# Tasks: 前端API层与类型定义基础设施

## Task 1: 创建API类型定义

- 文件: `src/types/api.types.ts`
- 内容: ApiResponse<T>、PaginatedResponse<T>、ApiError、RequestConfig类型
- 验收: 类型文件编译通过，可被其他文件导入

## Task 2: 创建API客户端

- 文件: `src/lib/api/client.ts`
- 内容: ApiClient类，支持fetch封装、拦截器、超时、重试
- 验收: client可实例化，支持GET/POST/PUT/DELETE方法

## Task 3: 创建API端点定义

- 文件: `src/lib/api/endpoints.ts`
- 内容: 按模块组织所有API端点常量（auth/hr/finance/sales等）
- 验收: endpoints常量可被client引用

## Task 4: 创建useApi Hook

- 文件: `src/hooks/useApi.ts`
- 内容: useApi<T> Hook，管理loading/error/data状态
- 验收: Hook返回{data, loading, error, execute, reset}，符合TypeScript类型

## Task 5: 创建统一导出

- 文件: `src/lib/api/index.ts`
- 内容: 导出client、endpoints、类型
- 验收: 可通过import { apiClient, API_ENDPOINTS } from '@/lib/api' 引用
