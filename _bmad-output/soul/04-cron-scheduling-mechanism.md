# 定时任务机制深度分析

## 概述

OpenClaw 的定时任务系统（Cron Service）是一个完整的任务调度框架，支持灵活的时间表达式、持久化存储、可靠执行和错误处理。它允许用户创建定期运行的 AI 代理任务。

## 核心架构

### 1. CronService 类

```typescript
// src/cron/service.ts
class CronService {
  private state: CronServiceState;
  
  constructor(deps: CronServiceDeps) {
    this.state = {
      store: null,
      timer: null,
      deps,
    };
  }
  
  // 核心方法
  async start(): Promise<void>;
  async stop(): Promise<void>;
  async add(input: CronJobCreate): Promise<CronJob>;
  async update(id: string, patch: CronJobPatch): Promise<CronJob>;
  async remove(id: string): Promise<{ ok: boolean; removed: boolean }>;
  async run(id: string, mode?: "due" | "force"): Promise<void>;
  async list(opts?: { includeDisabled?: boolean }): Promise<CronJob[]>;
  async status(): Promise<CronServiceStatus>;
}
```

### 2. CronJob 结构

```typescript
type CronJob = {
  id: string;                    // 任务 ID
  name: string;                  // 任务名称
  description?: string;          // 任务描述
  agentId?: string;              // 代理 ID
  enabled: boolean;              // 是否启用
  schedule: CronSchedule;        // 调度配置
  createdAtMs: number;           // 创建时间
  updatedAtMs: number;           // 更新时间
  state: CronJobState;           // 运行状态
};

type CronJobState = {
  nextRunAtMs?: number;          // 下次运行时间
  runningAtMs?: number;          // 正在运行的时间戳
  lastRunAtMs?: number;          // 上次运行时间
  lastError?: string;            // 最后错误信息
  lastDeliveryStatus?: string;   // 最后投递状态
  lastDeliveryError?: string;    // 最后投递错误
};
```

## 调度类型

### 1. Cron 表达式调度

```typescript
type CronSchedule = 
  | { kind: "cron"; cron: string }  // 标准 cron 表达式
  | { kind: "every"; every: string; anchorMs?: number }  // 间隔调度
  | { kind: "once"; at: string }    // 一次性任务
  | { kind: "at"; at: string }      // 指定时间点
```

### 2. 调度示例

```typescript
// Cron 表达式
{ kind: "cron", cron: "0 9 * * 1-5" }  // 工作日早上 9 点

// 间隔调度
{ kind: "every", every: "1h" }         // 每小时
{ kind: "every", every: "30m" }        // 每 30 分钟
{ kind: "every", every: "1d", anchorMs: 1609459200000 }  // 每天固定时间

// 一次性任务
{ kind: "once", at: "2024-01-01T00:00:00Z" }

// 指定时间点
{ kind: "at", at: "09:00" }  // 每天 9 点
```

## 服务启动流程

### 1. 启动过程

```typescript
// src/cron/service/ops.ts
export async function start(state: CronServiceState) {
  // 检查是否启用
  if (!state.deps.cronEnabled) {
    state.deps.log.info({ enabled: false }, "cron: disabled");
    return;
  }
  
  const startupInterruptedJobIds = new Set<string>();
  
  await locked(state, async () => {
    // 加载存储
    await ensureLoaded(state, { skipRecompute: true });
    const jobs = state.store?.jobs ?? [];
    
    // 清理启动时标记为运行中的任务（可能是上次崩溃遗留）
    for (const job of jobs) {
      if (typeof job.state.runningAtMs === "number") {
        state.deps.log.warn(
          { jobId: job.id, runningAtMs: job.state.runningAtMs },
          "cron: clearing stale running marker on startup"
        );
        job.state.runningAtMs = undefined;
        startupInterruptedJobIds.add(job.id);
      }
    }
    await persist(state);
  });
  
  // 运行错过的任务
  await runMissedJobs(state, { skipJobIds: startupInterruptedJobIds });
  
  // 重新加载并启动定时器
  await locked(state, async () => {
    await ensureLoaded(state, { forceReload: true, skipRecompute: true });
    recomputeNextRuns(state);
    await persist(state);
    armTimer(state);
    
    state.deps.log.info(
      {
        enabled: true,
        jobs: state.store?.jobs.length ?? 0,
        nextWakeAtMs: nextWakeAtMs(state) ?? null,
      },
      "cron: started"
    );
  });
}
```

### 2. 定时器机制

```typescript
// src/cron/service/timer.ts
export function armTimer(state: CronServiceState) {
  // 清除现有定时器
  if (state.timer) {
    clearTimeout(state.timer);
  }
  state.timer = null;
  
  // 检查是否启用
  if (!state.deps.cronEnabled) {
    return;
  }
  
  // 获取下次唤醒时间
  const nextAt = nextWakeAtMs(state);
  if (!nextAt) {
    return;  // 没有需要运行的任务
  }
  
  const now = state.deps.nowMs();
  const delay = Math.max(nextAt - now, 0);
  
  // 防止紧密循环：最小延迟 2 秒
  const flooredDelay = delay === 0 ? MIN_REFIRE_GAP_MS : delay;
  
  // 最大延迟 60 秒，定期唤醒避免时间漂移
  const clampedDelay = Math.min(flooredDelay, MAX_TIMER_DELAY_MS);
  
  // 设置定时器
  state.timer = setTimeout(() => {
    void onTimer(state).catch((err) => {
      state.deps.log.error({ err: String(err) }, "cron: timer tick failed");
    });
  }, clampedDelay);
  
  state.deps.log.debug(
    { nextAt, delayMs: clampedDelay, clamped: delay > MAX_TIMER_DELAY_MS },
    "cron: timer armed"
  );
}
```

### 3. 定时器回调

```typescript
async function onTimer(state: CronServiceState) {
  try {
    await locked(state, async () => {
      await ensureLoaded(state, { forceReload: true });
      recomputeNextRuns(state);
      
      const dueJobs = findDueJobs(state);
      for (const job of dueJobs) {
        await enqueueRun(state, job);
      }
      
      await persist(state);
    });
  } finally {
    // 重新设置定时器
    armTimer(state);
  }
}
```

## 任务执行流程

### 1. 手动触发

```typescript
export async function run(state: CronServiceState, id: string, mode?: "due" | "force") {
  // 预检查
  const preflight = await inspectManualRunPreflight(state, id, mode);
  
  if (!preflight.ok) {
    return preflight;
  }
  
  if ("reason" in preflight) {
    return { ok: true, ran: false, reason: preflight.reason };
  }
  
  // 准备执行
  const prepared = await prepareManualRun(state, id, mode);
  
  if (!prepared.ok || !prepared.ran) {
    return prepared;
  }
  
  // 执行任务
  await executePreparedRun(state, prepared);
  
  return { ok: true, ran: true };
}
```

### 2. 执行准备

```typescript
async function prepareManualRun(state: CronServiceState, id: string, mode?: "due" | "force") {
  const preflight = await inspectManualRunPreflight(state, id, mode);
  
  if (!preflight.ok || "reason" in preflight) {
    return { ok: true, ran: false, reason: preflight.reason };
  }
  
  return await locked(state, async () => {
    const job = findJobOrThrow(state, id);
    
    // 检查是否已在运行
    if (typeof job.state.runningAtMs === "number") {
      return { ok: true, ran: false, reason: "already-running" };
    }
    
    // 标记为运行中
    job.state.runningAtMs = preflight.now;
    job.state.lastError = undefined;
    
    // 持久化运行标记
    await persist(state);
    
    // 发出事件
    emit(state, { jobId: job.id, action: "started", runAtMs: preflight.now });
    
    // 创建执行副本
    const executionJob = JSON.parse(JSON.stringify(job));
    
    return {
      ok: true,
      ran: true,
      jobId: job.id,
      startedAt: preflight.now,
      executionJob,
    };
  });
}
```

### 3. 任务执行

```typescript
async function executePreparedRun(state, prepared) {
  const { executionJob, startedAt, jobId } = prepared;
  
  let coreResult;
  try {
    coreResult = await executeJobCoreWithTimeout(state, executionJob);
  } catch (err) {
    coreResult = { status: "error", error: String(err) };
  }
  
  const endedAt = state.deps.nowMs();
  
  // 更新任务状态
  await locked(state, async () => {
    await ensureLoaded(state, { skipRecompute: true });
    const job = state.store?.jobs.find(entry => entry.id === jobId);
    
    if (!job) return;
    
    const shouldDelete = applyJobResult(state, job, {
      status: coreResult.status,
      error: coreResult.error,
      delivered: coreResult.delivered,
      startedAt,
      endedAt,
    });
    
    if (shouldDelete) {
      state.store.jobs = state.store.jobs.filter(j => j.id !== jobId);
    }
    
    await persist(state);
    armTimer(state);
    
    emit(state, {
      jobId: job.id,
      action: "finished",
      status: coreResult.status,
      error: coreResult.error,
      summary: coreResult.summary,
      delivered: coreResult.delivered,
    });
  });
}
```

## 隔离代理执行

### 1. 隔离执行概念

定时任务使用隔离代理（Isolated Agent）执行，确保：
- 独立的会话上下文
- 不影响主会话
- 可配置的技能过滤

### 2. 隔离执行流程

```typescript
// src/cron/isolated-agent.ts
export async function runIsolatedAgent(opts: {
  cfg: OpenClawConfig;
  job: CronJob;
  sessionKey: string;
}): Promise<IsolatedAgentResult> {
  const { cfg, job, sessionKey } = opts;
  
  // 创建隔离会话
  const isolatedSession = resolveCronSession({
    cfg,
    sessionKey,
    agentId: job.agentId,
    nowMs: Date.now(),
    forceNew: true,
  });
  
  // 构建技能快照
  const skillsSnapshot = buildSkillsSnapshot(cfg, job);
  
  // 构建提示
  const prompt = buildCronPrompt(job, skillsSnapshot);
  
  // 执行代理
  const result = await getReplyFromConfig({
    Body: prompt,
    From: "cron",
    To: "cron",
    Provider: "cron-event",
    SessionKey: isolatedSession.sessionKey,
  }, {
    isCron: true,
    skillFilter: job.skillFilter,
  }, cfg);
  
  return {
    status: "ok",
    text: result.text,
    mediaUrls: result.mediaUrls,
    sessionId: isolatedSession.sessionId,
    sessionKey: isolatedSession.sessionKey,
  };
}
```

### 3. 技能过滤

```typescript
// src/cron/isolated-agent/skills-snapshot.ts
function buildSkillsSnapshot(cfg: OpenClawConfig, job: CronJob) {
  const skillFilter = job.skillFilter;
  
  if (!skillFilter || skillFilter.length === 0) {
    return buildWorkspaceSkillSnapshot(resolveAgentWorkspaceDir(cfg, job.agentId));
  }
  
  // 只包含指定的技能
  return buildFilteredSkillSnapshot(cfg, job.agentId, skillFilter);
}
```

## 投递机制

### 1. 投递配置

```typescript
type CronDeliveryConfig = {
  channel?: string;        // 投递渠道
  to?: string;             // 投递目标
  accountId?: string;      // 账户 ID
  threadId?: string;       // 线程 ID
  sessionTarget?: "isolated" | "main";  // 会话目标
};
```

### 2. 投递流程

```typescript
// src/cron/delivery.ts
export async function deliverCronResult(opts: {
  cfg: OpenClawConfig;
  job: CronJob;
  result: IsolatedAgentResult;
}): Promise<DeliveryResult> {
  const { cfg, job, result } = opts;
  
  // 解析投递目标
  const delivery = resolveDeliveryTarget(cfg, job);
  
  if (delivery.channel === "none") {
    return { delivered: false, reason: "no-target" };
  }
  
  // 发送消息
  await deliverOutboundPayloads({
    cfg,
    channel: delivery.channel,
    to: delivery.to,
    accountId: delivery.accountId,
    threadId: delivery.threadId,
    payloads: [{
      text: result.text,
      mediaUrls: result.mediaUrls,
    }],
    session: buildOutboundSessionContext(cfg, job.agentId, delivery.sessionKey),
  });
  
  return { delivered: true };
}
```

## 持久化存储

### 1. 存储结构

```typescript
type CronStore = {
  version: number;
  jobs: CronJob[];
  metadata?: {
    lastMigrationAt?: number;
    schemaVersion?: number;
  };
};
```

### 2. 存储操作

```typescript
// src/cron/store.ts
export function loadCronStore(storePath: string): CronStore {
  try {
    const raw = fs.readFileSync(storePath, "utf-8");
    const parsed = JSON.parse(raw);
    return migrateStore(parsed);
  } catch {
    return { version: CURRENT_VERSION, jobs: [] };
  }
}

export async function saveCronStore(storePath: string, store: CronStore): Promise<void> {
  const tempPath = `${storePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tempPath, storePath);
}
```

### 3. 存储迁移

```typescript
// src/cron/store-migration.ts
function migrateStore(store: any): CronStore {
  let current = store;
  
  while (current.version < CURRENT_VERSION) {
    const migration = MIGRATIONS[current.version];
    if (!migration) break;
    current = migration(current);
  }
  
  return current;
}
```

## 会话清理

### 1. 会话收割器

```typescript
// src/cron/session-reaper.ts
export async function reapStaleSessions(state: CronServiceState) {
  const store = state.store;
  if (!store) return;
  
  const now = state.deps.nowMs();
  const maxAge = 7 * 24 * 60 * 60 * 1000;  // 7 天
  
  for (const job of store.jobs) {
    if (job.state.lastRunAtMs && now - job.state.lastRunAtMs > maxAge) {
      // 清理过期会话
      await cleanupSession(job.agentId, job.id);
    }
  }
}
```

## 错误处理

### 1. 超时策略

```typescript
// src/cron/service/timer.ts
const DEFAULT_JOB_TIMEOUT_MS = 5 * 60 * 1000;  // 5 分钟

async function executeJobCoreWithTimeout(state, job) {
  const timeout = job.timeout ?? DEFAULT_JOB_TIMEOUT_MS;
  
  return Promise.race([
    runIsolatedAgent({ cfg: state.deps.config, job, sessionKey: generateSessionKey() }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
}
```

### 2. 失败通知

```typescript
// src/cron/delivery.ts
async function notifyFailure(opts: {
  cfg: OpenClawConfig;
  job: CronJob;
  error: string;
}) {
  const { cfg, job, error } = opts;
  
  // 发送失败通知到配置的渠道
  await deliverOutboundPayloads({
    cfg,
    channel: job.failureNotify?.channel ?? "none",
    to: job.failureNotify?.to,
    payloads: [{
      text: `⚠️ Cron job "${job.name}" failed:\n\`\`\`\n${error}\n\`\`\``,
    }],
  });
}
```

## 关键实现文件

### 核心服务
- [src/cron/service.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/service.ts) - 服务主类
- [src/cron/service/ops.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/service/ops.ts) - 操作实现
- [src/cron/service/timer.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/service/timer.ts) - 定时器

### 隔离代理
- [src/cron/isolated-agent.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/isolated-agent.ts) - 隔离代理执行
- [src/cron/isolated-agent/skills-snapshot.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/isolated-agent/skills-snapshot.ts) - 技能快照

### 存储与调度
- [src/cron/store.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/store.ts) - 存储管理
- [src/cron/schedule.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/schedule.ts) - 调度解析
- [src/cron/delivery.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cron/delivery.ts) - 投递管理

### CLI
- [src/cli/cron-cli.ts](file:///i:/AI-Automated-office/开源库参考项目/openclaw/src/cli/cron-cli.ts) - CLI 命令

## 最佳实践

### 1. 任务配置
- 使用合理的超时设置
- 配置失败通知
- 设置适当的技能过滤器

### 2. 调度设计
- 避免过于频繁的调度
- 使用错峰机制减少并发
- 合理设置锚点时间

### 3. 监控与调试
- 定期检查任务状态
- 监控执行日志
- 使用 `openclaw doctor cron` 诊断问题

## 设计哲学

### 1. 可靠性优先
- 持久化存储确保任务不丢失
- 崩溃恢复机制
- 超时和错误处理

### 2. 资源隔离
- 独立的会话上下文
- 可配置的技能范围
- 不影响主会话

### 3. 灵活调度
- 支持多种调度类型
- 可配置投递目标
- 灵活的会话管理
