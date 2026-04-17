# 设计文档 - Agent前端集成完善

## 涉及文件

- `src/features/agent/components/AgentChatPanel.tsx`
- `src/features/agent/hooks/useAgentRuntime.ts`
- `src/features/agent/hooks/useChatStore.ts`

## 修改方案

### 1. 获取用户信息

从认证store或context获取当前用户信息：

```typescript
// 获取用户上下文
const { tenantId, userId } = useAuthContext()
```

### 2. 修改useAgentRuntime调用

```typescript
const {
  backendSessionId,
  isInitialized,
  // ...
} = useAgentRuntime({
  tenantId,  // 从上下文获取
  userId,   // 从上下文获取
  autoInit: false,
})
```

### 3. 错误处理增强

完善错误分类和友好提示。

## 数据流

```
User (认证用户)
    ↓
AuthContext (tenantId, userId)
    ↓
AgentChatPanel
    ↓
useAgentRuntime({ tenantId, userId })
    ↓
Tauri IPC → Backend Runtime
```
