# 循环检测机制

> 本文档详细描述 OpenClaw 的工具调用循环检测和熔断机制，防止 Agent 陷入无限循环。

## 一、循环检测概述

### 1.1 检测器类型

```typescript
type LoopDetectorKind =
  | "generic_repeat"      // 通用重复检测
  | "known_poll_no_progress" // 已知轮询无进展
  | "global_circuit_breaker" // 全局熔断
  | "ping_pong";          // 乒乓循环检测
```

### 1.2 检测结果

```typescript
type LoopDetectionResult =
  | { stuck: false }
  | {
      stuck: true;
      level: "warning" | "critical";  // 警告级别
      detector: LoopDetectorKind;     // 检测器类型
      count: number;                  // 重复次数
      message: string;                // 描述消息
      pairedToolName?: string;        // 配对工具名（乒乓模式）
      warningKey?: string;            // 去重键
    };
```

**源码位置**: `src/agents/tool-loop-detection.ts`

## 二、检测阈值配置

### 2.1 默认配置

```typescript
const TOOL_CALL_HISTORY_SIZE = 30;              // 历史记录大小
const WARNING_THRESHOLD = 10;                    // 警告阈值
const CRITICAL_THRESHOLD = 20;                   // 严重阈值
const GLOBAL_CIRCUIT_BREAKER_THRESHOLD = 30;     // 全局熔断阈值

const DEFAULT_LOOP_DETECTION_CONFIG = {
  enabled: false,
  historySize: TOOL_CALL_HISTORY_SIZE,
  warningThreshold: WARNING_THRESHOLD,
  criticalThreshold: CRITICAL_THRESHOLD,
  globalCircuitBreakerThreshold: GLOBAL_CIRCUIT_BREAKER_THRESHOLD,
  detectors: {
    genericRepeat: true,          // 通用重复检测
    knownPollNoProgress: true,    // 轮询无进展检测
    pingPong: true,               // 乒乓检测
  },
};
```

### 2.2 配置解析

```typescript
function resolveLoopDetectionConfig(config?: ToolLoopDetectionConfig): ResolvedLoopDetectionConfig {
  let warningThreshold = asPositiveInt(config?.warningThreshold, WARNING_THRESHOLD);
  let criticalThreshold = asPositiveInt(config?.criticalThreshold, CRITICAL_THRESHOLD);
  let globalCircuitBreakerThreshold = asPositiveInt(
    config?.globalCircuitBreakerThreshold,
    GLOBAL_CIRCUIT_BREAKER_THRESHOLD,
  );

  // 确保阈值递增
  if (criticalThreshold <= warningThreshold) {
    criticalThreshold = warningThreshold + 1;
  }
  if (globalCircuitBreakerThreshold <= criticalThreshold) {
    globalCircuitBreakerThreshold = criticalThreshold + 1;
  }

  return { enabled, historySize, warningThreshold, criticalThreshold, globalCircuitBreakerThreshold, detectors };
}
```

## 三、检测算法

### 3.1 工具调用哈希

```typescript
function hashToolCall(toolName: string, params: unknown): string {
  return `${toolName}:${digestStable(params)}`;
}

function digestStable(value: unknown): string {
  const serialized = stableStringifyFallback(value);
  return createHash("sha256").update(serialized).digest("hex");
}
```

### 3.2 无进展检测

```typescript
function getNoProgressStreak(
  history: Array<{ toolName: string; argsHash: string; resultHash?: string }>,
  toolName: string,
  argsHash: string,
): { count: number; latestResultHash?: string } {
  let streak = 0;
  let latestResultHash: string | undefined;

  // 从后向前遍历历史
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const record = history[i];
    if (!record || record.toolName !== toolName || record.argsHash !== argsHash) {
      continue;
    }
    if (typeof record.resultHash !== "string" || !record.resultHash) {
      continue;
    }
    if (!latestResultHash) {
      latestResultHash = record.resultHash;
      streak = 1;
      continue;
    }
    // 结果不同则停止
    if (record.resultHash !== latestResultHash) {
      break;
    }
    streak += 1;
  }

  return { count: streak, latestResultHash };
}
```

### 3.3 乒乓检测

```typescript
function getPingPongStreak(
  history: Array<{ toolName: string; argsHash: string; resultHash?: string }>,
  currentSignature: string,
): {
  count: number;
  pairedToolName?: string;
  pairedSignature?: string;
  noProgressEvidence: boolean;
} {
  // 检测交替调用模式：A -> B -> A -> B -> ...
  // 并验证双方都没有进展
}
```

## 四、完整检测流程

### 4.1 主检测函数

```typescript
function detectToolCallLoop(
  state: SessionState,
  toolName: string,
  params: unknown,
  config?: ToolLoopDetectionConfig,
): LoopDetectionResult {
  const resolvedConfig = resolveLoopDetectionConfig(config);
  if (!resolvedConfig.enabled) {
    return { stuck: false };
  }
  
  const history = state.toolCallHistory ?? [];
  const currentHash = hashToolCall(toolName, params);
  const noProgress = getNoProgressStreak(history, toolName, currentHash);
  const noProgressStreak = noProgress.count;
  const knownPollTool = isKnownPollToolCall(toolName, params);
  const pingPong = getPingPongStreak(history, currentHash);

  // 1. 全局熔断（最高优先级）
  if (noProgressStreak >= resolvedConfig.globalCircuitBreakerThreshold) {
    return {
      stuck: true,
      level: "critical",
      detector: "global_circuit_breaker",
      count: noProgressStreak,
      message: `CRITICAL: ${toolName} has repeated identical no-progress outcomes ${noProgressStreak} times. Session execution blocked.`,
    };
  }

  // 2. 已知轮询工具无进展（严重）
  if (knownPollTool && noProgressStreak >= resolvedConfig.criticalThreshold) {
    return {
      stuck: true,
      level: "critical",
      detector: "known_poll_no_progress",
      count: noProgressStreak,
      message: `CRITICAL: Called ${toolName} with identical arguments and no progress ${noProgressStreak} times.`,
    };
  }

  // 3. 已知轮询工具无进展（警告）
  if (knownPollTool && noProgressStreak >= resolvedConfig.warningThreshold) {
    return {
      stuck: true,
      level: "warning",
      detector: "known_poll_no_progress",
      count: noProgressStreak,
      message: `WARNING: You have called ${toolName} ${noProgressStreak} times with identical arguments and no progress.`,
    };
  }

  // 4. 乒乓检测（严重）
  if (pingPong.count >= resolvedConfig.criticalThreshold && pingPong.noProgressEvidence) {
    return {
      stuck: true,
      level: "critical",
      detector: "ping_pong",
      count: pingPong.count,
      message: `CRITICAL: You are alternating between repeated tool-call patterns (${pingPong.count} consecutive calls) with no progress.`,
      pairedToolName: pingPong.pairedToolName,
    };
  }

  // 5. 乒乓检测（警告）
  if (pingPong.count >= resolvedConfig.warningThreshold) {
    return {
      stuck: true,
      level: "warning",
      detector: "ping_pong",
      count: pingPong.count,
      message: `WARNING: You are alternating between repeated tool-call patterns (${pingPong.count} consecutive calls).`,
      pairedToolName: pingPong.pairedToolName,
    };
  }

  // 6. 通用重复检测（警告）
  const recentCount = history.filter(
    (h) => h.toolName === toolName && h.argsHash === currentHash,
  ).length;

  if (!knownPollTool && recentCount >= resolvedConfig.warningThreshold) {
    return {
      stuck: true,
      level: "warning",
      detector: "generic_repeat",
      count: recentCount,
      message: `WARNING: You have called ${toolName} ${recentCount} times with identical arguments.`,
    };
  }

  return { stuck: false };
}
```

## 五、历史记录管理

### 5.1 记录工具调用

```typescript
function recordToolCall(
  state: SessionState,
  toolName: string,
  params: unknown,
  toolCallId?: string,
  config?: ToolLoopDetectionConfig,
): void {
  if (!state.toolCallHistory) {
    state.toolCallHistory = [];
  }

  // 添加新记录
  state.toolCallHistory.push({
    toolName,
    argsHash: hashToolCall(toolName, params),
    toolCallId,
    timestamp: Date.now(),
  });

  // 维护滑动窗口
  if (state.toolCallHistory.length > resolvedConfig.historySize) {
    state.toolCallHistory.shift();
  }
}
```

### 5.2 记录工具结果

```typescript
function recordToolCallOutcome(
  state: SessionState,
  params: {
    toolName: string;
    toolParams: unknown;
    toolCallId?: string;
    result?: unknown;
    error?: unknown;
    config?: ToolLoopDetectionConfig;
  },
): void {
  // 计算结果哈希
  const resultHash = hashToolOutcome(
    params.toolName,
    params.toolParams,
    params.result,
    params.error,
  );
  
  if (!resultHash) return;

  // 找到对应的工具调用记录并更新
  // 如果找不到，创建新记录
}
```

### 5.3 获取统计信息

```typescript
function getToolCallStats(state: SessionState): {
  totalCalls: number;
  uniquePatterns: number;
  mostFrequent: { toolName: string; count: number } | null;
} {
  const history = state.toolCallHistory ?? [];
  const patterns = new Map<string, { toolName: string; count: number }>();

  for (const call of history) {
    const key = call.argsHash;
    const existing = patterns.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      patterns.set(key, { toolName: call.toolName, count: 1 });
    }
  }

  // 找出最频繁的模式
  let mostFrequent = null;
  for (const pattern of patterns.values()) {
    if (!mostFrequent || pattern.count > mostFrequent.count) {
      mostFrequent = pattern;
    }
  }

  return {
    totalCalls: history.length,
    uniquePatterns: patterns.size,
    mostFrequent,
  };
}
```

## 六、已知轮询工具识别

```typescript
function isKnownPollToolCall(toolName: string, params: unknown): boolean {
  // command_status 是已知的轮询工具
  if (toolName === "command_status") {
    return true;
  }
  
  // process 工具的 poll 和 log action
  if (toolName !== "process" || !isPlainObject(params)) {
    return false;
  }
  const action = params.action;
  return action === "poll" || action === "log";
}
```

## 七、借鉴要点

### 7.1 核心设计

1. **滑动窗口** - 限制历史记录大小，避免内存溢出
2. **哈希去重** - 使用 SHA256 哈希工具调用签名
3. **分级响应** - 警告 → 严重 → 熔断

### 7.2 检测策略

1. **无进展检测** - 关注结果是否相同
2. **乒乓检测** - 关注交替模式
3. **通用检测** - 兜底保护

### 7.3 扩展建议

1. **自适应阈值** - 根据工具类型动态调整
2. **机器学习** - 使用历史数据训练检测模型
3. **上下文感知** - 考虑任务上下文判断是否真的卡住
