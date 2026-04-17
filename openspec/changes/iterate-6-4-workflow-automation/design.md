# 设计: 工作流自动化

## 1. 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Engine                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WorkflowDefinition                                     │   │
│  │   - id, name, steps: Vec<Step>                       │   │
│  │   - Step: { type, action, condition, next }          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WorkflowExecutor                                     │   │
│  │   - execute(definition, context)                     │   │
│  │   - pause(), resume(), cancel()                     │   │
│  │   - state: Running | Paused | Completed | Failed     │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WorkflowStore (持久化)                               │   │
│  │   - save_state(), load_state()                       │   │
│  │   - history: Vec<StepResult>                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. 步骤类型

| 类型 | 说明 | 参与者 |
|------|------|-------|
| Action | 执行工具/技能 | Agent |
| Approval | 人工审批 | 用户 |
| Condition | 条件分支 | 系统 |
| Loop | 循环执行 | 系统 |
| Wait | 等待事件 | 系统 |
| End | 结束工作流 | - |

## 3. 涉及文件

- `src-tauri/src/workflow/mod.rs` - 工作流引擎主模块
- `src-tauri/src/workflow/engine.rs` - 执行引擎
- `src-tauri/src/workflow/store.rs` - 状态持久化
- `src-tauri/src/agent/tools/automation/mod.rs` - 集成定时任务

## 4. 关键实现

### 4.1 工作流定义

```rust
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub steps: Vec<WorkflowStep>,
    pub timeout_minutes: Option<u32>,
}

pub enum WorkflowStep {
    Action {
        id: String,
        name: String,
        tool: String,
        params: Value,
        on_success: Option<String>,  // next step id
        on_failure: Option<String>,
    },
    Approval {
        id: String,
        name: String,
        approvers: Vec<String>,
        timeout_minutes: Option<u32>,
    },
    Condition {
        id: String,
        expression: String,  // DSL: ${var} > 0
        on_true: String,    // step id
        on_false: String,
    },
    End {
        result: Value,
    },
}
```

### 4.2 执行引擎

```rust
pub struct WorkflowExecutor {
    pub definition: WorkflowDefinition,
    pub state: WorkflowState,
    pub current_step_id: Option<String>,
    pub context: WorkflowContext,
    pub history: Vec<StepResult>,
}

impl WorkflowExecutor {
    pub async fn execute(&mut self) -> Result<WorkflowResult> {
        loop {
            match self.state {
                WorkflowState::Running => {
                    if let Some(step_id) = self.next_step() {
                        self.execute_step(step_id).await?;
                    } else {
                        self.state = WorkflowState::Completed;
                        break;
                    }
                }
                WorkflowState::AwaitingApproval(step_id) => {
                    // 等待人工审批
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
                _ => break,
            }
        }
        Ok(self.build_result())
    }
}
```

## 5. 验收标准

- [ ] 支持工作流定义（步骤+条件分支）
- [ ] 支持工作流执行和状态跟踪
- [ ] 支持工作流暂停和恢复
- [ ] 支持审批节点集成
- [ ] 工作流状态持久化到数据库
