# 错误分类体系

> 本文档详细描述 OpenClaw 的错误分类架构，包括错误类型定义、分级标准和分类策略。

## 一、错误分类层次

### 1.1 LLM API 错误分类（FailoverReason）

OpenClaw 将 LLM API 错误分为以下类型：

```typescript
type FailoverReason =
  | "billing"        // 计费错误 - 余额不足
  | "rate_limit"     // 速率限制 - 请求过快
  | "auth"           // 认证错误 - Token 无效/过期
  | "auth_permanent" // 永久认证错误 - API Key 被撤销
  | "timeout"        // 超时错误 - 网络或服务超时
  | "format"         // 格式错误 - 请求格式不正确
  | "model_not_found" // 模型不存在
  | "session_expired" // 会话过期
```

**源码位置**: `src/agents/pi-embedded-helpers/types.ts`

### 1.2 Gateway 错误码

```typescript
const ErrorCodes = {
  NOT_LINKED: "NOT_LINKED",       // 未链接
  NOT_PAIRED: "NOT_PAIRED",       // 未配对
  AGENT_TIMEOUT: "AGENT_TIMEOUT", // Agent 超时
  INVALID_REQUEST: "INVALID_REQUEST", // 无效请求
  UNAVAILABLE: "UNAVAILABLE",     // 服务不可用
} as const;
```

**源码位置**: `src/gateway/protocol/schema/error-codes.ts`

### 1.3 连接错误详情码

```typescript
const ConnectErrorDetailCodes = {
  // 认证相关
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_TOKEN_MISSING: "AUTH_TOKEN_MISSING",
  AUTH_TOKEN_MISMATCH: "AUTH_TOKEN_MISMATCH",
  AUTH_TOKEN_NOT_CONFIGURED: "AUTH_TOKEN_NOT_CONFIGURED",
  AUTH_PASSWORD_MISSING: "AUTH_PASSWORD_MISSING",
  AUTH_PASSWORD_MISMATCH: "AUTH_PASSWORD_MISMATCH",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  
  // Tailscale 相关
  AUTH_TAILSCALE_IDENTITY_MISSING: "AUTH_TAILSCALE_IDENTITY_MISSING",
  AUTH_TAILSCALE_PROXY_MISSING: "AUTH_TAILSCALE_PROXY_MISSING",
  AUTH_TAILSCALE_WHOIS_FAILED: "AUTH_TAILSCALE_WHOIS_FAILED",
  AUTH_TAILSCALE_IDENTITY_MISMATCH: "AUTH_TAILSCALE_IDENTITY_MISMATCH",
  
  // 设备认证相关
  DEVICE_IDENTITY_REQUIRED: "DEVICE_IDENTITY_REQUIRED",
  DEVICE_AUTH_INVALID: "DEVICE_AUTH_INVALID",
  DEVICE_AUTH_DEVICE_ID_MISMATCH: "DEVICE_AUTH_DEVICE_ID_MISMATCH",
  DEVICE_AUTH_SIGNATURE_EXPIRED: "DEVICE_AUTH_SIGNATURE_EXPIRED",
  DEVICE_AUTH_NONCE_REQUIRED: "DEVICE_AUTH_NONCE_REQUIRED",
  DEVICE_AUTH_NONCE_MISMATCH: "DEVICE_AUTH_NONCE_MISMATCH",
  DEVICE_AUTH_SIGNATURE_INVALID: "DEVICE_AUTH_SIGNATURE_INVALID",
  DEVICE_AUTH_PUBLIC_KEY_INVALID: "DEVICE_AUTH_PUBLIC_KEY_INVALID",
  
  // 配对相关
  PAIRING_REQUIRED: "PAIRING_REQUIRED",
} as const;
```

**源码位置**: `src/gateway/protocol/connect-error-details.ts`

### 1.4 ACP 运行时错误码

```typescript
const ACP_ERROR_CODES = [
  "ACP_BACKEND_MISSING",           // 后端缺失
  "ACP_BACKEND_UNAVAILABLE",       // 后端不可用
  "ACP_BACKEND_UNSUPPORTED_CONTROL", // 不支持的控制
  "ACP_DISPATCH_DISABLED",         // 调度禁用
  "ACP_INVALID_RUNTIME_OPTION",    // 无效运行时选项
  "ACP_SESSION_INIT_FAILED",       // 会话初始化失败
  "ACP_TURN_FAILED",               // Turn 失败
] as const;
```

**源码位置**: `src/acp/runtime/errors.ts`

## 二、错误模式匹配

### 2.1 错误模式定义

```typescript
const ERROR_PATTERNS = {
  rateLimit: [
    /rate[_ ]limit|too many requests|429/,
    "model_cooldown",
    "cooling down",
    "exceeded your current quota",
    "resource has been exhausted",
    "quota exceeded",
    "resource_exhausted",
    "usage limit",
    /\btpm\b/i,
    "tokens per minute",
  ],
  overloaded: [
    /overloaded_error|"type"\s*:\s*"overloaded_error"/i,
    "overloaded",
    "service unavailable",
    "high demand",
  ],
  timeout: [
    "timeout",
    "timed out",
    "deadline exceeded",
    "context deadline exceeded",
    "connection error",
    "network error",
    "network request failed",
    "fetch failed",
    "socket hang up",
    /\beconn(?:refused|reset|aborted)\b/i,
    /\benotfound\b/i,
    /\beai_again\b/i,
    /without sending (?:any )?chunks?/i,
    /\bstop reason:\s*(?:abort|error)\b/i,
  ],
  billing: [
    /["']?(?:status|code)["']?\s*[:=]\s*402\b/,
    "payment required",
    "insufficient credits",
    "credit balance",
    "insufficient balance",
  ],
  authPermanent: [
    /api[_ ]?key[_ ]?(?:revoked|invalid|deactivated|deleted)/i,
    "invalid_api_key",
    "key has been disabled",
    "key has been revoked",
    "account has been deactivated",
    "permission_error",
  ],
  auth: [
    /invalid[_ ]?api[_ ]?key/,
    "incorrect api key",
    "invalid token",
    "authentication",
    "re-authenticate",
    "unauthorized",
    "forbidden",
    /\b401\b/,
    /\b403\b/,
  ],
  format: [
    "string should match pattern",
    "tool_use.id",
    "invalid request format",
  ],
} as const;
```

**源码位置**: `src/agents/pi-embedded-helpers/failover-matches.ts`

### 2.2 错误分类函数

```typescript
function classifyFailoverReason(raw: string): FailoverReason | null {
  if (isImageDimensionErrorMessage(raw)) return null;
  if (isImageSizeError(raw)) return null;
  if (isCliSessionExpiredErrorMessage(raw)) return "session_expired";
  if (isModelNotFoundErrorMessage(raw)) return "model_not_found";
  if (isTransientHttpError(raw)) return "timeout";
  if (isRateLimitErrorMessage(raw)) return "rate_limit";
  if (isOverloadedErrorMessage(raw)) return "rate_limit";
  if (isBillingErrorMessage(raw)) return "billing";
  if (isTimeoutErrorMessage(raw)) return "timeout";
  if (isAuthPermanentErrorMessage(raw)) return "auth_permanent";
  if (isAuthErrorMessage(raw)) return "auth";
  return null;
}
```

**源码位置**: `src/agents/pi-embedded-helpers/errors.ts`

## 三、错误状态映射

### 3.1 FailoverError 状态码映射

```typescript
function resolveFailoverStatus(reason: FailoverReason): number | undefined {
  switch (reason) {
    case "billing": return 402;
    case "rate_limit": return 429;
    case "auth": return 401;
    case "auth_permanent": return 403;
    case "timeout": return 408;
    case "format": return 400;
    case "model_not_found": return 404;
    case "session_expired": return 410;
    default: return undefined;
  }
}
```

**源码位置**: `src/agents/failover-error.ts`

## 四、错误分级策略

### 4.1 Auth Profile 失败原因优先级

```typescript
const FAILURE_REASON_PRIORITY: AuthProfileFailureReason[] = [
  "auth_permanent",   // 最高优先级 - 需要立即处理
  "auth",             // 认证问题
  "billing",          // 计费问题
  "format",           // 格式问题
  "model_not_found",  // 模型问题
  "timeout",          // 超时 - 可能是暂时的
  "rate_limit",       // 速率限制 - 等待后可恢复
  "unknown",          // 最低优先级
];
```

**源码位置**: `src/agents/auth-profiles/usage.ts`

### 4.2 循环检测阈值分级

```typescript
const TOOL_CALL_HISTORY_SIZE = 30;        // 历史记录大小
const WARNING_THRESHOLD = 10;              // 警告阈值
const CRITICAL_THRESHOLD = 20;             // 严重阈值
const GLOBAL_CIRCUIT_BREAKER_THRESHOLD = 30; // 全局熔断阈值
```

**源码位置**: `src/agents/tool-loop-detection.ts`

## 五、借鉴要点

### 5.1 分层设计

1. **基础设施层** - 通用错误工具（提取错误码、格式化消息）
2. **协议层** - 通信协议相关错误码
3. **业务层** - 业务特定错误分类

### 5.2 模式匹配策略

1. **多模式覆盖** - 同时支持正则和字符串匹配
2. **优先级排序** - 按严重程度排序检测
3. **提前返回** - 一旦匹配立即返回

### 5.3 可扩展性

1. **类型安全** - 使用 TypeScript 类型定义
2. **常量定义** - 集中管理错误码
3. **模块化** - 按领域分离错误定义
