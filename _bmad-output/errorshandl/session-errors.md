# 会话错误处理

> 本文档详细描述 OpenClaw 的会话错误处理机制，包括会话文件修复、上下文溢出处理和转写修复。

## 一、会话文件修复

### 1.1 修复流程

```typescript
type RepairReport = {
  repaired: boolean;      // 是否修复
  droppedLines: number;   // 丢弃的行数
  backupPath?: string;    // 备份文件路径
  reason?: string;        // 原因说明
};

async function repairSessionFileIfNeeded(params: {
  sessionFile: string;
  warn?: (message: string) => void;
}): Promise<RepairReport> {
  // 1. 读取文件
  let content: string;
  try {
    content = await fs.readFile(sessionFile, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return { repaired: false, droppedLines: 0, reason: "missing session file" };
    }
    return { repaired: false, droppedLines: 0, reason: `failed to read: ${err.message}` };
  }

  // 2. 逐行解析
  const lines = content.split(/\r?\n/);
  const entries: unknown[] = [];
  let droppedLines = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      entries.push(entry);
    } catch {
      droppedLines += 1;
    }
  }

  // 3. 验证会话头
  if (entries.length === 0) {
    return { repaired: false, droppedLines, reason: "empty session file" };
  }

  if (!isSessionHeader(entries[0])) {
    return { repaired: false, droppedLines, reason: "invalid session header" };
  }

  // 4. 无需修复
  if (droppedLines === 0) {
    return { repaired: false, droppedLines: 0 };
  }

  // 5. 执行修复
  const cleaned = `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
  const backupPath = `${sessionFile}.bak-${process.pid}-${Date.now()}`;
  const tmpPath = `${sessionFile}.repair-${process.pid}-${Date.now()}.tmp`;

  try {
    // 备份原文件
    await fs.writeFile(backupPath, content, "utf-8");
    // 写入临时文件
    await fs.writeFile(tmpPath, cleaned, "utf-8");
    // 原子替换
    await fs.rename(tmpPath, sessionFile);
    
    return { repaired: true, droppedLines, backupPath };
  } catch (err) {
    // 清理临时文件
    await fs.unlink(tmpPath).catch(() => {});
    return { repaired: false, droppedLines, reason: `repair failed: ${err.message}` };
  }
}
```

**源码位置**: `src/agents/session-file-repair.ts`

### 1.2 会话头验证

```typescript
function isSessionHeader(entry: unknown): entry is { type: string; id: string } {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  const record = entry as { type?: unknown; id?: unknown };
  return record.type === "session" && typeof record.id === "string" && record.id.length > 0;
}
```

## 二、上下文溢出处理

### 2.1 溢出错误检测

```typescript
function isContextOverflowError(errorMessage?: string): boolean {
  if (!errorMessage) return false;
  const lower = errorMessage.toLowerCase();

  // Groq 使用 413 表示 TPM 限制，不是上下文溢出
  if (hasRateLimitTpmHint(errorMessage)) {
    return false;
  }

  // 推理约束错误不是上下文溢出
  if (isReasoningConstraintErrorMessage(errorMessage)) {
    return false;
  }

  return (
    lower.includes("request_too_large") ||
    lower.includes("request exceeds the maximum size") ||
    lower.includes("context length exceeded") ||
    lower.includes("maximum context length") ||
    lower.includes("prompt is too long") ||
    lower.includes("exceeds model context window") ||
    lower.includes("model token limit") ||
    lower.includes("context overflow:") ||
    lower.includes("exceed context limit") ||
    // 中文错误消息
    errorMessage.includes("上下文过长") ||
    errorMessage.includes("上下文超出") ||
    errorMessage.includes("请压缩上下文")
  );
}
```

### 2.2 可能的上下文溢出检测

```typescript
const CONTEXT_OVERFLOW_HINT_RE =
  /context.*overflow|context window.*(too (?:large|long)|exceed|over|limit|max(?:imum)?|requested|sent|tokens)|prompt.*(too (?:large|long)|exceed|over|limit|max(?:imum)?)/i;

function isLikelyContextOverflowError(errorMessage?: string): boolean {
  if (!errorMessage) return false;

  // 排除速率限制
  if (hasRateLimitTpmHint(errorMessage)) return false;
  if (isReasoningConstraintErrorMessage(errorMessage)) return false;
  if (isRateLimitErrorMessage(errorMessage)) return false;

  if (isContextOverflowError(errorMessage)) return true;
  if (RATE_LIMIT_HINT_RE.test(errorMessage)) return false;
  
  return CONTEXT_OVERFLOW_HINT_RE.test(errorMessage);
}
```

**源码位置**: `src/agents/pi-embedded-helpers/errors.ts`

### 2.3 压缩失败检测

```typescript
function isCompactionFailureError(errorMessage?: string): boolean {
  if (!errorMessage) return false;
  const lower = errorMessage.toLowerCase();
  
  const hasCompactionTerm =
    lower.includes("summarization failed") ||
    lower.includes("auto-compaction") ||
    lower.includes("compaction failed") ||
    lower.includes("compaction");
    
  if (!hasCompactionTerm) return false;
  
  // 有压缩术语且有溢出特征
  if (isLikelyContextOverflowError(errorMessage)) return true;
  
  return lower.includes("context overflow");
}
```

## 三、转写修复

### 3.1 工具调用配对修复

```typescript
function sanitizeToolUseResultPairing(messages: AgentMessage[]): {
  messages: AgentMessage[];
  droppedToolCallIds: Set<string>;
} {
  const droppedToolCallIds = new Set<string>();
  const toolCalls = new Map<string, ToolCallInfo>();

  // 第一遍：收集所有工具调用
  for (const msg of messages) {
    if (msg.role === "assistant") {
      for (const block of msg.content ?? []) {
        if (block.type === "tool_use") {
          toolCalls.set(block.id, { call: block, result: null });
        }
      }
    }
  }

  // 第二遍：匹配工具结果
  for (const msg of messages) {
    if (msg.role === "user") {
      for (const block of msg.content ?? []) {
        if (block.type === "tool_result" && toolCalls.has(block.tool_use_id)) {
          toolCalls.get(block.tool_use_id)!.result = block;
        }
      }
    }
  }

  // 第三遍：移除不完整的配对
  for (const [id, info] of toolCalls) {
    if (!info.result) {
      droppedToolCallIds.add(id);
    }
  }

  // 构建修复后的消息
  const repaired = messages.map((msg) => {
    if (msg.role === "assistant") {
      const content = (msg.content ?? []).filter((block) => {
        if (block.type === "tool_use" && droppedToolCallIds.has(block.id)) {
          return false;
        }
        return true;
      });
      return { ...msg, content };
    }
    return msg;
  });

  return { messages: repaired, droppedToolCallIds };
}
```

**源码位置**: `src/agents/session-transcript-repair.ts`

### 3.2 缺失工具调用输入检测

```typescript
const TOOL_CALL_INPUT_MISSING_RE =
  /tool_(?:use|call)\.(?:input|arguments).*?(?:field required|required)/i;
const TOOL_CALL_INPUT_PATH_RE =
  /messages\.\d+\.content\.\d+\.tool_(?:use|call)\.(?:input|arguments)/i;

function isMissingToolCallInputError(raw: string): boolean {
  if (!raw) return false;
  return TOOL_CALL_INPUT_MISSING_RE.test(raw) || TOOL_CALL_INPUT_PATH_RE.test(raw);
}
```

## 四、图像错误处理

### 4.1 图像尺寸错误

```typescript
const IMAGE_DIMENSION_ERROR_RE =
  /image dimensions exceed max allowed size for many-image requests:\s*(\d+)\s*pixels/i;

function parseImageDimensionError(raw: string): {
  maxDimensionPx?: number;
  messageIndex?: number;
  contentIndex?: number;
  raw: string;
} | null {
  if (!raw) return null;
  
  const lower = raw.toLowerCase();
  if (!lower.includes("image dimensions exceed max allowed size")) {
    return null;
  }
  
  const limitMatch = raw.match(IMAGE_DIMENSION_ERROR_RE);
  const pathMatch = raw.match(/messages\.(\d+)\.content\.(\d+)\.image/i);
  
  return {
    maxDimensionPx: limitMatch?.[1] ? Number.parseInt(limitMatch[1], 10) : undefined,
    messageIndex: pathMatch?.[1] ? Number.parseInt(pathMatch[1], 10) : undefined,
    contentIndex: pathMatch?.[2] ? Number.parseInt(pathMatch[2], 10) : undefined,
    raw,
  };
}
```

### 4.2 图像大小错误

```typescript
const IMAGE_SIZE_ERROR_RE = /image exceeds\s*(\d+(?:\.\d+)?)\s*mb/i;

function parseImageSizeError(raw: string): {
  maxMb?: number;
  raw: string;
} | null {
  if (!raw) return null;
  
  const lower = raw.toLowerCase();
  if (!lower.includes("image exceeds") || !lower.includes("mb")) {
    return null;
  }
  
  const match = raw.match(IMAGE_SIZE_ERROR_RE);
  return {
    maxMb: match?.[1] ? Number.parseFloat(match[1]) : undefined,
    raw,
  };
}
```

**源码位置**: `src/agents/pi-embedded-helpers/errors.ts`

## 五、媒体理解跳过错误

```typescript
type MediaUnderstandingSkipReason =
  | "maxBytes"     // 超过最大字节
  | "timeout"      // 超时
  | "unsupported"  // 不支持的格式
  | "empty"        // 空内容
  | "tooSmall";    // 太小

class MediaUnderstandingSkipError extends Error {
  readonly reason: MediaUnderstandingSkipReason;

  constructor(reason: MediaUnderstandingSkipReason, message: string) {
    super(message);
    this.reason = reason;
    this.name = "MediaUnderstandingSkipError";
  }
}

function isMediaUnderstandingSkipError(err: unknown): err is MediaUnderstandingSkipError {
  return err instanceof MediaUnderstandingSkipError;
}
```

**源码位置**: `src/media-understanding/errors.ts`

## 六、借鉴要点

### 6.1 文件修复策略

1. **原子操作** - 使用临时文件+重命名保证原子性
2. **备份保留** - 修复前备份原文件
3. **最小修改** - 只删除损坏的行

### 6.2 溢出处理策略

1. **多语言支持** - 同时识别中英文错误消息
2. **误判排除** - 排除 TPM 限制等相似错误
3. **友好提示** - 向用户提供明确的恢复建议

### 6.3 转写修复策略

1. **配对验证** - 确保工具调用和结果一一对应
2. **最小删除** - 只删除不完整的配对
3. **追踪记录** - 记录被删除的工具调用 ID

### 6.4 扩展建议

1. **自动恢复** - 检测到溢出自动触发压缩
2. **预防机制** - 提前预警即将溢出的会话
3. **增量保存** - 定期保存会话状态防止丢失
