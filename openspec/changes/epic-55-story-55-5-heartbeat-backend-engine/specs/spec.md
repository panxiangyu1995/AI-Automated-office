# Spec: 心跳机制后端执行引擎

## 功能规格

### FR1127: 心跳以主会话定期Agent回合执行（默认30分钟可配）

**描述**: 心跳机制应支持可配置的执行间隔，默认为30分钟。

**输入**:
- `interval_ms`: 心跳间隔（毫秒），可选，默认1800000（30分钟）

**输出**:
- 心跳按配置间隔定期执行

**验证**:
- 默认间隔为30分钟
- 可配置任意正整数间隔
- 间隔变更后立即生效

---

### FR1128: 心跳支持读取工作区 HEARTBEAT.md 作为检查清单

**描述**: 心跳应能读取工作区根目录下的HEARTBEAT.md文件，解析其中的检查清单。

**输入**:
- 工作区路径
- HEARTBEAT.md文件内容

**输出**:
- 解析后的检查项列表
- 跳过指令识别

**文件格式**:
```markdown
# 心跳检查清单

<!-- SKIP_HEARTBEAT -->  <!-- 可选：跳过心跳 -->

## 检查项

- [ ] 检查待处理任务
- [ ] 检查系统状态
- [x] 已完成的检查项
```

**验证**:
- 正确解析Markdown检查项
- 正确识别 `<!-- SKIP_HEARTBEAT -->` 跳过指令
- 正确识别 `HEARTBEAT_SKIP` 跳过指令
- 文件不存在时返回空清单

---

### FR1129: 心跳在无事项时返回 HEARTBEAT_OK 并静默处理

**描述**: 当心跳检查完成且无待办事项时，应返回HEARTBEAT_OK并静默处理，不打扰用户。

**输入**:
- 心跳执行结果

**输出**:
- 无待办时返回 `HEARTBEAT_OK`
- 不发送通知
- 不更新UI

**验证**:
- 无待办时正确返回HEARTBEAT_OK
- 不触发通知
- 不更新前端状态
- 记录审计日志

---

### FR1130: 心跳支持活动时段配置与时区设置

**描述**: 心跳应支持配置活动时段，只在指定时段内执行，并支持时区设置。

**输入**:
- `active_hours.start`: 活动时段开始小时（0-23）
- `active_hours.end`: 活动时段结束小时（0-23）
- `timezone`: 时区设置

**输出**:
- 只在活动时段内执行心跳
- 非活动时段跳过并记录原因

**验证**:
- 正确检查当前时间是否在活动时段内
- 支持跨午夜时段（如22:00-06:00）
- 正确处理时区转换
- 非活动时段跳过并记录"quiet-hours"原因

---

### FR1131: 心跳支持轻量上下文与隔离会话两种模式

**描述**: 心跳应支持两种执行模式以优化性能和成本。

**轻量上下文模式**:
- 只发送必要的上下文信息
- 减少token消耗
- 提高执行速度

**隔离会话模式**:
- 为每次心跳创建新会话
- 不发送完整对话历史
- 节省大量token（约100K tokens）

**输入**:
- `light_context`: 是否启用轻量上下文
- `isolated_session`: 是否启用隔离会话

**输出**:
- 按配置模式执行心跳

**验证**:
- 轻量上下文模式正确减少上下文
- 隔离会话模式正确创建新会话
- 两种模式可独立配置
- 模式切换正确生效

---

### FR1132: 心跳支持显式投递目标与通知策略

**描述**: 心跳应支持配置通知投递目标和策略。

**输入**:
- `delivery_target.channel`: 投递渠道
- `delivery_target.target`: 投递目标
- `delivery_target.account_id`: 账户ID

**输出**:
- 通知按配置投递

**投递渠道**:
- `status-bar`: 状态栏
- `toast`: Toast通知
- `message-center`: 消息中心
- `email`: 邮件
- `im`: 企业IM

**验证**:
- 正确解析投递目标配置
- 按配置渠道投递通知
- 支持多渠道同时投递
- 投递失败时记录日志

---

### FR1133: 心跳支持立即唤醒与"下次心跳"执行模式

**描述**: 心跳应支持两种触发模式。

**立即唤醒模式**:
- 用户手动触发
- 立即执行心跳检查
- 忽略间隔限制

**下次心跳执行模式**:
- 标记待执行
- 在下次调度心跳时执行
- 合并多个待执行请求

**输入**:
- `trigger_mode`: 触发模式（`immediate` | `next_heartbeat`）
- `reason`: 触发原因

**输出**:
- 按模式执行心跳

**验证**:
- 立即模式正确立即执行
- 下次心跳模式正确延迟执行
- 触发原因正确记录
- 多个延迟请求正确合并

---

### FR1134: 心跳若清单为空可跳过执行以节省成本

**描述**: 当HEARTBEAT.md不存在或检查清单为空时，应跳过执行以节省成本。

**输入**:
- HEARTBEAT.md解析结果

**输出**:
- 清单为空时跳过执行
- 记录跳过原因

**验证**:
- HEARTBEAT.md不存在时跳过
- 检查清单为空时跳过
- 记录"empty-checklist"跳过原因
- 不消耗API调用

---

## API规格

### start_heartbeat

启动心跳调度器。

**请求**:
```typescript
interface StartHeartbeatRequest {
  agent_id: string;
  config: HeartbeatConfig;
}
```

**响应**:
```typescript
interface StartHeartbeatResponse {
  success: boolean;
  error?: string;
}
```

---

### stop_heartbeat

停止心跳调度器。

**请求**:
```typescript
interface StopHeartbeatRequest {
  agent_id: string;
}
```

**响应**:
```typescript
interface StopHeartbeatResponse {
  success: boolean;
  error?: string;
}
```

---

### trigger_heartbeat_now

立即触发心跳。

**请求**:
```typescript
interface TriggerHeartbeatNowRequest {
  agent_id: string;
  reason?: string;
}
```

**响应**:
```typescript
interface TriggerHeartbeatNowResponse {
  result: HeartbeatRunResult;
}
```

---

### get_heartbeat_status

获取心跳状态。

**请求**:
```typescript
interface GetHeartbeatStatusRequest {
  agent_id: string;
}
```

**响应**:
```typescript
interface GetHeartbeatStatusResponse {
  status: HeartbeatStatusInfo;
}

interface HeartbeatStatusInfo {
  enabled: boolean;
  last_run: number | null;
  next_run: number | null;
  last_result: HeartbeatRunResult | null;
  config: HeartbeatConfig;
}
```

---

### update_heartbeat_config

更新心跳配置。

**请求**:
```typescript
interface UpdateHeartbeatConfigRequest {
  agent_id: string;
  config: HeartbeatConfig;
}
```

**响应**:
```typescript
interface UpdateHeartbeatConfigResponse {
  success: boolean;
  error?: string;
}
```

---

## 事件规格

### HeartbeatStarted

心跳开始执行。

```typescript
interface HeartbeatStartedEvent {
  type: 'HeartbeatStarted';
  agent_id: string;
  reason: string | null;
  timestamp: number;
}
```

---

### HeartbeatSkipped

心跳被跳过。

```typescript
interface HeartbeatSkippedEvent {
  type: 'HeartbeatSkipped';
  agent_id: string;
  reason: SkipReason;
  timestamp: number;
}
```

---

### HeartbeatCompleted

心跳执行完成。

```typescript
interface HeartbeatCompletedEvent {
  type: 'HeartbeatCompleted';
  agent_id: string;
  result: HeartbeatRunResult;
  timestamp: number;
}
```

---

### HeartbeatFailed

心跳执行失败。

```typescript
interface HeartbeatFailedEvent {
  type: 'HeartbeatFailed';
  agent_id: string;
  error: string;
  timestamp: number;
}
```

---

### CheckItemStatusChanged

检查项状态变更。

```typescript
interface CheckItemStatusChangedEvent {
  type: 'CheckItemStatusChanged';
  agent_id: string;
  item_id: string;
  old_status: CheckItemStatus;
  new_status: CheckItemStatus;
  timestamp: number;
}
```

---

## 数据类型规格

### HeartbeatConfig

```typescript
interface HeartbeatConfig {
  interval_ms?: number;           // 心跳间隔（毫秒），默认1800000
  active_hours?: ActiveHours;     // 活动时段
  timezone?: string;              // 时区，默认系统时区
  isolated_session?: boolean;     // 是否使用隔离会话，默认false
  light_context?: boolean;        // 是否使用轻量上下文，默认false
  delivery_target?: DeliveryTarget; // 投递目标
  max_retries?: number;           // 最大重试次数，默认3
  enabled?: boolean;              // 是否启用，默认true
}
```

### ActiveHours

```typescript
interface ActiveHours {
  start: number;  // 开始小时 (0-23)
  end: number;    // 结束小时 (0-23)
}
```

### DeliveryTarget

```typescript
interface DeliveryTarget {
  channel: string;          // 投递渠道
  target?: string;          // 投递目标
  account_id?: string;      // 账户ID
}
```

### HeartbeatRunResult

```typescript
interface HeartbeatRunResult {
  status: HeartbeatStatus;
  reason?: string;
  duration_ms: number;
  silent: boolean;
  notification?: HeartbeatNotification;
  check_results: CheckResult[];
}
```

### HeartbeatStatus

```typescript
type HeartbeatStatus = 
  | 'Skipped'
  | 'OkEmpty'
  | 'OkToken'
  | 'Sent'
  | 'Failed';
```

### SkipReason

```typescript
type SkipReason =
  | 'Disabled'
  | 'QuietHours'
  | 'RequestsInFlight'
  | 'HeartbeatMdSkip'
  | 'NoTrigger'
  | 'EmptyChecklist'
  | 'ResourceUnavailable'
  | 'ContextBudgetExceeded';
```

### CheckItem

```typescript
interface CheckItem {
  id: string;
  description: string;
  priority: CheckPriority;
  status: CheckItemStatus;
}
```

### CheckItemStatus

```typescript
type CheckItemStatus =
  | 'Pending'
  | 'Running'
  | 'Passed'
  | 'Warning'
  | 'Failed'
  | 'Skipped';
```

### CheckPriority

```typescript
type CheckPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';
```

---

## 错误码规格

| 错误码 | 描述 |
|--------|------|
| `HEARTBEAT_001` | 心跳未启用 |
| `HEARTBEAT_002` | 配置无效 |
| `HEARTBEAT_003` | HEARTBEAT.md解析失败 |
| `HEARTBEAT_004` | 预检查失败 |
| `HEARTBEAT_005` | 执行超时 |
| `HEARTBEAT_006` | 资源不可用 |
| `HEARTBEAT_007` | 通知投递失败 |
