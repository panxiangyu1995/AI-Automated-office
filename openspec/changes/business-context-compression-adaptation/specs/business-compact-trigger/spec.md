# business-compact-trigger

## ADDED Requirements

### Requirement: 触发条件定义

业务压缩触发器 SHALL 支持以下触发条件：

```typescript
interface BusinessCompactTrigger {
  type: 'token_threshold' | 'department_change' | 'approval_change' | 'time_based' | 'manual';
  priority: number;
  targetStrategy: 'business_memory' | 'micro' | 'business_full' | 'reactive';
}

const BUSINESS_TRIGGERS: BusinessCompactTrigger[] = [
  {
    type: 'token_threshold',
    priority: 50,
    targetStrategy: 'micro'
  },
  {
    type: 'department_change',
    priority: 80,
    targetStrategy: 'business_memory'
  },
  {
    type: 'approval_change',
    priority: 90,
    targetStrategy: 'micro'
  },
  {
    type: 'time_based',
    priority: 40,
    targetStrategy: 'micro'
  },
  {
    type: 'manual',
    priority: 100,
    targetStrategy: 'business_full'
  }
];
```

#### Scenario: Token 阈值触发

- **WHEN** 当前 Token 数 >= 上下文窗口 - 15,000
- **THEN** 系统 SHALL 触发微压缩策略
- **AND** SHALL 设置优先级为 50

#### Scenario: 部门切换触发

- **WHEN** 用户切换到不同部门
- **THEN** 系统 SHALL 触发业务记忆压缩
- **AND** SHALL 设置优先级为 80

### Requirement: Token 阈值配置

Token 阈值触发 SHALL 使用以下配置：

```typescript
export const BUSINESS_COMPACT_CONFIG = {
  // 基础 Token 阈值
  AUTO_COMPACT_BUFFER_TOKENS: 15_000,      // 自动压缩缓冲
  WARNING_THRESHOLD: 25_000,               // 警告阈值（显示提示）
  ERROR_THRESHOLD: 25_000,                 // 错误阈值

  // 层级阈值
  MEMORY_COMPACT_THRESHOLD: 20_000,        // 业务记忆压缩
  MICRO_COMPACT_THRESHOLD: 40_000,        // 微压缩
  FULL_COMPACT_THRESHOLD: 60_000,         // 全量压缩

  // 压缩比例
  TARGET_COMPRESSION_RATIO: 0.4,          // 目标压缩到 40%
  MIN_COMPRESSION_RATIO: 0.3,             // 最小压缩比例
};
```

#### Scenario: 达到警告阈值

- **WHEN** Token 数达到 WARNING_THRESHOLD (25,000)
- **THEN** 系统 SHALL 显示压缩警告
- **AND** SHALL 提示用户可能需要压缩

#### Scenario: 达到错误阈值

- **WHEN** Token 数达到 ERROR_THRESHOLD (25,000)
- **THEN** 系统 SHALL 立即触发自动压缩
- **AND** SHALL 不等待用户确认

### Requirement: 部门切换触发

部门切换时 SHALL 触发轻量级压缩：

**触发时机**：
- 用户点击不同部门模块
- AI 建议切换到其他部门
- 跨部门协作时

**压缩内容**：
- 清除旧部门的详细上下文
- 保留用户显式引用的实体
- 保留待审批项（跨部门审批）

**不压缩内容**：
- Never Compress 类型的实体
- 当前会话摘要

#### Scenario: 用户主动切换部门

- **WHEN** 用户点击"销售部"切换部门
- **THEN** 系统 SHALL 触发业务记忆压缩
- **AND** SHALL 保留跨部门的待审批项

#### Scenario: AI 建议切换部门

- **WHEN** AI 建议切换到更适合的部门
- **THEN** 系统 SHALL 显示切换确认
- **AND** 确认后触发压缩

### Requirement: 审批状态变更触发

审批状态变更时 SHALL 触发微压缩：

**触发场景**：
- 用户提交了新审批
- 审批被批准/驳回
- 审批被退回修改
- 收到新的审批委托

**压缩策略**：
- 清理过期的通知消息
- 保留审批链的完整状态
- 保留相关文档引用

#### Scenario: 提交新审批触发

- **WHEN** 用户提交新的审批申请
- **THEN** 系统 SHALL 触发微压缩
- **AND** SHALL 清理旧的审批查询结果

#### Scenario: 审批被批准触发

- **WHEN** 审批被批准时
- **THEN** 系统 SHALL 更新 Never Compress 标记
- **AND** SHALL 清理该审批的临时缓存

### Requirement: 时效触发

系统 SHALL 支持基于时间的触发条件：

```typescript
const TIME_BASED_TRIGGERS = {
  staleThresholdMinutes: 30,    // 30 分钟无操作后首次交互
  archiveThresholdHours: 24,   // 24 小时进入归档
  refreshInterval: 60,         // 每 60 分钟检查一次
};
```

#### Scenario: 长时间无操作后首次交互

- **WHEN** 用户 30 分钟无操作后发送消息
- **THEN** 系统 SHALL 触发微压缩
- **AND** SHALL 清理过期的活动日志

#### Scenario: 归档过期内容

- **WHEN** 内容超过 24 小时未被访问
- **THEN** 系统 SHALL 将其移入归档状态
- **AND** SHALL 从主上下文中移除

### Requirement: 手动触发

用户 SHALL 能手动触发压缩：

**触发方式**：
- 点击工具栏"压缩上下文"按钮
- 快捷键 `Ctrl+Shift+C`
- 对 AI 说"压缩上下文"

**手动压缩行为**：
- 立即触发业务全量压缩
- 显示压缩进度
- 完成后显示压缩统计

#### Scenario: 用户点击压缩按钮

- **WHEN** 用户点击"压缩上下文"按钮
- **THEN** 系统 SHALL 立即触发全量压缩
- **AND** SHALL 显示加载状态

#### Scenario: 快捷键触发

- **WHEN** 用户按下 `Ctrl+Shift+C`
- **THEN** 系统 SHALL 等效于点击压缩按钮
- **AND** SHALL 执行全量压缩

### Requirement: 触发去重

相同类型的连续触发 SHALL 进行去重：

- Token 阈值触发：每 5 分钟最多一次
- 部门切换：每次切换最多一次
- 审批变更：每次变更最多一次
- 时效触发：每次会话最多 3 次

#### Scenario: 防止重复触发

- **WHEN** Token 阈值触发完成 2 分钟后再次达到阈值
- **THEN** 系统 SHALL 不再次触发压缩
- **AND** SHALL 等待 5 分钟冷却期

### Requirement: 触发状态管理

触发器 SHALL 管理以下状态：

```typescript
interface TriggerState {
  lastTriggerTime: Map<TriggerType, Date>;
  triggerCount: Map<TriggerType, number>;
  pendingTriggers: Trigger[];
  suppressUntil: Date | null;
}
```

#### Scenario: 记录触发历史

- **WHEN** 任何触发器触发时
- **THEN** 系统 SHALL 记录触发时间和类型
- **AND** SHALL 更新触发计数

#### Scenario: 抑制重复触发

- **WHEN** 触发器处于冷却期
- **THEN** 系统 SHALL 忽略相同类型的触发
- **AND** SHALL 记录被抑制的触发
