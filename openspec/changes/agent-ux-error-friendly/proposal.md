# Agent模块UX错误信息友好化

## Overview

优化Agent模块的错误提示，将技术错误转为用户友好的消息，添加错误toast提示，改善用户体验。

## Motivation

代码扫描发现以下UX问题：
1. **错误信息不友好**: 技术错误直接展示给用户
2. **无加载反馈**: 某些场景下无spinner/skeleton
3. **操作无确认**: 删除等危险操作无二次确认
4. **表单验证时机不当**: 提交后才显示错误

## Files to Modify

### Frontend
- `src/features/agent/components/AgentChatPanel.tsx` - 错误展示
- `src/features/agent/components/EmployeeDirectory.tsx` - 错误处理
- `src/features/agent/components/ChatMessage.tsx` - 错误卡片
- `src/features/agent/components/SubAgentDelegatePanel.tsx` - 错误toast
- `src/features/agent/components/AgentCreateEditDialog.tsx` - 表单验证

### New Files
- `src/lib/errors/errTranslator.ts` - 错误翻译层
- `src/components/ui/toast.tsx` (if not exists) - Toast组件

## Specification

### 1. 错误翻译层设计

**文件**: `src/lib/errors/errTranslator.ts`

```typescript
// 错误码到友好消息的映射
const errorMessages: Record<string, { title: string; message: string; action?: string }> = {
  'ERR_NETWORK_TIMEOUT': {
    title: '网络连接超时',
    message: '无法连接到服务器，请检查网络后重试',
    action: '重试'
  },
  'ERR_AUTH_TOKEN_EXPIRED': {
    title: '登录已过期',
    message: '您的登录已过期，请重新登录',
    action: '重新登录'
  },
  'ERR_STORAGE_QUOTA_EXCEEDED': {
    title: '存储空间不足',
    message: '本地存储空间已满，请清理后重试',
    action: '查看详情'
  },
  'ERR_TOOL_NOT_FOUND': {
    title: '工具不可用',
    message: '请求的工具暂时不可用，请稍后重试',
    action: '重试'
  },
  'ERR_AGENT_LOOP_DETECTED': {
    title: '对话循环',
    message: '检测到对话陷入循环，已自动停止',
    action: '开始新对话'
  },
  // 默认错误
  'DEFAULT': {
    title: '出错了',
    message: '操作失败，请稍后重试',
    action: '重试'
  }
};

export function translateError(error: Error | string): UserFriendlyError {
  const code = typeof error === 'string' ? error : error.code || 'DEFAULT';
  const template = errorMessages[code] || errorMessages['DEFAULT'];
  
  return {
    ...template,
    originalError: typeof error === 'string' ? null : error
  };
}
```

### 2. AgentChatPanel错误展示优化

**之前**:
```tsx
{hasError && (
  <div className="...">
    {runtimeError}  // 直接显示技术错误
  </div>
)}
```

**之后**:
```tsx
{hasError && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{translatedError.title}</AlertTitle>
    <AlertDescription>
      {translatedError.message}
      {translatedError.action && (
        <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
          {translatedError.action}
        </Button>
      )}
    </AlertDescription>
  </Alert>
)}
```

### 3. EmployeeDirectory错误处理优化

**之前**:
```typescript
console.error('Failed to fetch employees:', err)
setError('获取员工列表失败')
// Fallback to mock data on error
```

**之后**:
```typescript
const handleError = (err: Error) => {
  const friendly = translateError(err);
  setError(friendly.message); // 显示友好消息
  toast({
    title: friendly.title,
    description: friendly.message,
    variant: 'destructive',
  });
};
```

### 4. 表单验证实时化

**之前**:
```tsx
const handleSubmit = (data: AgentFormData) => {
  if (!validate()) return  // 提交时才验证
  onSubmit(data)
}
```

**之后**:
```tsx
const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  // 实时验证
  validateField(field, value)
}

// 实时错误显示
{errors.name && (
  <p className="text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
    {errors.name}
  </p>
)}
```

### 5. Toast通知组件

```typescript
import { toast } from '@/components/ui/use-toast';

export function showErrorToast(error: Error | string) {
  const friendly = translateError(error);
  toast({
    title: friendly.title,
    description: friendly.message,
    variant: 'destructive',
    action: friendly.action ? (
      <Button variant="outline" size="sm" onClick={handleAction}>
        {friendly.action}
      </Button>
    ) : undefined,
  });
}
```

---

## Testing

1. 触发各种错误场景
2. 验证错误消息是否友好
3. 验证Toast是否正常显示
4. 验证表单实时验证是否工作
