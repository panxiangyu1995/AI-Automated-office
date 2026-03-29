# subagent-permission-ruleset

## Overview

实现细粒度 PermissionRuleset 权限控制系统，支持办公场景操作级别的权限控制。

## Functionality

### Core Features

1. **权限操作类型（办公场景）**
   | 操作 | 说明 |
   |------|------|
   | `department` | 部门数据访问 |
   | `approval` | 审批操作（提交、批准、拒绝） |
   | `document` | 文档操作（创建、读取、修改、删除） |
   | `employee` | 员工信息操作 |
   | `finance` | 财务数据操作 |
   | `warehouse` | 仓储操作（入库、出库、盘点） |
   | `mcp_*` | MCP 工具调用 |

2. **权限动作**
   - `allow`：直接允许
   - `ask`：需要用户确认
   - `deny`：直接拒绝

3. **模式匹配**
   - 支持 glob 模式：`expense_*`、`employee_*`
   - 精确匹配：`all_employees`
   - 默认规则：`"*"`

4. **规则合并**
   - 默认规则 + 用户规则 + agent 特定规则
   - `deny` 优先于 `allow`
   - 更具体的模式优先

### User Interactions

1. 用户在 Agent 配置中定义权限规则
2. 执行操作时根据规则决定是否放行
3. `ask` 规则触发权限确认对话框

### Data Handling

```rust
#[derive(Debug, Clone)]
pub struct PermissionRule {
    pub operation: String,      // department, approval, document, etc.
    pub pattern: String,        // glob pattern for resources
    pub action: PermissionAction,  // allow, ask, deny
}

#[derive(Debug, Clone, PartialEq)]
pub enum PermissionAction {
    Allow,
    Ask,
    Deny,
}

pub type Ruleset = Vec<PermissionRule>;
```

### Edge Cases

- 无匹配规则：使用默认的 `deny`（保守策略）
- 多个规则匹配：最具体的规则生效
- 空规则集：使用全局默认规则

## Technical Spec

### Permission Checker

```rust
pub struct PermissionChecker {
    ruleset: Ruleset,
    defaults: Ruleset,
}

impl PermissionChecker {
    pub fn check(&self, operation: &str, resource: &str) -> PermissionAction {
        // 1. 先检查 ruleset
        // 2. 再检查 defaults
        // 3. 返回匹配结果
    }

    pub fn merge(&self, other: Ruleset) -> Ruleset {
        // 合并两个规则集，deny 优先
    }
}
```

### 配置示例（办公场景）

```yaml
permission:
  department:
    "*": "ask"
    "public_*": "allow"
  approval:
    "*": "ask"
    "approve_*": "allow"
    "reject_*": "allow"
  document:
    "read_*": "allow"
    "write_*": "ask"
    "delete_*": "deny"
  employee:
    "profile_*": "allow"
    "salary_*": "deny"
```

## Acceptance Criteria

1. 支持定义细粒度权限规则（办公场景）
2. 支持 glob 模式匹配
3. deny 规则优先于 allow 规则
4. ask 规则触发权限确认
5. 权限检查高效（O(n) 匹配）
