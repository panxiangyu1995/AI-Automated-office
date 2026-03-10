# 网络错误处理

> 本文档详细描述 OpenClaw 的网络错误处理机制，包括可恢复错误判定和各消息平台的网络错误策略。

## 一、可恢复错误判定

### 1.1 可恢复错误码

```typescript
const RECOVERABLE_ERROR_CODES = new Set([
  "ECONNRESET",       // 连接重置
  "ECONNREFUSED",     // 连接被拒绝
  "EPIPE",            // 管道破裂
  "ETIMEDOUT",        // 连接超时
  "ESOCKETTIMEDOUT",  // Socket 超时
  "ENETUNREACH",      // 网络不可达
  "EHOSTUNREACH",     // 主机不可达
  "ENOTFOUND",        // DNS 解析失败
  "EAI_AGAIN",        // DNS 临时失败
  "UND_ERR_CONNECT_TIMEOUT",  // Undici 连接超时
  "UND_ERR_HEADERS_TIMEOUT",  // Undici 头超时
  "UND_ERR_BODY_TIMEOUT",     // Undici 体超时
  "UND_ERR_SOCKET",          // Undici Socket 错误
  "UND_ERR_ABORTED",         // Undici 中止
  "ECONNABORTED",     // 连接中止
  "ERR_NETWORK",      // 网络错误
]);
```

**源码位置**: `src/telegram/network-errors.ts`

### 1.2 可恢复错误名称

```typescript
const RECOVERABLE_ERROR_NAMES = new Set([
  "AbortError",           // 中止错误
  "TimeoutError",         // 超时错误
  "ConnectTimeoutError",  // 连接超时
  "HeadersTimeoutError",  // 头超时
  "BodyTimeoutError",     // 体超时
]);
```

### 1.3 消息模式匹配

```typescript
const ALWAYS_RECOVERABLE_MESSAGES = new Set([
  "fetch failed",
  "typeerror: fetch failed",
]);

const RECOVERABLE_MESSAGE_SNIPPETS = [
  "undici",
  "network error",
  "network request",
  "client network socket disconnected",
  "socket hang up",
  "getaddrinfo",
  "timeout",
  "timed out",
];
```

## 二、Telegram 网络错误处理

### 2.1 错误上下文类型

```typescript
type TelegramNetworkErrorContext = 
  | "polling"   // 轮询 getUpdates
  | "send"      // 发送消息
  | "webhook"   // Webhook
  | "unknown";  // 未知
```

### 2.2 可恢复性判定

```typescript
function isRecoverableTelegramNetworkError(
  err: unknown,
  options: { 
    context?: TelegramNetworkErrorContext; 
    allowMessageMatch?: boolean 
  } = {},
): boolean {
  if (!err) return false;
  
  // send 操作默认不允许消息匹配（更严格）
  const allowMessageMatch =
    typeof options.allowMessageMatch === "boolean"
      ? options.allowMessageMatch
      : options.context !== "send";

  // 遍历错误图（包括 cause、reason、errors 等）
  for (const candidate of collectErrorGraphCandidates(err, (current) => {
    const nested: Array<unknown> = [current.cause, current.reason];
    if (Array.isArray(current.errors)) {
      nested.push(...current.errors);
    }
    // Grammy 的 HttpError 在 .error 中
    if (readErrorName(current) === "HttpError") {
      nested.push(current.error);
    }
    return nested;
  })) {
    // 检查错误码
    const code = normalizeCode(getErrorCode(candidate));
    if (code && RECOVERABLE_ERROR_CODES.has(code)) {
      return true;
    }

    // 检查错误名称
    const name = readErrorName(candidate);
    if (name && RECOVERABLE_ERROR_NAMES.has(name)) {
      return true;
    }

    // 检查消息模式
    const message = formatErrorMessage(candidate).trim().toLowerCase();
    if (message && ALWAYS_RECOVERABLE_MESSAGES.has(message)) {
      return true;
    }
    if (allowMessageMatch && message) {
      if (RECOVERABLE_MESSAGE_SNIPPETS.some((snippet) => message.includes(snippet))) {
        return true;
      }
    }
  }

  return false;
}
```

**源码位置**: `src/telegram/network-errors.ts`

## 三、Discord Gateway 错误处理

### 3.1 早期错误保护

```typescript
type EarlyGatewayErrorGuard = {
  pendingErrors: unknown[];  // 待处理错误
  release: () => void;       // 释放保护
};

function attachEarlyGatewayErrorGuard(client: Client): EarlyGatewayErrorGuard {
  const pendingErrors: unknown[] = [];
  const gateway = client.getPlugin("gateway");
  const emitter = getDiscordGatewayEmitter(gateway);
  
  if (!emitter) {
    return { pendingErrors, release: () => {} };
  }

  let released = false;
  const onGatewayError = (err: unknown) => {
    pendingErrors.push(err);
  };
  emitter.on("error", onGatewayError);

  return {
    pendingErrors,
    release: () => {
      if (released) return;
      released = true;
      emitter.removeListener("error", onGatewayError);
    },
  };
}
```

**源码位置**: `src/discord/monitor/gateway-error-guard.ts`

### 3.2 使用模式

```typescript
// 启动连接时安装保护
const guard = attachEarlyGatewayErrorGuard(client);

try {
  // 等待连接建立
  await waitForConnection();
  
  // 检查是否有早期错误
  if (guard.pendingErrors.length > 0) {
    // 处理错误
  }
} finally {
  // 释放保护
  guard.release();
}
```

## 四、错误图遍历

### 4.1 通用错误图遍历

```typescript
function collectErrorGraphCandidates(
  err: unknown,
  resolveNested?: (current: Record<string, unknown>) => Iterable<unknown>,
): unknown[] {
  const queue: unknown[] = [err];
  const seen = new Set<unknown>();
  const candidates: unknown[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null || seen.has(current)) {
      continue;
    }
    seen.add(current);
    candidates.push(current);

    if (!current || typeof current !== "object" || !resolveNested) {
      continue;
    }
    
    for (const nested of resolveNested(current as Record<string, unknown>)) {
      if (nested != null && !seen.has(nested)) {
        queue.push(nested);
      }
    }
  }

  return candidates;
}
```

**源码位置**: `src/infra/errors.ts`

### 4.2 使用示例

```typescript
// 遍历错误链
for (const candidate of collectErrorGraphCandidates(err, (current) => {
  const nested: Array<unknown> = [];
  if (current.cause) nested.push(current.cause);
  if (current.reason) nested.push(current.reason);
  if (Array.isArray(current.errors)) nested.push(...current.errors);
  return nested;
})) {
  if (isRecoverableError(candidate)) {
    return true;
  }
}
```

## 五、基础错误工具

### 5.1 错误码提取

```typescript
function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}
```

### 5.2 错误名读取

```typescript
function readErrorName(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "";
  }
  const name = (err as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}
```

### 5.3 错误消息格式化

```typescript
function formatErrorMessage(err: unknown): string {
  let formatted: string;
  if (err instanceof Error) {
    formatted = err.message || err.name || "Error";
  } else if (typeof err === "string") {
    formatted = err;
  } else if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    formatted = String(err);
  } else {
    try {
      formatted = JSON.stringify(err);
    } catch {
      formatted = Object.prototype.toString.call(err);
    }
  }
  // 安全：脱敏敏感信息
  return redactSensitiveText(formatted);
}
```

### 5.4 未捕获错误格式化

```typescript
function formatUncaughtError(err: unknown): string {
  if (extractErrorCode(err) === "INVALID_CONFIG") {
    return formatErrorMessage(err);
  }
  if (err instanceof Error) {
    const stack = err.stack ?? err.message ?? err.name;
    return redactSensitiveText(stack);
  }
  return formatErrorMessage(err);
}
```

**源码位置**: `src/infra/errors.ts`

## 六、借鉴要点

### 6.1 设计原则

1. **错误图遍历** - 深度遍历错误链，不遗漏嵌套错误
2. **模式匹配** - 支持错误码、错误名、消息内容多种匹配
3. **上下文感知** - 不同操作有不同的可恢复性标准

### 6.2 平台适配

1. **Telegram** - 考虑 Grammy 框架的 HttpError 封装
2. **Discord** - Gateway 早期错误保护机制
3. **通用** - 可复用的错误工具函数

### 6.3 扩展建议

1. **错误分类** - 为不同平台定义特定的错误类型
2. **重试策略** - 根据错误类型选择不同的重试策略
3. **监控告警** - 对特定错误类型触发告警
