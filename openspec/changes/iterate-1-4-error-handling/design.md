# 设计文档 - 错误处理完善

## 涉及文件

### 新增
- `src/lib/errors.ts` - 错误处理工具

### 修改
- `src/features/agent/components/AgentChatPanel.tsx`
- `src/features/dashboard/components/DashboardHome.tsx`

## 修改方案

### 1. 创建统一错误处理

```typescript
// src/lib/errors.ts
export interface FriendlyError {
  code: string;
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

export function getFriendlyError(error: unknown): FriendlyError {
  // 根据错误类型返回友好错误
}

export function isNetworkError(error: unknown): boolean
export function isAuthError(error: unknown): boolean
```

### 2. 错误分类

```typescript
enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}
```

### 3. 友好错误示例

| 原始错误 | 友好错误 |
|---------|---------|
| Connection refused | 网络连接失败，请检查网络设置 |
| 401 Unauthorized | 登录已过期，请重新登录 |
| Validation error | 请检查输入内容是否正确 |

## 数据流

```
原始错误
    ↓
getFriendlyError()
    ↓
FriendlyError { title, message, action }
    ↓
UI组件渲染
```
