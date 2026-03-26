# Design: 错误恢复与故障转移机制

## 技术方案

### 实现类型
- **类型**: new（全新开发）
- **优先级**: high
- **阶段**: Phase 5 - 治理与可靠性增强
- **后端必需**: true

### 前端实现

#### 技术选型
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **HTTP 客户端**: fetch API / Tauri IPC

#### 模块结构
```
src/
├── features/
│   └── agent/
│       ├── components/
│       │   ├── FailoverSessionRepair.tsx    # 故障修复组件（已存在）
│       │   ├── ErrorRecoveryPanel.tsx       # 错误恢复面板
│       │   └── FailureNotification.tsx     # 故障通知
│       ├── hooks/
│       │   ├── useErrorRecovery.ts         # 错误恢复 Hook
│       │   └── useFailover.ts              # 故障转移 Hook
│       └── stores/
│           └── errorRecoveryStore.ts       # 错误恢复状态
```

#### 核心接口

```typescript
// 错误类型定义
interface AgentError {
  id: string;
  type: ErrorType;
  code: string;
  message: string;
  context?: ErrorContext;
  retryCount: number;
  recovered: boolean;
  createdAt: number;
}

type ErrorType =
  | 'llm_error'           // LLM 相关错误
  | 'tool_error'          // 工具调用错误
  | 'session_error'        // 会话状态错误
  | 'network_error'        // 网络错误
  | 'timeout_error'        // 超时错误
  | 'validation_error';   // 验证错误

interface ErrorContext {
  sessionId?: string;
  traceId?: string;
  toolName?: string;
  provider?: string;
  stepId?: string;
  metadata?: Record<string, unknown>;
}

// 重试配置
interface RetryConfig {
  maxRetries: number;           // 最大重试次数
  initialDelayMs: number;       // 初始延迟
  maxDelayMs: number;           // 最大延迟
  backoffMultiplier: number;    // 退避乘数
  retryableErrors: ErrorType[]; // 可重试的错误类型
}

// Provider 故障转移配置
interface FailoverConfig {
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  maxFailures: number;         // 触发切换的失败次数
  fallbackProviders: string[];  // 备用 Provider 列表
}

// 会话修复配置
interface SessionRepairConfig {
  checkpointIntervalMs: number; // 检查点保存间隔
  maxCheckpoints: number;      // 最大检查点数量
  autoRepairEnabled: boolean;   // 是否自动修复
}

// 恢复状态
interface RecoveryStatus {
  isRecovering: boolean;
  currentAction: string;
  progress: number;           // 0-100
  error?: AgentError;
  checkpointId?: string;
}

// Hook 接口
interface UseErrorRecovery {
  status: RecoveryStatus;
  retry: <T>(fn: () => Promise<T>, config?: Partial<RetryConfig>) => Promise<T>;
  failover: (provider: string) => Promise<void>;
  repairSession: () => Promise<void>;
  acknowledgeNotification: (notificationId: string) => Promise<void>;
}
```

### 后端实现

#### 技术选型
- **语言**: Rust
- **异步框架**: Tokio
- **数据库**: SQLite (本地存储)

#### 模块结构
```
src-tauri/src/
├── agent/
│   ├── recovery/
│   │   ├── mod.rs              # 模块入口
│   │   ├── error_manager.rs     # 错误管理器
│   │   ├── retry_strategy.rs    # 重试策略
│   │   ├── failover.rs         # 故障转移
│   │   ├── session_repair.rs    # 会话修复
│   │   ├── notifier.rs          # 通知服务
│   │   └── models.rs            # 数据模型
│   └── commands/
│       └── recovery_commands.rs # Tauri 命令
```

#### 核心数据结构

```rust
// 错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentError {
    pub id: String,
    pub error_type: String,
    pub code: String,
    pub message: String,
    pub context: Option<Value>,
    pub retry_count: u32,
    pub recovered: bool,
    pub recovered_at: Option<i64>,
    pub created_at: i64,
}

// 重试配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
    pub retryable_errors: Vec<String>,
}

// 故障转移配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailoverConfig {
    pub health_check_interval_ms: u64,
    pub health_check_timeout_ms: u64,
    pub max_failures: u32,
    pub fallback_providers: Vec<String>,
}

// 恢复状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryStatus {
    pub is_recovering: bool,
    pub current_action: String,
    pub progress: f64,
    pub error: Option<AgentError>,
    pub checkpoint_id: Option<String>,
}
```

#### 核心服务实现

```rust
// 错误恢复管理器
pub struct ErrorRecoveryManager {
    db: Database,
    retry_config: RetryConfig,
    failover_config: FailoverConfig,
    repair_config: SessionRepairConfig,
}

impl ErrorRecoveryManager {
    // 执行带重试的操作
    pub async fn execute_with_retry<T, F>(
        &self,
        operation: F,
        context: ErrorContext,
    ) -> Result<T, RecoveryError>
    where
        F: Fn() -> Pin<Box<dyn Future<Output = Result<T, AgentError>>>>,
    {
        let mut attempts = 0;
        let mut delay = self.retry_config.initial_delay_ms;

        loop {
            attempts += 1;

            match operation().await {
                Ok(result) => return Ok(result),
                Err(error) if self.should_retry(&error) && attempts < self.retry_config.max_retries => {
                    // 记录重试
                    self.record_retry(&error, attempts).await?;
                    // 指数退避
                    tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
                    delay = (delay as f64 * self.retry_config.backoff_multiplier) as u64;
                    delay = delay.min(self.retry_config.max_delay_ms);
                }
                Err(error) => {
                    // 不可重试或已达最大次数，尝试故障转移
                    return self.handle_irrecoverable_error(error).await;
                }
            }
        }
    }

    // 判断是否应该重试
    fn should_retry(&self, error: &AgentError) -> bool {
        self.retry_config.retryable_errors.contains(&error.error_type)
    }
}

// 会话修复服务
pub struct SessionRepairService {
    manager: Arc<ErrorRecoveryManager>,
    checkpoints: HashMap<String, Vec<Checkpoint>>,
}

impl SessionRepairService {
    // 保存检查点
    pub async fn save_checkpoint(
        &self,
        session_id: &str,
        state: SessionState,
    ) -> Result<String, RecoveryError> {
        let checkpoint = Checkpoint {
            id: generate_uuid(),
            session_id: session_id.to_string(),
            state: serde_json::to_value(&state)?,
            created_at: current_timestamp(),
        };

        // 维护检查点队列
        let checkpoints = self.checkpoints.entry(session_id.to_string())
            .or_insert_with(Vec::new);
        checkpoints.push(checkpoint.clone());

        // 限制检查点数量
        while checkpoints.len() > self.repair_config.max_checkpoints as usize {
            checkpoints.remove(0);
        }

        Ok(checkpoint.id)
    }

    // 恢复会话状态
    pub async fn repair_session(
        &self,
        session_id: &str,
    ) -> Result<SessionState, RecoveryError> {
        let checkpoints = self.checkpoints.get(session_id)
            .ok_or(RecoveryError::NoCheckpoints)?;

        let last_checkpoint = checkpoints.last()
            .ok_or(RecoveryError::NoCheckpoints)?;

        let state: SessionState = serde_json::from_value(last_checkpoint.state.clone())?;

        Ok(state)
    }
}

// 故障转移服务
pub struct FailoverService {
    current_provider: String,
    fallback_providers: Vec<String>,
    failure_counts: HashMap<String, u32>,
}

impl FailoverService {
    // 切换到备用 Provider
    pub async fn failover(&mut self) -> Result<String, RecoveryError> {
        // 记录当前 Provider 失败
        let current_failures = self.failure_counts
            .entry(self.current_provider.clone())
            .or_insert(0);
        *current_failures += 1;

        // 尝试切换到备用 Provider
        for provider in &self.fallback_providers {
            if self.is_provider_healthy(provider).await? {
                let old_provider = self.current_provider.clone();
                self.current_provider = provider.clone();
                self.failure_counts.remove(&old_provider);
                return Ok(provider.clone());
            }
        }

        Err(RecoveryError::NoHealthyProvider)
    }

    // 健康检查
    async fn is_provider_healthy(&self, provider: &str) -> Result<bool, RecoveryError> {
        // 实现 Provider 健康检查逻辑
    }
}
```

### API 设计

#### Tauri 命令

```rust
// 执行带重试的操作
#[tauri::command]
pub async fn execute_with_retry<T: serde::de::DeserializeOwned + serde::Serialize>(
    operation: String,  // 操作名称
    context: Value,     // 上下文
) -> Result<T, String>;

// 切换 LLM Provider
#[tauri::command]
pub async fn switch_llm_provider(
    target_provider: String,
) -> Result<SwitchProviderResponse, String>;

// 修复会话状态
#[tauri::command]
pub async fn repair_session(
    session_id: String,
) -> Result<RepairSessionResponse, String>;

// 获取恢复状态
#[tauri::command]
pub async fn get_recovery_status(
    session_id: String,
) -> Result<RecoveryStatus, String>;

// 确认人工介入
#[tauri::command]
pub async fn confirm_manual_intervention(
    notification_id: String,
    action: String,
    user_id: String,
) -> Result<bool, String>;

// 发送故障通知
#[tauri::command]
pub async fn send_failure_notification(
    error_id: String,
    level: String,
    message: String,
) -> Result<String, String>;
```

## 组件设计

### 前端组件

#### ErrorRecoveryPanel
- **职责**: 显示错误恢复状态和控制
- **Props**:
  - `sessionId: string`
  - `onRecovered?: () => void`
- **状态**: 恢复进度、当前操作、错误信息

#### FailureNotification
- **职责**: 显示故障通知
- **Props**:
  - `notification: FailureNotification`
  - `onAcknowledge?: () => void`

### 后端模块

#### ErrorRecoveryManager
- **职责**: 统一管理错误恢复逻辑
- **方法**:
  - `execute_with_retry()` - 带重试执行
  - `handle_irrecoverable_error()` - 处理不可恢复错误

#### FailoverService
- **职责**: Provider 故障转移
- **方法**:
  - `failover()` - 执行故障转移
  - `is_provider_healthy()` - 健康检查

#### SessionRepairService
- **职责**: 会话状态修复
- **方法**:
  - `save_checkpoint()` - 保存检查点
  - `repair_session()` - 修复会话

## 状态管理

### Zustand Store

```typescript
interface ErrorRecoveryState {
  status: RecoveryStatus;
  notifications: FailureNotification[];
  activeError: AgentError | null;

  // Actions
  setStatus: (status: RecoveryStatus) => void;
  addNotification: (notification: FailureNotification) => void;
  acknowledgeNotification: (id: string) => void;
  clearActiveError: () => void;
}
```

## 安全考虑

- 遵循 ADR-018 安全设计
- 实现权限校验（仅管理员可执行故障转移）
- 实现操作审计（所有恢复操作记录日志）
- 实现超时保护（防止无限重试）

## 性能考虑

- 使用指数退避避免雪崩
- 实现熔断器防止连锁故障
- 异步执行非关键恢复步骤
- 限制检查点数量控制内存使用

## 测试策略

### 单元测试
- RetryStrategy 各种策略测试
- FailoverService 切换逻辑测试
- SessionRepairService 检查点测试

### 集成测试
- ErrorRecoveryManager 完整流程测试
- Provider 切换测试
- 会话修复测试

### E2E 测试
- 模拟 LLM 服务故障
- 模拟工具调用失败
- 人工介入流程测试
