# 规格文档 - 错误处理完善

## FriendlyError接口

```typescript
interface FriendlyError {
  code: string;
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
}
```

## 错误分类

```typescript
type ErrorCategory = 
  | 'NETWORK'
  | 'AUTH'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN';
```

## getFriendlyError函数

```typescript
function getFriendlyError(error: unknown): FriendlyError
```

根据原始错误类型返回用户友好的错误信息：

| 错误类型 | title | message示例 |
|---------|-------|-----------|
| NetworkError | 网络错误 | 无法连接服务器，请检查网络设置 |
| AuthError | 认证错误 | 登录已过期，请重新登录 |
| ValidationError | 输入错误 | 请检查输入内容是否正确 |
| ServerError | 服务器错误 | 服务器繁忙，请稍后重试 |
| Unknown | 系统错误 | 发生未知错误，请联系管理员 |

## 辅助函数

```typescript
function isNetworkError(error: unknown): boolean
function isAuthError(error: unknown): boolean
function isValidationError(error: unknown): boolean
function isServerError(error: unknown): boolean
```

## 验收标准

1. 所有错误消息都有友好的title和message
2. 关键操作提供action按钮
3. 错误分类100%覆盖
