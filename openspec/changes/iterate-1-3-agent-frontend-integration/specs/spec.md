# 规格文档 - Agent前端集成

## 接口变更

### useAgentRuntime参数

```typescript
interface UseAgentRuntimeOptions {
  tenantId: string;    // 必须，从认证上下文获取
  userId: string;     // 必须，从认证上下文获取
  autoInit?: boolean;
  onError?: (error: AgentError) => void;
  onSessionEnd?: (reason: string, duration: number) => void;
}
```

### AgentError类型

```typescript
interface AgentError {
  code: 'PROVIDER_NOT_CONFIGURED' | 'EXECUTION_ERROR' | 'INTERRUPTED' | 'UNKNOWN';
  message: string;
  recoverable: boolean;
}
```

## 验收标准

1. tenantId和userId必须有效
2. 错误代码正确分类
3. 错误消息用户友好
