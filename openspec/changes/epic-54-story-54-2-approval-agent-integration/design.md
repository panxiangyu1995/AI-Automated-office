# Design: 审批中心 - Agent集成

## 技术方案

### 实现类型
- **implementationType**: `refactor`
- **优先级**: `high`
- **阶段**: Phase 4 - 业务模块动态化
- **Epic**: Epic 54 (业务模块动态化)
- **Story**: Story 54.2

### 技术栈选择
- **后端**: Rust + Tauri + ApprovalWorkflowEngine (Story 54.1)
- **前端**: React + TypeScript + Zustand + Shadcn/ui
- **工具系统**: Core Tools + Plugin Tools

## API 设计

### 工具定义接口

```typescript
// src/features/agent/tools/types/toolDefinition.ts

export interface ToolDefinition {
  name: string;           // 工具名称: approval_create
  description: string;    // 工具描述
  parameters: ToolParameter[];  // 参数定义
  returns: ToolReturn;    // 返回值定义
  examples?: ToolExample[];    // 使用示例
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];        // 枚举值
}

export interface ToolReturn {
  type: string;
  description: string;
}

export interface ToolExample {
  input: Record<string, any>;
  output: any;
}
```

### 审批工具集定义

```typescript
// src/features/approval/tools/approvalTools.ts

import type { ToolDefinition } from '../agent/tools/types/toolDefinition';

export const approvalTools: ToolDefinition[] = [
  {
    name: 'approval_create',
    description: '创建新的审批请求。当用户需要申请报销、请假、合同签署等需要上级审批的业务操作时使用。',
    parameters: [
      {
        name: 'flow_def_id',
        type: 'string',
        description: '审批流程定义 ID，从可用的审批流程列表中选择',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: '审批标题，简述申请内容（如"2024年Q1差旅费用报销"）',
        required: true,
      },
      {
        name: 'context_data',
        type: 'object',
        description: '业务上下文数据，包含与审批相关的业务信息',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      description: '返回创建的审批实例，包含 instance_id 用于后续查询',
    },
    examples: [
      {
        input: {
          flow_def_id: 'flow-001',
          title: '2024年Q1差旅费用报销',
          context_data: {
            amount: 5000,
            category: 'travel',
            items: ['机票', '酒店', '餐费'],
          },
        },
        output: {
          success: true,
          instance_id: 'inst-001',
          status: 'pending',
          message: '审批请求已创建，等待审批中',
        },
      },
    ],
  },
  {
    name: 'approval_query',
    description: '查询审批请求的状态和详情。用于查看已提交的审批处于哪个环节、审批结果如何。',
    parameters: [
      {
        name: 'instance_id',
        type: 'string',
        description: '审批实例 ID',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: '返回审批实例的详细信息',
    },
    examples: [
      {
        input: { instance_id: 'inst-001' },
        output: {
          success: true,
          instance: {
            id: 'inst-001',
            title: '2024年Q1差旅费用报销',
            status: 'in_progress',
            current_node: '部门经理审批',
            approver: '张三',
            created_at: '2024-01-15T10:30:00Z',
          },
        },
      },
    ],
  },
  {
    name: 'approval_query_by_applicant',
    description: '查询申请人提交的所有审批请求。用于查看自己提交的审批列表和状态。',
    parameters: [
      {
        name: 'status',
        type: 'string',
        description: '筛选状态：pending/in_progress/approved/rejected/cancelled',
        required: false,
        enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'],
      },
      {
        name: 'limit',
        type: 'number',
        description: '返回数量限制，默认 10',
        required: false,
        default: 10,
      },
    ],
    returns: {
      type: 'array',
      description: '返回审批实例列表',
    },
  },
  {
    name: 'approval_query_pending',
    description: '查询当前用户需要处理的待审批列表。用于查看需要自己审批的请求。',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: '返回数量限制，默认 10',
        required: false,
        default: 10,
      },
    ],
    returns: {
      type: 'array',
      description: '返回待审批实例列表',
    },
  },
  {
    name: 'approval_approve',
    description: '审批通过。当用户确认申请内容无误、同意申请时使用。',
    parameters: [
      {
        name: 'instance_id',
        type: 'string',
        description: '审批实例 ID',
        required: true,
      },
      {
        name: 'node_instance_id',
        type: 'string',
        description: '节点实例 ID',
        required: true,
      },
      {
        name: 'comment',
        type: 'string',
        description: '审批意见，可选',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      description: '返回审批结果和更新后的实例状态',
    },
    examples: [
      {
        input: {
          instance_id: 'inst-001',
          node_instance_id: 'node-001',
          comment: '同意报销，金额在预算范围内',
        },
        output: {
          success: true,
          status: 'in_progress',
          next_node: '财务审批',
          message: '审批已通过，等待下一节点审批',
        },
      },
    ],
  },
  {
    name: 'approval_reject',
    description: '审批拒绝。当申请内容有问题或不符合规定时使用，需要填写拒绝原因。',
    parameters: [
      {
        name: 'instance_id',
        type: 'string',
        description: '审批实例 ID',
        required: true,
      },
      {
        name: 'node_instance_id',
        type: 'string',
        description: '节点实例 ID',
        required: true,
      },
      {
        name: 'reason',
        type: 'string',
        description: '拒绝原因，必须填写',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: '返回审批结果',
    },
    examples: [
      {
        input: {
          instance_id: 'inst-001',
          node_instance_id: 'node-001',
          reason: '报销金额超出预算，请重新提交',
        },
        output: {
          success: true,
          status: 'rejected',
          message: '审批已拒绝，申请人将收到通知',
        },
      },
    ],
  },
  {
    name: 'approval_cancel',
    description: '取消审批。当申请人撤回申请或管理员取消审批时使用。',
    parameters: [
      {
        name: 'instance_id',
        type: 'string',
        description: '审批实例 ID',
        required: true,
      },
      {
        name: 'reason',
        type: 'string',
        description: '取消原因',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      description: '返回取消结果',
    },
  },
];
```

### 后端工具实现

```rust
// src-tauri/src/agent/tools/approval_tools.rs

use crate::approval::commands::{self, ApprovalInstance};
use crate::agent::tools::{Tool, ToolCall, ToolResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// 审批工具注册表
pub struct ApprovalToolRegistry {
    engine: Arc<ApprovalWorkflowEngine>,
}

impl ApprovalToolRegistry {
    pub fn new(engine: Arc<ApprovalWorkflowEngine>) -> Self {
        Self { engine }
    }

    /// 获取所有审批工具
    pub fn get_tools(&self) -> Vec<Tool> {
        vec![
            Tool {
                name: "approval_create".to_string(),
                description: "创建新的审批请求".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "flow_def_id",
                        "type": "string",
                        "description": "审批流程定义 ID",
                        "required": true
                    },
                    {
                        "name": "title",
                        "type": "string",
                        "description": "审批标题",
                        "required": true
                    },
                    {
                        "name": "context_data",
                        "type": "object",
                        "description": "业务上下文数据",
                        "required": false
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_create(call))
                }),
            },
            Tool {
                name: "approval_query".to_string(),
                description: "查询审批请求的状态和详情".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "instance_id",
                        "type": "string",
                        "description": "审批实例 ID",
                        "required": true
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_query(call))
                }),
            },
            Tool {
                name: "approval_approve".to_string(),
                description: "审批通过".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "instance_id",
                        "type": "string",
                        "description": "审批实例 ID",
                        "required": true
                    },
                    {
                        "name": "node_instance_id",
                        "type": "string",
                        "description": "节点实例 ID",
                        "required": true
                    },
                    {
                        "name": "comment",
                        "type": "string",
                        "description": "审批意见",
                        "required": false
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_approve(call))
                }),
            },
            Tool {
                name: "approval_reject".to_string(),
                description: "审批拒绝".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "instance_id",
                        "type": "string",
                        "description": "审批实例 ID",
                        "required": true
                    },
                    {
                        "name": "node_instance_id",
                        "type": "string",
                        "description": "节点实例 ID",
                        "required": true
                    },
                    {
                        "name": "reason",
                        "type": "string",
                        "description": "拒绝原因",
                        "required": true
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_reject(call))
                }),
            },
            Tool {
                name: "approval_cancel".to_string(),
                description: "取消审批".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "instance_id",
                        "type": "string",
                        "description": "审批实例 ID",
                        "required": true
                    },
                    {
                        "name": "reason",
                        "type": "string",
                        "description": "取消原因",
                        "required": false
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_cancel(call))
                }),
            },
            Tool {
                name: "approval_query_pending".to_string(),
                description: "查询当前用户需要处理的待审批列表".to_string(),
                parameters: serde_json::json!([
                    {
                        "name": "limit",
                        "type": "number",
                        "description": "返回数量限制",
                        "required": false
                    }
                ]),
                handler: Arc::new(|call: ToolCall| -> ToolResult {
                    Box::pin(self.handle_query_pending(call))
                }),
            },
        ]
    }

    /// 处理创建审批请求
    async fn handle_create(&self, call: ToolCall) -> ToolResult {
        let args: CreateApprovalArgs = serde_json::from_value(call.arguments)
            .map_err(|e| ToolError::InvalidArguments(e.to_string()))?;

        let context_json = args.context_data.as_ref()
            .map(|v| serde_json::to_string(v).ok())
            .flatten();

        let instance = self.engine.start_instance(
            args.flow_def_id,
            args.title,
            call.operator_id,
            context_json,
        ).await
        .map_err(|e| ToolError::ExecutionFailed(e.to_string()))?;

        Ok(ToolResult {
            success: true,
            data: serde_json::json!({
                "instance_id": instance.id,
                "status": instance.status.to_string(),
                "message": "审批请求已创建"
            }),
        })
    }

    /// 处理查询审批请求
    async fn handle_query(&self, call: ToolCall) -> ToolResult {
        let args: QueryApprovalArgs = serde_json::from_value(call.arguments)
            .map_err(|e| ToolError::InvalidArguments(e.to_string()))?;

        let instance = self.engine.get_instance(&args.instance_id).await
            .map_err(|e| ToolError::NotFound(e.to_string()))?;

        Ok(ToolResult {
            success: true,
            data: serde_json::json!({
                "instance": instance
            }),
        })
    }

    /// 处理审批通过
    async fn handle_approve(&self, call: ToolCall) -> ToolResult {
        let args: ApproveApprovalArgs = serde_json::from_value(call.arguments)
            .map_err(|e| ToolError::InvalidArguments(e.to_string()))?;

        let instance = self.engine.submit_approval(
            args.instance_id,
            args.node_instance_id,
            call.operator_id,
            ApprovalResult::Approve,
            args.comment,
        ).await
        .map_err(|e| ToolError::ExecutionFailed(e.to_string()))?;

        Ok(ToolResult {
            success: true,
            data: serde_json::json!({
                "status": instance.status.to_string(),
                "current_node_id": instance.current_node_id,
                "message": "审批已通过"
            }),
        })
    }

    /// 处理审批拒绝
    async fn handle_reject(&self, call: ToolCall) -> ToolResult {
        let args: RejectApprovalArgs = serde_json::from_value(call.arguments)
            .map_err(|e| ToolError::InvalidArguments(e.to_string()))?;

        let instance = self.engine.submit_approval(
            args.instance_id,
            args.node_instance_id,
            call.operator_id,
            ApprovalResult::Reject,
            Some(args.reason),
        ).await
        .map_err(|e| ToolError::ExecutionFailed(e.to_string()))?;

        Ok(ToolResult {
            success: true,
            data: serde_json::json!({
                "status": instance.status.to_string(),
                "message": "审批已拒绝"
            }),
        })
    }

    /// 处理取消审批
    async fn handle_cancel(&self, call: ToolCall) -> ToolResult {
        let args: CancelApprovalArgs = serde_json::from_value(call.arguments)
            .map_err(|e| ToolError::InvalidArguments(e.to_string()))?;

        let instance = self.engine.submit_approval(
            args.instance_id,
            "".to_string(), // 取消不需要节点实例 ID
            call.operator_id,
            ApprovalResult::Cancel,
            args.reason,
        ).await
        .map_err(|e| ToolError::ExecutionFailed(e.to_string()))?;

        Ok(ToolResult {
            success: true,
            data: serde_json::json!({
                "status": instance.status.to_string(),
                "message": "审批已取消"
            }),
        })
    }

    /// 处理查询待审批列表
    async fn handle_query_pending(&self, call: ToolCall) -> ToolResult {
        let args: QueryPendingArgs = serde_json::from_value(call.arguments)
            .unwrap_or(QueryPendingArgs { limit: 10 });

        // TODO: 实现查询待审批列表
        Ok(ToolResult {
            success: true,
            data: serde_json::json!([]),
        })
    }
}

#[derive(Deserialize)]
struct CreateApprovalArgs {
    flow_def_id: String,
    title: String,
    context_data: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct QueryApprovalArgs {
    instance_id: String,
}

#[derive(Deserialize)]
struct ApproveApprovalArgs {
    instance_id: String,
    node_instance_id: String,
    comment: Option<String>,
}

#[derive(Deserialize)]
struct RejectApprovalArgs {
    instance_id: String,
    node_instance_id: String,
    reason: String,
}

#[derive(Deserialize)]
struct CancelApprovalArgs {
    instance_id: String,
    reason: Option<String>,
}

#[derive(Deserialize)]
struct QueryPendingArgs {
    limit: Option<u32>,
}

/// 工具错误
#[derive(Debug, Serialize)]
pub struct ToolError {
    pub code: String,
    pub message: String,
}

impl ToolError {
    pub fn invalid_arguments(msg: String) -> Self {
        Self { code: "INVALID_ARGUMENTS".to_string(), message: msg }
    }

    pub fn not_found(msg: String) -> Self {
        Self { code: "NOT_FOUND".to_string(), message: msg }
    }

    pub fn execution_failed(msg: String) -> Self {
        Self { code: "EXECUTION_FAILED".to_string(), message: msg }
    }

    pub fn unauthorized(msg: String) -> Self {
        Self { code: "UNAUTHORIZED".to_string(), message: msg }
    }
}

impl From<ToolError> for ToolResult {
    fn from(err: ToolError) -> Self {
        ToolResult {
            success: false,
            data: serde_json::json!({
                "error": err
            }),
        }
    }
}
```

## 模块结构

### 后端模块结构

```
src-tauri/src/agent/
├── tools/
│   ├── mod.rs              # 工具模块入口
│   ├── approval_tools.rs   # 审批工具实现 (新增)
│   └── registry.rs        # 工具注册表
├── mod.rs
```

### 前端模块结构

```
src/features/
├── approval/
│   ├── tools/
│   │   └── approvalTools.ts    # 审批工具定义 (新增)
│   └── index.ts
└── agent/
    ├── components/
    │   └── ApprovalPilotIntegration.tsx  # (已存在，需扩展)
    └── tools/
        ├── toolRegistry.ts    # (已存在，需扩展)
        └── adapters/
            └── approvalAdapter.ts  # Agent 工具适配器 (新增)
```

## Agent 集成方案

### 意图识别配置

```typescript
// src/features/agent/tools/intent/approvalIntents.ts

export const approvalIntentPatterns = [
  {
    intent: 'create_approval',
    patterns: [
      /申请(.*)审批/,
      /需要(.*)的审批/,
      /提交(.*)审批/,
      /我想申请(.*)/,
      /帮我审批(.*)/,
    ],
    requiredEntities: ['flow_def_id', 'title'],
    autoFillEntities: ['context_data'],
  },
  {
    intent: 'query_approval',
    patterns: [
      /查询(.*)审批状态/,
      /(.*)审批进行到(.*)了/,
      /我的(.*)审批(.*)/,
      /(.*)审批结果/,
    ],
    requiredEntities: ['instance_id'],
    autoFillEntities: [],
  },
  {
    intent: 'approve',
    patterns: [
      /同意(.*)/,
      /通过(.*)审批/,
      /审批通过/,
      /批准(.*)/,
    ],
    requiredEntities: ['instance_id', 'node_instance_id'],
    autoFillEntities: ['comment'],
  },
  {
    intent: 'reject',
    patterns: [
      /拒绝(.*)审批/,
      /不同意(.*)/,
      /驳回(.*)/,
    ],
    requiredEntities: ['instance_id', 'node_instance_id', 'reason'],
    autoFillEntities: [],
  },
];
```

### 审批状态自然语言生成

```typescript
// src/features/approval/utils/statusMessage.ts

export function generateStatusMessage(instance: ApprovalInstance): string {
  switch (instance.status) {
    case 'pending':
      return `您的审批请求"${instance.title}"已提交，等待审批中。`;
    case 'in_progress':
      return `您的审批请求"${instance.title}"正在审批中，当前环节：${instance.current_node_name || '审批中'}。`;
    case 'approved':
      return `您的审批请求"${instance.title}"已审批通过！`;
    case 'rejected':
      return `您的审批请求"${instance.title}"已被拒绝，请查看拒绝原因。`;
    case 'cancelled':
      return `您的审批请求"${instance.title}"已取消。`;
    default:
      return `审批请求"${instance.title}"状态未知。`;
  }
}

export function generatePendingMessage(instances: ApprovalInstance[]): string {
  if (instances.length === 0) {
    return '您没有待审批的请求。';
  }

  const titles = instances.map(i => `"${i.title}"`).join('、');
  if (instances.length === 1) {
    return `您有 1 个待审批请求：${titles}。`;
  }

  return `您有 ${instances.length} 个待审批请求：${titles}。`;
}
```

## 状态管理

### 审批状态集成到 Agent Store

```typescript
// src/features/agent/stores/agentStore.ts (扩展)

interface AgentState {
  // ... 现有状态
  approvalContext: {
    pendingApprovals: ApprovalInstance[];
    recentApprovals: ApprovalInstance[];
    lastUpdated: string | null;
  };
}

// 审批上下文更新
function updateApprovalContext(instances: ApprovalInstance[]) {
  const now = new Date().toISOString();
  const pending = instances.filter(i => i.status === 'pending' || i.status === 'in_progress');
  const recent = instances.slice(0, 5);

  set((state) => ({
    agent: {
      ...state.agent,
      approvalContext: {
        pendingApprovals: pending,
        recentApprovals: recent,
        lastUpdated: now,
      },
    },
  }));
}
```

## 安全考虑

1. **权限校验**: 工具调用前验证用户是否有审批权限
2. **参数验证**: 严格验证工具参数格式和范围
3. **审计日志**: 记录所有工具调用操作
4. **敏感数据**: 审批内容中的敏感信息需要脱敏
5. **防误操作**: 审批拒绝等操作需要确认
