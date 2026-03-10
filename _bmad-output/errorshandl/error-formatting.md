# 错误格式化

> 本文档详细描述 OpenClaw 的错误格式化机制，包括用户友好消息生成、错误脱敏和敏感信息处理。

## 一、用户友好错误消息

### 1.1 计费错误

```typescript
function formatBillingErrorMessage(provider?: string, model?: string): string {
  const providerName = provider?.trim();
  const modelName = model?.trim();
  const providerLabel =
    providerName && modelName 
      ? `${providerName} (${modelName})` 
      : providerName || undefined;
      
  if (providerLabel) {
    return `⚠️ ${providerLabel} returned a billing error — your API key has run out of credits or has an insufficient balance. Check your ${providerName} billing dashboard and top up or switch to a different API key.`;
  }
  return "⚠️ API provider returned a billing error — your API key has run out of credits or has an insufficient balance. Check your provider's billing dashboard and top up or switch to a different API key.";
}

const BILLING_ERROR_USER_MESSAGE = formatBillingErrorMessage();
```

### 1.2 速率限制错误

```typescript
const RATE_LIMIT_ERROR_USER_MESSAGE = "⚠️ API rate limit reached. Please try again later.";
const OVERLOADED_ERROR_USER_MESSAGE = "The AI service is temporarily overloaded. Please try again in a moment.";
```

### 1.3 上下文溢出错误

```typescript
// 格式化上下文溢出错误
if (isContextOverflowError(raw)) {
  return (
    "Context overflow: prompt too large for the model. " +
    "Try /reset (or /new) to start a fresh session, or use a larger-context model."
  );
}
```

### 1.4 消息排序错误

```typescript
// 角色排序错误
if (/incorrect role information|roles must alternate|400.*role/i.test(raw)) {
  return (
    "Message ordering conflict - please try again. " +
    "If this persists, use /new to start a fresh session."
  );
}
```

### 1.5 会话损坏错误

```typescript
if (isMissingToolCallInputError(raw)) {
  return (
    "Session history looks corrupted (tool call input missing). " +
    "Use /new to start a fresh session. " +
    "If this keeps happening, reset the session or delete the corrupted session transcript."
  );
}
```

**源码位置**: `src/agents/pi-embedded-helpers/errors.ts`

## 二、Assistant 消息错误格式化

### 2.1 主格式化函数

```typescript
function formatAssistantErrorText(
  msg: AssistantMessage,
  opts?: { 
    cfg?: OpenClawConfig; 
    sessionKey?: string; 
    provider?: string; 
    model?: string 
  },
): string | undefined {
  const raw = (msg.errorMessage ?? "").trim();
  
  // 非错误消息返回 undefined
  if (msg.stopReason !== "error" && !raw) {
    return undefined;
  }
  
  if (!raw) {
    return "LLM request failed with an unknown error.";
  }

  // 未知工具检测
  const unknownTool = raw.match(/unknown tool[:\s]+["']?([a-z0-9_-]+)["']?/i);
  if (unknownTool?.[1]) {
    const rewritten = formatSandboxToolPolicyBlockedMessage({
      cfg: opts?.cfg,
      sessionKey: opts?.sessionKey,
      toolName: unknownTool[1],
    });
    if (rewritten) return rewritten;
  }

  // 上下文溢出
  if (isContextOverflowError(raw)) {
    return "Context overflow: prompt too large for the model. Try /reset (or /new) to start a fresh session.";
  }

  // 推理约束
  if (isReasoningConstraintErrorMessage(raw)) {
    return "Reasoning is required for this model endpoint. Use /think minimal (or any non-off level) and try again.";
  }

  // 消息排序冲突
  if (/incorrect role information|roles must alternate/i.test(raw)) {
    return "Message ordering conflict - please try again. If this persists, use /new to start a fresh session.";
  }

  // 工具调用输入缺失
  if (isMissingToolCallInputError(raw)) {
    return "Session history looks corrupted (tool call input missing). Use /new to start a fresh session.";
  }

  // 无效请求
  const invalidRequest = raw.match(/"type":"invalid_request_error".*?"message":"([^"]+)"/);
  if (invalidRequest?.[1]) {
    return `LLM request rejected: ${invalidRequest[1]}`;
  }

  // 速率限制或过载
  const transientCopy = formatRateLimitOrOverloadedErrorCopy(raw);
  if (transientCopy) return transientCopy;

  // 超时
  if (isTimeoutErrorMessage(raw)) {
    return "LLM request timed out.";
  }

  // 计费错误
  if (isBillingErrorMessage(raw)) {
    return formatBillingErrorMessage(opts?.provider, opts?.model ?? msg.model);
  }

  // HTTP 错误或 API 错误载荷
  if (isLikelyHttpErrorText(raw) || isRawApiErrorPayload(raw)) {
    return formatRawAssistantErrorForUi(raw);
  }

  // 长错误截断
  if (raw.length > 600) {
    log.warn(`Long error truncated: ${raw.slice(0, 200)}`);
    return `${raw.slice(0, 600)}…`;
  }
  
  return raw;
}
```

### 2.2 原始 API 错误格式化

```typescript
function formatRawAssistantErrorForUi(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return "LLM request failed with an unknown error.";
  }

  // Cloudflare HTML 错误页
  const leadingStatus = extractLeadingHttpStatus(trimmed);
  if (leadingStatus && isCloudflareOrHtmlErrorPage(trimmed)) {
    return `The AI service is temporarily unavailable (HTTP ${leadingStatus.code}). Please try again in a moment.`;
  }

  // HTTP 状态码前缀
  const httpMatch = trimmed.match(/^(\d{3})\s+(.+)$/s);
  if (httpMatch) {
    const rest = httpMatch[2].trim();
    if (!rest.startsWith("{")) {
      return `HTTP ${httpMatch[1]}: ${rest}`;
    }
  }

  // JSON API 错误载荷
  const info = parseApiErrorInfo(trimmed);
  if (info?.message) {
    const prefix = info.httpCode ? `HTTP ${info.httpCode}` : "LLM error";
    const type = info.type ? ` ${info.type}` : "";
    const requestId = info.requestId ? ` (request_id: ${info.requestId})` : "";
    return `${prefix}${type}: ${info.message}${requestId}`;
  }

  return trimmed.length > 600 ? `${trimmed.slice(0, 600)}…` : trimmed;
}
```

## 三、敏感信息脱敏

### 3.1 格式化时自动脱敏

```typescript
function formatErrorMessage(err: unknown): string {
  let formatted: string;
  // ... 格式化逻辑
  
  // 安全：在返回/日志前脱敏敏感令牌
  return redactSensitiveText(formatted);
}
```

### 3.2 未捕获错误脱敏

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

## 四、用户面向文本清理

### 4.1 文本清理函数

```typescript
function sanitizeUserFacingText(text: string, opts?: { errorContext?: boolean }): string {
  if (!text) return text;
  
  const errorContext = opts?.errorContext ?? false;
  const stripped = stripFinalTagsFromText(text);
  const trimmed = stripped.trim();
  if (!trimmed) return "";

  // 只在错误上下文中应用错误模式重写
  if (errorContext) {
    if (/incorrect role information|roles must alternate/i.test(trimmed)) {
      return "Message ordering conflict - please try again. If this persists, use /new to start a fresh session.";
    }

    if (shouldRewriteContextOverflowText(trimmed)) {
      return "Context overflow: prompt too large for the model. Try /reset (or /new) to start a fresh session.";
    }

    if (isBillingErrorMessage(trimmed)) {
      return BILLING_ERROR_USER_MESSAGE;
    }

    if (isRawApiErrorPayload(trimmed) || isLikelyHttpErrorText(trimmed)) {
      return formatRawAssistantErrorForUi(trimmed);
    }
  }

  // 移除前导空行
  const withoutLeadingEmptyLines = stripped.replace(/^(?:[ \t]*\r?\n)+/, "");
  
  // 合并连续重复块
  return collapseConsecutiveDuplicateBlocks(withoutLeadingEmptyLines);
}
```

### 4.2 Final 标签移除

```typescript
const FINAL_TAG_RE = /<\s*\/?\s*final\s*>/gi;

function stripFinalTagsFromText(text: string): string {
  if (!text) return text;
  return text.replace(FINAL_TAG_RE, "");
}
```

### 4.3 连续重复块合并

```typescript
function collapseConsecutiveDuplicateBlocks(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  
  const blocks = trimmed.split(/\n{2,}/);
  if (blocks.length < 2) return text;

  const normalizeBlock = (value: string) => value.trim().replace(/\s+/g, " ");
  const result: string[] = [];
  let lastNormalized: string | null = null;

  for (const block of blocks) {
    const normalized = normalizeBlock(block);
    if (lastNormalized && normalized === lastNormalized) {
      continue; // 跳过重复块
    }
    result.push(block.trim());
    lastNormalized = normalized;
  }

  if (result.length === blocks.length) return text;
  return result.join("\n\n");
}
```

## 五、API 错误载荷解析

### 5.1 载荷指纹

```typescript
function getApiErrorPayloadFingerprint(raw?: string): string | null {
  if (!raw) return null;
  
  const payload = parseApiErrorPayload(raw);
  if (!payload) return null;
  
  return stableStringify(payload);
}

function isRawApiErrorPayload(raw?: string): boolean {
  return getApiErrorPayloadFingerprint(raw) !== null;
}
```

### 5.2 错误信息提取

```typescript
type ApiErrorInfo = {
  httpCode?: string;
  type?: string;
  message?: string;
  requestId?: string;
};

function parseApiErrorInfo(raw?: string): ApiErrorInfo | null {
  if (!raw) return null;
  
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let httpCode: string | undefined;
  let candidate = trimmed;

  // 提取 HTTP 状态码前缀
  const httpPrefixMatch = candidate.match(/^(\d{3})\s+(.+)$/s);
  if (httpPrefixMatch) {
    httpCode = httpPrefixMatch[1];
    candidate = httpPrefixMatch[2].trim();
  }

  const payload = parseApiErrorPayload(candidate);
  if (!payload) return null;

  // 提取 request_id
  const requestId =
    typeof payload.request_id === "string"
      ? payload.request_id
      : typeof payload.requestId === "string"
        ? payload.requestId
        : undefined;

  // 提取错误信息
  let errType: string | undefined;
  let errMessage: string | undefined;
  
  if (payload.error && typeof payload.error === "object") {
    const err = payload.error as Record<string, unknown>;
    if (typeof err.type === "string") errType = err.type;
    if (typeof err.code === "string" && !errType) errType = err.code;
    if (typeof err.message === "string") errMessage = err.message;
  }

  return {
    httpCode,
    type: errType ?? (typeof payload.type === "string" ? payload.type : undefined),
    message: errMessage ?? (typeof payload.message === "string" ? payload.message : undefined),
    requestId,
  };
}
```

## 六、借鉴要点

### 6.1 设计原则

1. **用户优先** - 原始错误转换为用户可理解的消息
2. **安全第一** - 自动脱敏敏感信息
3. **上下文感知** - 根据上下文选择不同的处理方式

### 6.2 格式化策略

1. **模式匹配** - 根据错误内容选择模板
2. **结构化提取** - 从 JSON 载荷提取关键信息
3. **长度限制** - 防止超长错误消息

### 6.3 扩展建议

1. **多语言支持** - 根据用户语言返回对应错误消息
2. **错误码映射** - 为每种错误定义唯一错误码
3. **恢复建议** - 在错误消息中包含具体的恢复步骤
