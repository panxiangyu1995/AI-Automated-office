# Design: 心跳机制后端执行引擎

## 模块结构

```
src-tauri/src/agent/
├── heartbeat.rs          # 心跳核心模块（新建）
├── heartbeat/
│   ├── mod.rs           # 子模块导出
│   ├── config.rs        # 心跳配置
│   ├── scheduler.rs     # 心跳调度器
│   ├── preflight.rs     # 预检查器
│   ├── executor.rs      # 心跳执行器
│   ├── parser.rs        # HEARTBEAT.md解析器
│   ├── events.rs        # 心跳事件
│   └── delivery.rs      # 投递机制
└── mod.rs               # 更新导出
```

## 核心数据结构

### HeartbeatConfig

```rust
/// 心跳配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatConfig {
    /// 心跳间隔（毫秒），默认30分钟
    pub interval_ms: Option<u64>,
    /// 活动时段配置
    pub active_hours: Option<ActiveHours>,
    /// 时区设置
    pub timezone: Option<String>,
    /// 是否使用隔离会话
    pub isolated_session: bool,
    /// 是否使用轻量上下文
    pub light_context: bool,
    /// 投递目标
    pub delivery_target: Option<DeliveryTarget>,
    /// 最大重试次数
    pub max_retries: u32,
    /// 是否启用
    pub enabled: bool,
}

/// 活动时段
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveHours {
    pub start: u8,  // 开始小时 (0-23)
    pub end: u8,    // 结束小时 (0-23)
}

/// 投递目标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryTarget {
    pub channel: String,
    pub target: Option<String>,
    pub account_id: Option<String>,
}
```

### HeartbeatPreflight

```rust
/// 预检查结果
#[derive(Debug, Clone)]
pub struct PreflightResult {
    /// 是否跳过
    pub skip: bool,
    /// 跳过原因
    pub skip_reason: Option<SkipReason>,
    /// HEARTBEAT.md内容
    pub heartbeat_md: Option<HeartbeatMdContent>,
    /// 会话信息
    pub session: SessionInfo,
    /// 事件列表
    pub events: Vec<HeartbeatEvent>,
}

/// 跳过原因
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SkipReason {
    Disabled,
    QuietHours,
    RequestsInFlight,
    HeartbeatMdSkip,
    NoTrigger,
    EmptyChecklist,
    ResourceUnavailable,
    ContextBudgetExceeded,
}
```

### HeartbeatMdContent

```rust
/// HEARTBEAT.md解析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatMdContent {
    /// 是否跳过
    pub skip: bool,
    /// 检查项列表
    pub check_items: Vec<CheckItem>,
    /// 原始内容
    pub raw_content: String,
}

/// 检查项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckItem {
    pub id: String,
    pub description: String,
    pub priority: CheckPriority,
    pub status: CheckItemStatus,
}

/// 检查项状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CheckItemStatus {
    Pending,
    Running,
    Passed,
    Warning,
    Failed,
    Skipped,
}

/// 检查项优先级
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CheckPriority {
    Critical,
    High,
    Medium,
    Low,
}
```

### HeartbeatRunResult

```rust
/// 心跳执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatRunResult {
    /// 执行状态
    pub status: HeartbeatStatus,
    /// 执行原因
    pub reason: Option<String>,
    /// 执行时长（毫秒）
    pub duration_ms: u64,
    /// 是否静默
    pub silent: bool,
    /// 通知内容
    pub notification: Option<HeartbeatNotification>,
    /// 检查结果
    pub check_results: Vec<CheckResult>,
}

/// 心跳状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HeartbeatStatus {
    Skipped,
    OkEmpty,
    OkToken,
    Sent,
    Failed,
}

/// 心跳通知
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatNotification {
    pub title: String,
    pub content: String,
    pub level: NotificationLevel,
    pub channel: String,
}

/// 通知级别
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationLevel {
    Info,
    Warning,
    Error,
}
```

## 核心流程

### 心跳执行主流程

```rust
/// 执行心跳
pub async fn run_heartbeat_once(
    config: &HeartbeatConfig,
    agent_id: &str,
    reason: Option<String>,
) -> Result<HeartbeatRunResult, HeartbeatError> {
    let started_at = std::time::Instant::now();
    
    // 1. 检查心跳是否启用
    if !config.enabled {
        return Ok(HeartbeatRunResult {
            status: HeartbeatStatus::Skipped,
            reason: Some("disabled".to_string()),
            duration_ms: started_at.elapsed().as_millis() as u64,
            silent: true,
            notification: None,
            check_results: vec![],
        });
    }
    
    // 2. 检查是否在活动时段内
    if !is_within_active_hours(config) {
        return Ok(HeartbeatRunResult {
            status: HeartbeatStatus::Skipped,
            reason: Some("quiet-hours".to_string()),
            duration_ms: started_at.elapsed().as_millis() as u64,
            silent: true,
            notification: None,
            check_results: vec![],
        });
    }
    
    // 3. 检查是否有正在处理的请求
    if has_requests_in_flight() {
        return Ok(HeartbeatRunResult {
            status: HeartbeatStatus::Skipped,
            reason: Some("requests-in-flight".to_string()),
            duration_ms: started_at.elapsed().as_millis() as u64,
            silent: true,
            notification: None,
            check_results: vec![],
        });
    }
    
    // 4. 执行预检查
    let preflight = run_preflight(config, agent_id, reason.clone()).await?;
    
    if preflight.skip {
        return Ok(HeartbeatRunResult {
            status: HeartbeatStatus::Skipped,
            reason: preflight.skip_reason.map(|r| format!("{:?}", r)),
            duration_ms: started_at.elapsed().as_millis() as u64,
            silent: true,
            notification: None,
            check_results: vec![],
        });
    }
    
    // 5. 执行心跳检查
    let result = execute_heartbeat_checks(&preflight, config).await?;
    
    // 6. 处理结果
    let final_result = process_heartbeat_result(result, config).await?;
    
    // 7. 发射事件
    emit_heartbeat_event(&final_result, reason);
    
    Ok(final_result)
}
```

### 预检查流程

```rust
/// 执行预检查
async fn run_preflight(
    config: &HeartbeatConfig,
    agent_id: &str,
    reason: Option<String>,
) -> Result<PreflightResult, HeartbeatError> {
    // 1. 解析HEARTBEAT.md
    let heartbeat_md = parse_heartbeat_md(agent_id).await?;
    
    // 2. 检查是否跳过
    if heartbeat_md.as_ref().map(|md| md.skip).unwrap_or(false) {
        return Ok(PreflightResult {
            skip: true,
            skip_reason: Some(SkipReason::HeartbeatMdSkip),
            heartbeat_md,
            session: get_session_info(agent_id)?,
            events: vec![],
        });
    }
    
    // 3. 检查清单是否为空
    if let Some(ref md) = heartbeat_md {
        if md.check_items.is_empty() {
            return Ok(PreflightResult {
                skip: true,
                skip_reason: Some(SkipReason::EmptyChecklist),
                heartbeat_md,
                session: get_session_info(agent_id)?,
                events: vec![],
            });
        }
    }
    
    // 4. 检查资源可用性
    if !check_resource_availability() {
        return Ok(PreflightResult {
            skip: true,
            skip_reason: Some(SkipReason::ResourceUnavailable),
            heartbeat_md,
            session: get_session_info(agent_id)?,
            events: vec![],
        });
    }
    
    // 5. 收集事件
    let events = collect_heartbeat_events(agent_id).await?;
    
    // 6. 检查是否有触发原因
    if !has_trigger_reason(&reason, &events) {
        return Ok(PreflightResult {
            skip: true,
            skip_reason: Some(SkipReason::NoTrigger),
            heartbeat_md,
            session: get_session_info(agent_id)?,
            events,
        });
    }
    
    Ok(PreflightResult {
        skip: false,
        skip_reason: None,
        heartbeat_md,
        session: get_session_info(agent_id)?,
        events,
    })
}
```

### HEARTBEAT.md解析

```rust
/// 解析HEARTBEAT.md文件
pub async fn parse_heartbeat_md(agent_id: &str) -> Result<Option<HeartbeatMdContent>, HeartbeatError> {
    let workspace_path = get_workspace_path(agent_id)?;
    let heartbeat_path = workspace_path.join("HEARTBEAT.md");
    
    if !heartbeat_path.exists() {
        return Ok(None);
    }
    
    let content = tokio::fs::read_to_string(&heartbeat_path).await?;
    
    // 检查跳过指令
    let skip = content.contains("<!-- SKIP_HEARTBEAT -->") 
        || content.contains("HEARTBEAT_SKIP");
    
    // 解析检查项
    let check_items = parse_check_items(&content);
    
    Ok(Some(HeartbeatMdContent {
        skip,
        check_items,
        raw_content: content,
    }))
}

/// 解析检查项
fn parse_check_items(content: &str) -> Vec<CheckItem> {
    let mut items = Vec::new();
    
    for line in content.lines() {
        // 匹配 - [ ] 或 - [x] 格式的检查项
        if line.starts_with("- [ ]") || line.starts_with("- [x]") {
            let checked = line.starts_with("- [x]");
            let description = line.trim_start_matches("- [ ]")
                .trim_start_matches("- [x]")
                .trim();
            
            if !description.is_empty() {
                items.push(CheckItem {
                    id: format!("check-{}", items.len() + 1),
                    description: description.to_string(),
                    priority: CheckPriority::Medium,
                    status: if checked {
                        CheckItemStatus::Passed
                    } else {
                        CheckItemStatus::Pending
                    },
                });
            }
        }
    }
    
    items
}
```

## Tauri命令

```rust
/// 启动心跳
#[tauri::command]
pub async fn start_heartbeat(
    agent_id: String,
    config: HeartbeatConfig,
) -> Result<(), String> {
    // 实现启动心跳逻辑
}

/// 停止心跳
#[tauri::command]
pub async fn stop_heartbeat(agent_id: String) -> Result<(), String> {
    // 实现停止心跳逻辑
}

/// 立即执行心跳
#[tauri::command]
pub async fn trigger_heartbeat_now(
    agent_id: String,
    reason: Option<String>,
) -> Result<HeartbeatRunResult, String> {
    // 实现立即执行心跳逻辑
}

/// 获取心跳状态
#[tauri::command]
pub async fn get_heartbeat_status(agent_id: String) -> Result<HeartbeatStatusInfo, String> {
    // 实现获取心跳状态逻辑
}

/// 更新心跳配置
#[tauri::command]
pub async fn update_heartbeat_config(
    agent_id: String,
    config: HeartbeatConfig,
) -> Result<(), String> {
    // 实现更新配置逻辑
}
```

## 事件定义

```rust
/// 心跳事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum HeartbeatEvent {
    /// 心跳开始
    HeartbeatStarted {
        agent_id: String,
        reason: Option<String>,
        timestamp: i64,
    },
    /// 心跳跳过
    HeartbeatSkipped {
        agent_id: String,
        reason: SkipReason,
        timestamp: i64,
    },
    /// 心跳完成
    HeartbeatCompleted {
        agent_id: String,
        result: HeartbeatRunResult,
        timestamp: i64,
    },
    /// 心跳失败
    HeartbeatFailed {
        agent_id: String,
        error: String,
        timestamp: i64,
    },
    /// 检查项状态变更
    CheckItemStatusChanged {
        agent_id: String,
        item_id: String,
        old_status: CheckItemStatus,
        new_status: CheckItemStatus,
        timestamp: i64,
    },
}
```

## 与前端集成

### 事件桥接

```typescript
// 前端监听心跳事件
listen('heartbeat-event', (event) => {
  const heartbeatEvent = event.payload as HeartbeatEvent;
  
  switch (heartbeatEvent.type) {
    case 'HeartbeatStarted':
      // 更新UI状态
      break;
    case 'HeartbeatSkipped':
      // 处理跳过
      break;
    case 'HeartbeatCompleted':
      // 更新检查清单状态
      break;
    case 'HeartbeatFailed':
      // 处理错误
      break;
  }
});
```

### 前端调用

```typescript
// 启动心跳
await invoke('start_heartbeat', {
  agentId: 'main-agent',
  config: {
    intervalMs: 30 * 60 * 1000, // 30分钟
    activeHours: { start: 9, end: 18 },
    enabled: true,
  }
});

// 立即触发心跳
await invoke('trigger_heartbeat_now', {
  agentId: 'main-agent',
  reason: 'manual-trigger'
});
```

## 测试策略

1. **单元测试**
   - 配置解析测试
   - HEARTBEAT.md解析测试
   - 预检查逻辑测试
   - 事件发射测试

2. **集成测试**
   - 完整心跳流程测试
   - 前后端集成测试
   - 调度器测试

3. **性能测试**
   - 心跳执行时间测试
   - 并发心跳测试
   - 内存使用测试
