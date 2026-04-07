# Design: 心跳机制后端完善

## 技术架构

### 1. HEARTBEAT.md格式

```yaml
---
name: daily-report
schedule: "0 9 * * *"  # cron表达式
enabled: true
precheck:
  - type: network
    target: "api.example.com"
  - type: service
    target: "database"
execution:
  type: skill
  skill: "daily-report-generator"
timeout: 300  # 秒
retry:
  max_attempts: 3
  interval: 60
notification:
  on_failure: true
  channels: ["notify", "log"]
---
```

### 2. 解析器

```rust
pub struct HeartbeatParser;

impl HeartbeatParser {
    pub fn parse(content: &str) -> Result<Vec<HeartbeatTask>, ParseError> {
        // 解析YAML Frontmatter
        let tasks: Vec<HeartbeatTask> = serde_yaml::from_str(content)?;
        Ok(tasks)
    }
}

pub struct HeartbeatTask {
    pub name: String,
    pub schedule: String,
    pub enabled: bool,
    pub precheck: Vec<PrecheckItem>,
    pub execution: ExecutionConfig,
    pub timeout: u64,
    pub retry: RetryConfig,
    pub notification: NotificationConfig,
}
```

### 3. 预检机制

```rust
pub async fn precheck(&self, items: &[PrecheckItem]) -> Result<bool> {
    for item in items {
        match item {
            PrecheckItem::Network { target } => {
                if !self.check_network(target).await? {
                    return Ok(false);
                }
            }
            PrecheckItem::Service { target } => {
                if !self.check_service(target).await? {
                    return Ok(false);
                }
            }
            PrecheckItem::Condition { expression } => {
                if !self.evaluate_condition(expression).await? {
                    return Ok(false);
                }
            }
        }
    }
    Ok(true)
}
```

### 4. 隔离执行

```rust
pub async fn execute_isolated(&self, task: &HeartbeatTask) -> Result<ExecutionResult> {
    // 创建隔离的执行环境
    let ctx = ExecutionContext::new(task.timeout);
    
    // 执行预检
    if !self.precheck(&task.precheck).await? {
        return Ok(ExecutionResult::PrecheckFailed);
    }
    
    // 执行任务
    let result = tokio::time::timeout(
        Duration::from_secs(task.timeout),
        self.execute_inner(&task.execution, &ctx),
    ).await;
    
    match result {
        Ok(Ok(output)) => Ok(ExecutionResult::Success(output)),
        Ok(Err(e)) => {
            self.handle_retry(task, e).await
        }
        Err(_) => Ok(ExecutionResult::Timeout),
    }
}
```

### 5. Tauri命令

```rust
#[tauri::command]
pub async fn get_heartbeat_tasks() -> Result<Vec<HeartbeatTask>, String>;

#[tauri::command]
pub async fn parse_heartbeat_file(path: String) -> Result<Vec<HeartbeatTask>, String>;

#[tauri::command]
pub async fn trigger_heartbeat_task(name: String) -> Result<ExecutionResult, String>;

#[tauri::command]
pub async fn get_heartbeat_status() -> Result<HeartbeatStatus, String>;
```
