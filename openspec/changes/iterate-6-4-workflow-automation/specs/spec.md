# 规格: 工作流自动化

## 类型定义

### WorkflowDefinition
```rust
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub steps: Vec<WorkflowStep>,
    pub timeout_minutes: Option<u32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub enum WorkflowStep {
    Action { ... },
    Approval { ... },
    Condition { ... },
    End { ... },
}
```

### WorkflowState
```rust
pub enum WorkflowState {
    Pending,
    Running,
    Paused,
    AwaitingApproval(String),  // step_id
    Completed,
    Failed(String),  // error message
    Cancelled,
}
```

### WorkflowInstance
```rust
pub struct WorkflowInstance {
    pub id: String,
    pub definition_id: String,
    pub state: WorkflowState,
    pub current_step_id: Option<String>,
    pub context: Value,
    pub history: Vec<StepResult>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

## 工作流DSL

```
workflow: "员工入职流程"
steps:
  - id: "check_department"
    type: "condition"
    expression: "${employee.department} == '销售'"
    on_true: "create_sales_resources"
    on_false: "create_general_resources"
  
  - id: "create_sales_resources"
    type: "action"
    tool: "hr_create_resources"
    params: { type: "sales_kit" }
    on_success: "notify_manager"
  
  - id: "create_general_resources"
    type: "action"
    tool: "hr_create_resources"
    params: { type: "standard_kit" }
    on_success: "notify_manager"
  
  - id: "notify_manager"
    type: "approval"
    approvers: ["${employee.manager_id}"]
    timeout_minutes: 1440
  
  - id: "end"
    type: "end"
    result: { status: "completed" }
```

## API 规格

### workflow_create
- **输入**: `definition: WorkflowDefinition`
- **输出**: `Result<String, String>` // workflow instance id

### workflow_execute
- **输入**: `instance_id: String`
- **输出**: `Result<WorkflowResult, String>`

### workflow_pause / workflow_resume
- **输入**: `instance_id: String`
- **输出**: `Result<(), String>`

### workflow_approve
- **输入**: `instance_id: String, step_id: String, approved: bool, comment: Option<String>`
- **输出**: `Result<(), String>`

## 数据库表

### workflows
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 工作流实例ID |
| definition_id | TEXT | 工作流定义ID |
| state | TEXT | 当前状态 |
| context | TEXT JSON | 执行上下文 |
| current_step_id | TEXT | 当前步骤 |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

### workflow_history
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 历史记录ID |
| workflow_id | TEXT | 工作流实例ID |
| step_id | TEXT | 步骤ID |
| result | TEXT JSON | 执行结果 |
| executed_at | INTEGER | 执行时间 |
