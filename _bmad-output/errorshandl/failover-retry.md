# 故障转移与重试机制

> 本文档详细描述 OpenClaw 的 FailoverError 设计、Auth Profile 轮换机制和重试策略。

## 一、FailoverError 设计

### 1.1 类定义

```typescript
class FailoverError extends Error {
  readonly reason: FailoverReason;  // 故障原因
  readonly provider?: string;       // Provider 标识
  readonly model?: string;          // 模型标识
  readonly profileId?: string;      // Auth Profile ID
  readonly status?: number;         // HTTP 状态码
  readonly code?: string;           // 错误码

  constructor(
    message: string,
    params: {
      reason: FailoverReason;
      provider?: string;
      model?: string;
      profileId?: string;
      status?: number;
      code?: string;
      cause?: unknown;
    },
  ) {
    super(message, { cause: params.cause });
    this.name = "FailoverError";
    // ...
  }
}
```

**源码位置**: `src/agents/failover-error.ts`

### 1.2 错误转换

```typescript
function coerceToFailoverError(
  err: unknown,
  context?: {
    provider?: string;
    model?: string;
    profileId?: string;
  },
): FailoverError | null {
  if (isFailoverError(err)) return err;
  
  const reason = resolveFailoverReasonFromError(err);
  if (!reason) return null;

  const message = getErrorMessage(err) || String(err);
  const status = getStatusCode(err) ?? resolveFailoverStatus(reason);
  const code = getErrorCode(err);

  return new FailoverError(message, {
    reason,
    provider: context?.provider,
    model: context?.model,
    profileId: context?.profileId,
    status,
    code,
    cause: err instanceof Error ? err : undefined,
  });
}
```

### 1.3 使用示例

```typescript
// 从原始错误创建 FailoverError
const failover = coerceToFailoverError(originalError, {
  provider: "openai",
  model: "gpt-4",
  profileId: "profile-123",
});

if (failover) {
  // 根据原因决定下一步操作
  switch (failover.reason) {
    case "billing":
      // 提示用户充值
      break;
    case "rate_limit":
      // 等待后重试或切换 Profile
      break;
    case "auth_permanent":
      // 标记 Profile 为不可用
      break;
  }
}
```

## 二、Auth Profile 轮换机制

### 2.1 Profile 状态管理

```typescript
type ProfileUsageStats = {
  cooldownUntil?: number;      // 冷却结束时间
  disabledUntil?: number;      // 禁用结束时间
  disabledReason?: AuthProfileFailureReason; // 禁用原因
  failureCounts?: Record<AuthProfileFailureReason, number>; // 失败计数
  lastUsedAt?: number;         // 最后使用时间
  lastGoodAt?: number;         // 最后成功时间
};
```

**源码位置**: `src/agents/auth-profiles/types.ts`

### 2.2 冷却检查

```typescript
function isProfileInCooldown(
  store: AuthProfileStore,
  profileId: string,
  now?: number,
): boolean {
  // OpenRouter 绕过冷却
  if (isAuthCooldownBypassedForProvider(store.profiles[profileId]?.provider)) {
    return false;
  }
  
  const stats = store.usageStats?.[profileId];
  if (!stats) return false;
  
  const unusableUntil = resolveProfileUnusableUntil(stats);
  const ts = now ?? Date.now();
  return unusableUntil ? ts < unusableUntil : false;
}
```

**源码位置**: `src/agents/auth-profiles/usage.ts`

### 2.3 Profile 不可用原因推断

```typescript
function resolveProfilesUnavailableReason(params: {
  store: AuthProfileStore;
  profileIds: string[];
  now?: number;
}): AuthProfileFailureReason | null {
  const scores = new Map<AuthProfileFailureReason, number>();
  
  for (const profileId of params.profileIds) {
    const stats = params.store.usageStats?.[profileId];
    if (!stats) continue;

    // 禁用状态优先级最高
    if (disabledActive && stats.disabledReason) {
      addScore(stats.disabledReason, 1_000);
      continue;
    }

    // 根据失败计数打分
    for (const [reason, count] of Object.entries(stats.failureCounts ?? {})) {
      addScore(reason, count);
    }
  }

  // 返回最高优先级的原因
  return selectHighestPriorityReason(scores);
}
```

### 2.4 标记 Profile 失败

```typescript
function markAuthProfileFailure(params: {
  store: AuthProfileStore;
  profileId: string;
  reason: AuthProfileFailureReason;
  now?: number;
}): void {
  const stats = store.usageStats[profileId] ?? {};
  
  // 增加失败计数
  stats.failureCounts = stats.failureCounts ?? {};
  stats.failureCounts[reason] = (stats.failureCounts[reason] ?? 0) + 1;
  
  // 永久性错误直接禁用
  if (reason === "auth_permanent" || reason === "billing") {
    stats.disabledUntil = Date.now() + DISABLE_DURATION_MS;
    stats.disabledReason = reason;
  }
  
  // 临时错误设置冷却
  stats.cooldownUntil = Date.now() + calculateCooldownMs(reason);
}
```

## 三、重试策略

### 3.1 指数退避

```typescript
const BACKOFF_SCHEDULE_MS = [5000, 10000, 30000, 60000];

function calculateBackoffMs(consecutiveNoOutputPolls: number): number {
  const index = Math.min(consecutiveNoOutputPolls, BACKOFF_SCHEDULE_MS.length - 1);
  return BACKOFF_SCHEDULE_MS[index] ?? 60000;
}
```

**源码位置**: `src/agents/command-poll-backoff.ts`

### 3.2 运行时重试限制

```typescript
// 防御性保护：外层运行循环的最大重试次数
const BASE_RUN_RETRY_ITERATIONS = 24;
const RUN_RETRY_ITERATIONS_PER_PROFILE = 8;
const MIN_RUN_RETRY_ITERATIONS = 32;
const MAX_RUN_RETRY_ITERATIONS = 160;

function resolveMaxRunRetryIterations(profileCandidateCount: number): number {
  const scaled =
    BASE_RUN_RETRY_ITERATIONS +
    Math.max(1, profileCandidateCount) * RUN_RETRY_ITERATIONS_PER_PROFILE;
  return Math.min(MAX_RUN_RETRY_ITERATIONS, Math.max(MIN_RUN_RETRY_ITERATIONS, scaled));
}
```

**源码位置**: `src/agents/pi-embedded-runner/run.ts`

### 3.3 冷却时间计算

```typescript
function calculateAuthProfileCooldownMs(reason: AuthProfileFailureReason): number {
  switch (reason) {
    case "rate_limit":
      return 60_000;      // 1 分钟
    case "timeout":
      return 30_000;      // 30 秒
    case "auth":
      return 120_000;     // 2 分钟
    case "auth_permanent":
      return 24 * 60 * 60 * 1000; // 24 小时
    case "billing":
      return 60 * 60 * 1000; // 1 小时
    default:
      return 60_000;      // 默认 1 分钟
  }
}
```

## 四、故障恢复流程

### 4.1 完整流程图

```
请求失败
    ↓
分类错误原因
    ↓
┌─────────────────────────────────────┐
│         FailoverError 创建          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  是否可恢复？                        │
│  - timeout: 是                      │
│  - rate_limit: 是                   │
│  - auth: 尝试下一个 Profile          │
│  - auth_permanent: 否               │
│  - billing: 否                      │
└─────────────────────────────────────┘
    ↓ 可恢复              ↓ 不可恢复
标记当前 Profile 冷却    返回错误给用户
    ↓
尝试下一个 Profile
    ↓
所有 Profile 都不可用？
    ↓ 是
返回不可用原因
    ↓ 否
重试请求
```

### 4.2 错误处理示例

```typescript
async function runWithFailover(params: {
  profiles: AuthProfile[];
  run: (profile: AuthProfile) => Promise<Result>;
}): Promise<Result> {
  const tried = new Set<string>();
  
  while (tried.size < params.profiles.length) {
    // 选择下一个可用 Profile
    const profile = selectNextAvailableProfile(params.profiles, tried);
    if (!profile) {
      const reason = resolveProfilesUnavailableReason(store, params.profiles.map(p => p.id));
      throw new Error(`All profiles unavailable: ${reason}`);
    }
    
    tried.add(profile.id);
    
    try {
      const result = await params.run(profile);
      markAuthProfileGood(store, profile.id);
      return result;
    } catch (err) {
      const failover = coerceToFailoverError(err, {
        provider: profile.provider,
        profileId: profile.id,
      });
      
      if (!failover) throw err;
      
      markAuthProfileFailure({
        store,
        profileId: profile.id,
        reason: failover.reason,
      });
      
      // 永久性错误不再尝试
      if (failover.reason === "auth_permanent" || failover.reason === "billing") {
        throw failover;
      }
    }
  }
}
```

## 五、借鉴要点

### 5.1 设计原则

1. **错误封装** - 将原始错误转换为有结构的 FailoverError
2. **状态追踪** - 记录每个 Profile 的使用状态和失败历史
3. **智能选择** - 根据历史表现选择最佳 Profile

### 5.2 关键实现

1. **冷却机制** - 防止对已知问题的 Profile 持续请求
2. **优先级排序** - 根据错误类型决定处理优先级
3. **退避策略** - 避免过度重试导致服务压力

### 5.3 扩展建议

1. **自适应冷却** - 根据错误频率动态调整冷却时间
2. **健康检查** - 定期检测 Profile 可用性
3. **负载均衡** - 在多个可用 Profile 间分配请求
