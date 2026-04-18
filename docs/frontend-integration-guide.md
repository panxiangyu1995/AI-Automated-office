# 前后端集成开发规范

## 概述

本文档定义了 AI-Automated-Office 前后端集成的开发规范和最佳实践，确保前后端通信的类型安全、错误处理一致、用户体验统一。

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Rust + Tauri
- **状态管理**: Zustand
- **UI组件**: Shadcn/ui + Tailwind CSS

## API 调用模式

### 1. Tauri 命令调用

使用 `useTauriCommand` Hook 进行类型安全的命令调用：

```typescript
import { useTauriCommand } from '@/hooks/useTauriCommand'

// 基础用法
function MyComponent() {
  const { data, loading, error, execute } = useTauriCommand<MyType[]>({
    command: 'module_list_items',
    params: { status: 'active' },
  })
  
  if (loading) return <Skeleton />
  if (error) return <ErrorDisplay error={error.message} onRetry={execute} />
  
  return <DataList data={data} />
}
```

### 2. 直接调用

使用 `invokeCommand` 进行一次性调用：

```typescript
import { invokeCommand } from '@/hooks/useTauriCommand'

const result = await invokeCommand<MyType[]>('module_list_items', { status: 'active' })
```

### 3. 带超时的调用

```typescript
import { invokeCommandWithTimeout } from '@/hooks/useTauriCommand'

const result = await invokeCommandWithTimeout<MyType[]>('module_list_items', {}, 10000)
```

### 4. 批量调用

```typescript
import { invokeBatch } from '@/hooks/useTauriCommand'

const results = await invokeBatch<MyType[]>([
  { command: 'module_a_list' },
  { command: 'module_b_list' },
])
```

## 错误处理

### 1. 错误类型

```typescript
interface TauriError {
  code: string      // 错误码，如 'AUTH_001'
  message: string    // 用户友好的错误信息
  details?: Record<string, string>  // 详细错误信息
}
```

### 2. 错误展示组件

```typescript
import { ApiErrorDisplay } from '@/components/common/ApiErrorDisplay'

// 自动识别错误类型并展示
<ApiErrorDisplay 
  error={error}
  onRetry={execute}
  onAuthError={() => navigate('/login')}
/>
```

### 3. 错误码规范

| 错误码 | 类型 | 说明 |
|--------|------|------|
| AUTH_xxx | 认证错误 | 登录失效、权限不足 |
| PERM_xxx | 权限错误 | 无权访问资源 |
| VAL_xxx | 验证错误 | 参数校验失败 |
| SYS_xxx | 系统错误 | 服务器内部错误 |
| NET_xxx | 网络错误 | 网络连接问题 |

## 数据加载状态

### 1. DataView 组件

```typescript
import { DataView } from '@/components/common/DataView'

<DataView
  data={items}
  loading={loading}
  error={error?.message}
  loadingComponent={<Skeleton />}
  emptyMessage="暂无数据"
  onRetry={refetch}
>
  {/* 内容 */}
</DataView>
```

### 2. Skeleton 骨架屏

```typescript
import { CardSkeleton, TableSkeleton, ListSkeleton } from '@/components/common/Skeleton'

// 卡片骨架
<CardSkeleton />

// 表格骨架
<TableSkeleton rows={5} columns={4} />

// 列表骨架
<ListSkeleton count={3} />
```

## 模块 Hooks 模式

每个业务模块应提供以下 Hooks：

### 列表 Hooks

```typescript
// 列表
function useModuleItems(filter?: Filter) {
  return useTauriCommand<Item[]>({
    command: 'module_list_items',
    params: filter,
  })
}

// 单个
function useModuleItem(id: string | null) {
  return useTauriCommand<Item | null>({
    command: 'module_get_item',
    params: id ? { id } : undefined,
  })
}
```

### 操作 Hooks

```typescript
// 创建
function useCreateItem() {
  return useTauriCommand<Item>({ command: 'module_create_item' })
}

// 更新
function useUpdateItem() {
  return useTauriCommand<Item>({ command: 'module_update_item' })
}

// 删除
function useDeleteItem() {
  return useTauriCommand<void>({ command: 'module_delete_item' })
}
```

### 统计 Hooks

```typescript
function useModuleStats() {
  return useTauriCommand<ModuleStats>({ command: 'module_get_stats' })
}
```

## 数据表格

```typescript
import { DataTable } from '@/components/common/DataTable'

const columns = [
  { key: 'name', header: '名称', sortable: true },
  { key: 'status', header: '状态', render: (item) => <StatusBadge status={item.status} /> },
]

<DataTable
  columns={columns}
  data={items}
  selectable
  onRowClick={(item) => navigate(`/detail/${item.id}`)}
  actions={[
    { key: 'edit', label: '编辑', onClick: handleEdit },
    { key: 'delete', label: '删除', onClick: handleDelete },
  ]}
/>
```

## 表单提交

```typescript
import { useFormSubmit } from '@/hooks/useFormSubmit'

function MyForm() {
  const { submit, loading, error } = useFormSubmit({
    onSubmit: (data) => invokeCommand('module_create', { data }),
    onSuccess: () => { toast.success('创建成功'); navigate('/list') },
  })
  
  return <Form onSubmit={submit} loading={loading} />
}
```

## 自动刷新

```typescript
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

function DataPage() {
  const { isRefreshing, lastRefreshTime, refresh } = useAutoRefresh({
    enabled: true,
    interval: 30000,
    onRefresh: fetchData,
  })
  
  return (
    <>
      <AutoRefreshBar 
        isRefreshing={isRefreshing}
        lastRefreshTime={lastRefreshTime}
        onRefresh={refresh}
      />
      {/* 内容 */}
    </>
  )
}
```

## API 契约类型

在 `src/lib/api/contracts.ts` 中定义 API 契约类型：

```typescript
// 列表项
interface ItemListItem {
  id: string
  name: string
  status: 'active' | 'inactive'
  created_at: number
}

// 详情
interface ItemDetail extends ItemListItem {
  description: string
  items: SubItem[]
}

// 统计
interface ItemStats {
  total: number
  active: number
  inactive: number
}
```

## 多租户支持

所有 API 调用必须传递 tenant_id：

```typescript
import { useAuthStore } from '@/stores/authStore'

function fetchWithTenant<T>(command: string, params: Record<string, unknown>) {
  const tenantId = useAuthStore.getState().user?.tenant_id
  return invokeCommand<T>(command, { ...params, tenantId })
}
```

## 性能优化

### 1. 缓存策略

```typescript
// 使用 staleTime 控制缓存
const { data } = useTauriCommand<Item[]>({
  command: 'module_list',
  // 5分钟缓存
  // 通过设置 cacheKey 实现手动失效
})
```

### 2. 防抖/节流

```typescript
import { useDebounce, useThrottle } from '@/hooks/useAsyncState'

// 防抖搜索
const debouncedSearch = useDebounce(searchTerm, 300)

// 节流滚动
const handleScroll = useThrottle(onScroll, 100)
```

### 3. 批量加载

```typescript
// 使用 Promise.all 并行加载
const [items, stats] = await Promise.all([
  invokeCommand<Item[]>('module_list'),
  invokeCommand<Stats>('module_stats'),
])
```

## 测试策略

### 单元测试

```typescript
// hooks/useTauriCommand.test.ts
describe('useTauriCommand', () => {
  it('should handle loading state', () => {
    // 测试加载状态
  })
  
  it('should handle error state', () => {
    // 测试错误处理
  })
})
```

### 集成测试

```typescript
// components/DataView.test.tsx
describe('DataView', () => {
  it('should show loading state', () => {
    render(<DataView loading data={null} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
```

## 最佳实践

1. **类型优先**: 先定义类型，再实现功能
2. **错误友好**: 始终展示用户友好的错误信息
3. **加载反馈**: 所有异步操作必须有加载状态
4. **乐观更新**: 对用户体验敏感的操作使用乐观更新
5. **缓存合理**: 根据数据更新频率设置合理的缓存时间
6. **多租户安全**: 所有数据访问必须验证租户权限

## 目录结构

```
src/
├── hooks/                    # 全局 Hooks
│   ├── useTauriCommand.ts   # Tauri 命令封装
│   ├── useDataFetch.ts      # 数据获取
│   ├── useFormSubmit.ts     # 表单提交
│   └── useAsyncState.ts     # 异步状态
│
├── components/
│   └── common/               # 通用组件
│       ├── DataView.tsx      # 数据视图
│       ├── DataTable.tsx     # 数据表格
│       ├── ErrorBoundary.tsx  # 错误边界
│       └── Skeleton.tsx      # 骨架屏
│
├── features/
│   └── {module}/            # 业务模块
│       ├── api/               # API 调用
│       ├── hooks/            # 模块 Hooks
│       └── components/       # 模块组件
│
└── lib/
    └── api/
        └── contracts.ts       # API 契约类型
```
