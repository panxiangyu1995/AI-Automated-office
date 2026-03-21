# 心跳机制深度分析

## 概述

OpenClaw 的心跳机制是一个主动式通知系统，允许 AI 助手定期检查状态并主动向用户发送通知。这是一种"推送"模式，使 AI 能够在用户没有主动请求的情况下提供有价值的信息。

## 核心概念

### 1. 心跳的定义

心跳（Heartbeat）是 AI 助手的定期主动检查机制，用于：
- 检查待处理事项
- 监控系统状态
- 发送主动通知
- 处理定时任务完成事件

### 2. 心跳配置

```typescript
type HeartbeatConfig = {
  every?: string;              // 心跳间隔（如 "5m", "1h"）
  target?: string;             // 目标渠道
  accountId?: string;          // 账户 ID
  isolatedSession?: boolean;   // 是否使用隔离会话
  model?: string;              // 模型覆盖
  lightContext?: boolean;      // 轻量上下文模式
  includeReasoning?: boolean;  // 包含推理过程
  suppressToolErrorWarnings?: boolean;  // 抑制工具错误警告
};
```

## 心跳运行流程

### 1. 主运行函数

```typescript
// src/infra/heartbeat-runner.ts
export async function runHeartbeatOnce(opts: {
  cfg?: OpenClawConfig;
  agentId?: string;
  sessionKey?: string;
  heartbeat?: HeartbeatConfig;
  reason?: string;
  deps?: HeartbeatDeps;
}): Promise<HeartbeatRunResult> {
  const cfg = opts.cfg ?? loadConfig();
  const agentId = normalizeAgentId(
    explicitAgentId || forcedSessionAgentId || resolveDefaultAgentId(cfg)
  );
  const heartbeat = opts.heartbeat ?? resolveHeartbeatConfig(cfg, agentId);
  
  // 检查 1: 心跳是否启用
  if (!areHeartbeatsEnabled()) {
    return { status: "skipped", reason: "disabled" };
  }
  
  // 检查 2: 该代理是否启用心跳
  if (!isHeartbeatEnabledForAgent(cfg, agentId)) {
    return { status: "skipped", reason: "disabled" };
  }
  
  // 检查 3: 心跳间隔是否配置
  if (!resolveHeartbeatIntervalMs(cfg, undefined, heartbeat)) {
    return { status: "skipped", reason: "disabled" };
  }
  
  // 检查 4: 是否在活跃时段内
  if (!isWithinActiveHours(cfg, heartbeat, startedAt)) {
    return { status: "skipped", reason: "quiet-hours" };
  }
  
  // 检查 5: 是否有正在处理的请求
  const queueSize = getQueueSize(CommandLane.Main);
  if (queueSize > 0) {
    return { status: "skipped", reason: "requests-in-flight" };
  }
  
  // 预检查：触发器分类、事件检查、HEARTBEAT.md 门控
  const preflight = await resolveHeartbeatPreflight({
    cfg, agentId, heartbeat, forcedSessionKey, reason
  });
  
  if (preflight.skipReason) {
    return { status: "skipped", reason: preflight.skipReason };
  }
  
  // 执行心跳...
}
```

### 2. 预检查流程

```typescript
async function resolveHeartbeatPreflight(params) {
  const basePreflight = {
    session: await resolveHeartbeatSession(params),
    events: await resolveHeartbeatEvents(params),
    heartbeatMd: await resolveHeartbeatMd(params),
  };
  
  let skipReason: string | undefined;
  
  // 检查 HEARTBEAT.md 是否允许
  if (basePreflight.heartbeatMd?.skip) {
    skipReason = "heartbeat-md-skip";
  }
  
  // 检查是否有触发原因
  if (!hasTriggerReason(params.reason, basePreflight.events)) {
    skipReason = "no-trigger";
  }
  
  return { ...basePreflight, skipReason };
}
```

### 3. 会话管理

```typescript
function resolveHeartbeatSession(params) {
  const sessionKey = params.forcedSessionKey ?? 
    buildAgentSessionKey({ agentId: params.agentId });
  
  const storePath = resolveSessionStorePath(params.cfg);
  const store = loadSessionStore(storePath);
  const entry = store[sessionKey];
  
  return { entry, sessionKey, storePath };
}
```

## 心跳触发原因

### 1. 触发原因类型

```typescript
type HeartbeatReasonFlags = {
  isWakeReason: boolean;      // 唤醒原因
  isCronEventReason: boolean; // 定时任务事件
  isExecEventReason: boolean; // 执行完成事件
};
```

### 2. 原因解析

```typescript
function resolveHeartbeatReasonFlags(reason: string | undefined) {
  return {
    isWakeReason: reason === "wake",
    isCronEventReason: reason?.startsWith("cron:") ?? false,
    isExecEventReason: reason?.startsWith("exec:") ?? false,
  };
}
```

## 心跳提示构建

### 1. 提示生成

```typescript
function resolveHeartbeatRunPrompt(params) {
  const { cfg, heartbeat, preflight, canRelayToUser, workspaceDir } = params;
  
  let prompt = "";
  const hasCronEvents = preflight.events?.cronEvents?.length > 0;
  const hasExecCompletion = preflight.events?.execEvents?.length > 0;
  
  if (hasExecCompletion) {
    prompt += buildExecCompletionPrompt(preflight.events.execEvents);
  }
  
  if (hasCronEvents) {
    prompt += buildCronEventsPrompt(preflight.events.cronEvents);
  }
  
  // 添加技能提示
  const skillsPrompt = buildWorkspaceSkillsPrompt(workspaceDir, {
    config: cfg,
    eligibility: { remote: { note: "Heartbeat context" } }
  });
  
  prompt += skillsPrompt;
  
  return { prompt, hasExecCompletion, hasCronEvents };
}
```

### 2. 时间戳注入

```typescript
function appendCronStyleCurrentTimeLine(prompt, cfg, nowMs) {
  const timestamp = formatTimestamp(nowMs, cfg.timezone);
  return `Current time: ${timestamp}\n\n${prompt}`;
}
```

## 心跳响应处理

### 1. 响应规范化

```typescript
function normalizeHeartbeatReply(
  replyPayload: ReplyPayload,
  responsePrefix: string,
  ackMaxChars: number
) {
  let text = replyPayload.text?.trim() ?? "";
  const hasMedia = (replyPayload.mediaUrls?.length ?? 0) > 0;
  
  // 移除响应前缀
  if (responsePrefix && text.startsWith(responsePrefix)) {
    text = text.slice(responsePrefix.length).trim();
  }
  
  // 检查是否为 HEARTBEAT_OK
  const shouldSkip = text === "HEARTBEAT_OK" || 
    text.startsWith("HEARTBEAT_OK\n") ||
    text.endsWith("\nHEARTBEAT_OK");
  
  // 应用字符限制
  if (ackMaxChars > 0 && text.length > ackMaxChars) {
    text = text.slice(0, ackMaxChars) + "...";
  }
  
  return { text, hasMedia, shouldSkip };
}
```

### 2. HEARTBEAT_OK 处理

```typescript
// 当模型回复 HEARTBEAT_OK 时
if (normalized.shouldSkip && !normalized.hasMedia && !hasExecCompletion) {
  // 恢复之前的更新时间
  await restoreHeartbeatUpdatedAt({ storePath, sessionKey, updatedAt: previousUpdatedAt });
  
  // 修剪会话记录中的心跳轮次
  await pruneHeartbeatTranscript(transcriptState);
  
  // 发送心跳确认（如果配置了）
  const okSent = await maybeSendHeartbeatOk();
  
  emitHeartbeatEvent({
    status: "ok-token",
    reason: opts.reason,
    durationMs: Date.now() - startedAt,
    silent: !okSent,
  });
  
  return { status: "ran", durationMs };
}
```

## 心跳间隔配置

### 1. 间隔解析

```typescript
// src/infra/heartbeat-summary.ts
export function resolveHeartbeatIntervalMs(
  cfg: OpenClawConfig,
  overrideEvery?: string,
  heartbeat?: HeartbeatConfig
) {
  const raw = overrideEvery ??
    heartbeat?.every ??
    cfg.agents?.defaults?.heartbeat?.every ??
    DEFAULT_HEARTBEAT_EVERY;
  
  if (!raw) return null;
  
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  
  let ms: number;
  try {
    ms = parseDurationMs(trimmed, { defaultUnit: "m" });
  } catch {
    return null;
  }
  
  return ms > 0 ? ms : null;
}
```

### 2. 活跃时段检查

```typescript
function isWithinActiveHours(cfg, heartbeat, nowMs) {
  const activeHours = heartbeat?.activeHours ??
    cfg.agents?.defaults?.heartbeat?.activeHours;
  
  if (!activeHours) return true;
  
  const now = new Date(nowMs);
  const currentHour = now.getHours();
  
  return currentHour >= activeHours.start && currentHour < activeHours.end;
}
```

## 心跳投递机制

### 1. 投递目标解析

```typescript
function resolveHeartbeatDeliveryTarget({ cfg, entry, heartbeat }) {
  // 优先级 1: 心跳配置中的目标
  if (heartbeat?.target) {
    return resolveTargetFromConfig(heartbeat.target, cfg);
  }
  
  // 优先级 2: 会话中的最后渠道
  if (entry?.lastChannel && entry?.lastTo) {
    return {
      channel: entry.lastChannel,
      to: entry.lastTo,
      accountId: entry.lastAccountId,
      reason: "last-session"
    };
  }
  
  // 优先级 3: 无目标
  return { channel: "none", reason: "no-target" };
}
```

### 2. 可见性控制

```typescript
function resolveHeartbeatVisibility({ cfg, channel, accountId }) {
  const config = cfg.channels?.[channel];
  
  return {
    showOk: config?.heartbeat?.showOk ?? false,
    showAlerts: config?.heartbeat?.showAlerts ?? true,
    useIndicator: config?.heartbeat?.useIndicator ?? false,
  };
}
```

## 心跳事件系统

### 1. 事件发射

```typescript
function emitHeartbeatEvent(event: HeartbeatEvent) {
  // 事件类型
  const status = event.status;  // "skipped" | "ok-empty" | "ok-token" | "sent" | "failed"
  
  // 记录日志
  log.info("heartbeat event", {
    status,
    reason: event.reason,
    durationMs: event.durationMs,
    channel: event.channel,
    accountId: event.accountId,
    preview: event.preview,
    hasMedia: event.hasMedia,
    silent: event.silent,
  });
  
  // 发送到监控系统
  metrics.recordHeartbeat(event);
}
```

### 2. 事件过滤

```typescript
// src/infra/heartbeat-events-filter.ts
function filterHeartbeatEvents(events, config) {
  return events.filter(event => {
    // 过滤掉静默时段的事件
    if (isInQuietHours(event.timestamp, config)) {
      return false;
    }
    
    // 过滤掉重复事件
    if (isDuplicateEvent(event, recentEvents)) {
      return false;
    }
    
    return true;
  });
}
```

## 隔离会话模式

### 1. 概念

隔离会话模式为每次心跳创建新的会话，避免发送完整的对话历史，节省 token 消耗。

```typescript
const useIsolatedSession = heartbeat?.isolatedSession === true;

if (useIsolatedSession) {
  const isolatedKey = `${sessionKey}:heartbeat`;
  const cronSession = resolveCronSession({
    cfg,
    sessionKey: isolatedKey,
    agentId,
    nowMs: startedAt,
    forceNew: true,
  });
  
  cronSession.store[isolatedKey] = cronSession.sessionEntry;
  await saveSessionStore(cronSession.storePath, cronSession.store);
  
  runSessionKey = isolatedKey;
  runStorePath = cronSession.storePath;
}
```

### 2. 优势

- **节省 Token**: 不发送完整对话历史（约 100K tokens）
- **提高速度**: 减少上下文处理时间
- **降低成本**: 减少 LLM API 调用费用

## 心跳策略

### 1. 心跳策略配置

```typescript
// src/cron/heartbeat-policy.ts
type HeartbeatPolicy = {
  enabled: boolean;
  interval: string;
  activeHours?: {
    start: number;
    end: number;
  };
  maxRetries: number;
  retryDelay: string;
};
```

### 2. 策略应用

```typescript
function applyHeartbeatPolicy(policy: HeartbeatPolicy, config: OpenClawConfig) {
  return {
    ...config,
    agents: {
      ...config.agents,
      defaults: {
        ...config.agents?.defaults,
        heartbeat: {
          every: policy.interval,
          activeHours: policy.activeHours,
        }
      }
    }
  };
}
```

## 关键实现文件

### 核心文件
- [src/infra/heartbeat-runner.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/infra/heartbeat-runner.ts) - 心跳运行器
- [src/infra/heartbeat-events.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/infra/heartbeat-events.ts) - 事件系统
- [src/infra/heartbeat-summary.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/infra/heartbeat-summary.ts) - 间隔配置
- [src/infra/heartbeat-visibility.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/infra/heartbeat-visibility.ts) - 可见性控制

### 策略文件
- [src/cron/heartbeat-policy.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/heartbeat-policy.ts) - 心跳策略

### 自动回复文件
- [src/auto-reply/heartbeat.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/auto-reply/heartbeat.ts) - 自动回复
- [src/auto-reply/heartbeat-reply-payload.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/auto-reply/heartbeat-reply-payload.ts) - 回复载荷

## 最佳实践

### 1. 配置建议
- 设置合理的活跃时段，避免夜间打扰
- 使用隔离会话模式降低成本
- 配置适当的字符限制

### 2. 监控与调试
- 使用 `--verbose` 标志查看心跳日志
- 监控心跳事件和状态
- 检查会话存储中的心跳记录

### 3. 性能优化
- 启用轻量上下文模式
- 使用模型覆盖选择更便宜的模型
- 合理配置抑制工具错误警告

## 设计哲学

### 1. 主动服务
心跳机制体现了 AI 助手从"被动响应"到"主动服务"的转变：
- 定期检查状态
- 主动发送通知
- 预防性提醒

### 2. 用户友好
- 支持静默时段
- 可配置可见性
- 智能去重避免打扰

### 3. 资源高效
- 隔离会话节省 token
- 智能跳过无意义心跳
- 轻量上下文模式
