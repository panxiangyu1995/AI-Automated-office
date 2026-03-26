# Design: 审批中心完整实现 - 流程引擎

## 技术方案

### 实现类型
- **implementationType**: `new`
- **优先级**: `high`
- **阶段**: Phase 4 - 业务模块动态化
- **Epic**: Epic 54 (业务模块动态化)
- **Story**: Story 54.1

### 技术栈选择
- **后端**: Rust + Tauri + SQLite
- **前端**: React + TypeScript + Zustand
- **状态管理**: Zustand Store
- **工具**: Tauri IPC 命令

## API 设计

### Tauri 命令接口

```rust
// src-tauri/src/approval/commands.rs

use serde::{Deserialize, Serialize};

/// 审批流程定义
#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalFlowDef {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub flow_config: FlowConfig,
    pub created_at: String,
    pub updated_at: String,
}

/// 流程配置
#[derive(Debug, Serialize, Deserialize)]
pub struct FlowConfig {
    pub nodes: Vec<NodeDef>,
    pub edges: Vec<EdgeDef>,
}

/// 节点定义
#[derive(Debug, Serialize, Deserialize)]
pub struct NodeDef {
    pub id: String,
    pub name: String,
    pub node_type: NodeType, // start/end/task/condition
    pub approvers: Vec<String>, // 用户ID列表
    pub approval_type: ApprovalType, // serial/parallel
}

/// 边定义
#[derive(Debug, Serialize, Deserialize)]
pub struct EdgeDef {
    pub from: String,
    pub to: String,
    pub condition: Option<String>,
}

/// 审批实例
#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalInstance {
    pub id: String,
    pub flow_def_id: String,
    pub title: String,
    pub applicant_id: String,
    pub status: ApprovalStatus,
    pub current_node_id: Option<String>,
    pub context_data: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// 审批状态
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ApprovalStatus {
    Pending,      // 待审批
    InProgress,   // 审批中
    Approved,     // 已通过
    Rejected,     // 已拒绝
    Cancelled,    // 已取消
}

/// 审批类型
#[derive(Debug, Serialize, Deserialize)]
pub enum ApprovalType {
    Serial,   // 串行审批
    Parallel, // 并行审批（会签/或签）
}

/// 节点类型
#[derive(Debug, Serialize, Deserialize)]
pub enum NodeType {
    Start,
    End,
    Task,
    Condition,
}

/// 创建审批流程定义
#[tauri::command]
pub async fn create_approval_flow(
    name: String,
    description: Option<String>,
    flow_config: FlowConfig,
) -> Result<ApprovalFlowDef, String> {
    // 实现逻辑
}

/// 获取审批流程定义
#[tauri::command]
pub async fn get_approval_flow(flow_def_id: String) -> Result<ApprovalFlowDef, String> {
    // 实现逻辑
}

/// 列出所有审批流程定义
#[tauri::command]
pub async fn list_approval_flows() -> Result<Vec<ApprovalFlowDef>, String> {
    // 实现逻辑
}

/// 创建审批实例（启动审批流程）
#[tauri::command]
pub async fn create_approval_instance(
    flow_def_id: String,
    title: String,
    applicant_id: String,
    context_data: Option<String>,
) -> Result<ApprovalInstance, String> {
    // 实现逻辑
}

/// 获取审批实例
#[tauri::command]
pub async fn get_approval_instance(instance_id: String) -> Result<ApprovalInstance, String> {
    // 实现逻辑
}

/// 提交审批（下一步）
#[tauri::command]
pub async fn submit_approval(
    instance_id: String,
    node_instance_id: String,
    approver_id: String,
    result: ApprovalResult,
    comment: Option<String>,
) -> Result<ApprovalInstance, String> {
    // 实现逻辑
}

/// 审批操作
#[derive(Debug, Serialize, Deserialize)]
pub enum ApprovalResult {
    Approve,
    Reject,
    Cancel,
}

/// 获取审批历史
#[tauri::command]
pub async fn get_approval_history(instance_id: String) -> Result<Vec<ApprovalHistory>, String> {
    // 实现逻辑
}

/// 审批历史记录
#[derive(Debug, Serialize, Deserialize)]
pub struct ApprovalHistory {
    pub id: String,
    pub instance_id: String,
    pub action: String,
    pub operator_id: String,
    pub from_status: Option<String>,
    pub to_status: Option<String>,
    pub comment: Option<String>,
    pub created_at: String,
}
```

### 前端 API 接口

```typescript
// src/features/approval/api/approvalApi.ts

import { tauri } from '@/lib/tauri';
import type {
  ApprovalFlowDef,
  ApprovalInstance,
  ApprovalHistory,
  FlowConfig,
} from '../types/approval.types';

export const approvalApi = {
  /**
   * 创建审批流程定义
   */
  async createFlow(
    name: string,
    description: string | null,
    flowConfig: FlowConfig
  ): Promise<ApprovalFlowDef> {
    return await tauri.invoke('create_approval_flow', {
      name,
      description,
      flowConfig,
    });
  },

  /**
   * 获取审批流程定义
   */
  async getFlow(flowDefId: string): Promise<ApprovalFlowDef> {
    return await tauri.invoke('get_approval_flow', {
      flowDefId,
    });
  },

  /**
   * 列出所有审批流程定义
   */
  async listFlows(): Promise<ApprovalFlowDef[]> {
    return await tauri.invoke('list_approval_flows');
  },

  /**
   * 创建审批实例
   */
  async createInstance(
    flowDefId: string,
    title: string,
    applicantId: string,
    contextData?: string
  ): Promise<ApprovalInstance> {
    return await tauri.invoke('create_approval_instance', {
      flowDefId,
      title,
      applicantId,
      contextData,
    });
  },

  /**
   * 获取审批实例
   */
  async getInstance(instanceId: string): Promise<ApprovalInstance> {
    return await tauri.invoke('get_approval_instance', {
      instanceId,
    });
  },

  /**
   * 提交审批
   */
  async submitApproval(
    instanceId: string,
    nodeInstanceId: string,
    approverId: string,
    result: 'Approve' | 'Reject' | 'Cancel',
    comment?: string
  ): Promise<ApprovalInstance> {
    return await tauri.invoke('submit_approval', {
      instanceId,
      nodeInstanceId,
      approverId,
      result,
      comment,
    });
  },

  /**
   * 获取审批历史
   */
  async getHistory(instanceId: string): Promise<ApprovalHistory[]> {
    return await tauri.invoke('get_approval_history', {
      instanceId,
    });
  },
};
```

## 模块结构

### 后端模块结构

```
src-tauri/src/
├── agent/
│   └── approval/
│       ├── mod.rs              # 模块入口
│       ├── engine.rs           # ApprovalWorkflowEngine 核心引擎
│       ├── state_machine.rs    # 状态机实现
│       ├── models.rs           # 数据模型定义
│       ├── repository.rs      # 数据访问层
│       ├── commands.rs        # Tauri 命令接口
│       └── error.rs            # 错误定义
```

### 前端模块结构

```
src/features/approval/
├── api/
│   └── approvalApi.ts          # API 调用封装
├── components/
│   └── (UI components in future stories)
├── hooks/
│   └── useApprovalWorkflow.ts  # 审批工作流 Hook
├── stores/
│   └── approvalStore.ts       # Zustand Store
├── types/
│   └── approval.types.ts      # 类型定义
└── index.ts                   # 入口导出
```

## 技术方案

### 1. ApprovalWorkflowEngine 核心引擎

```rust
// engine.rs

use crate::approval::state_machine::{ApprovalStateMachine, Transition};
use crate::approval::models::*;
use crate::approval::repository::ApprovalRepository;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 审批工作流引擎
pub struct ApprovalWorkflowEngine {
    repository: Arc<RwLock<ApprovalRepository>>,
    state_machine: ApprovalStateMachine,
}

impl ApprovalWorkflowEngine {
    /// 创建引擎实例
    pub fn new(repository: ApprovalRepository) -> Self {
        Self {
            repository: Arc::new(RwLock::new(repository)),
            state_machine: ApprovalStateMachine::new(),
        }
    }

    /// 创建审批流程定义
    pub async fn create_flow(
        &self,
        name: String,
        description: Option<String>,
        flow_config: FlowConfig,
    ) -> Result<ApprovalFlowDef, ApprovalError> {
        let now = chrono::Utc::now().to_rfc3339();
        let flow_def = ApprovalFlowDef {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            description,
            flow_config,
            created_at: now.clone(),
            updated_at: now,
        };

        let mut repo = self.repository.write().await;
        repo.insert_flow(flow_def.clone()).await?;
        Ok(flow_def)
    }

    /// 启动审批流程实例
    pub async fn start_instance(
        &self,
        flow_def_id: String,
        title: String,
        applicant_id: String,
        context_data: Option<String>,
    ) -> Result<ApprovalInstance, ApprovalError> {
        // 获取流程定义
        let flow_def = {
            let repo = self.repository.read().await;
            repo.get_flow(&flow_def_id).await?
        };

        // 创建实例
        let now = chrono::Utc::now().to_rfc3339();
        let first_node = flow_def.flow_config.nodes.first()
            .ok_or(ApprovalError::InvalidFlowConfig)?;

        let instance = ApprovalInstance {
            id: uuid::Uuid::new_v4().to_string(),
            flow_def_id,
            title,
            applicant_id,
            status: ApprovalStatus::Pending,
            current_node_id: Some(first_node.id.clone()),
            context_data,
            created_at: now.clone(),
            updated_at: now,
        };

        // 插入实例
        {
            let mut repo = self.repository.write().await;
            repo.insert_instance(instance.clone()).await?;
        }

        // 自动提交到第一个节点
        self.submit_to_next_node(instance, first_node, "system").await
    }

    /// 提交审批（处理当前节点）
    pub async fn submit_approval(
        &self,
        instance_id: String,
        node_instance_id: String,
        approver_id: String,
        result: ApprovalResult,
        comment: Option<String>,
    ) -> Result<ApprovalInstance, ApprovalError> {
        let instance = {
            let repo = self.repository.read().await;
            repo.get_instance(&instance_id).await?
        };

        // 验证状态
        if instance.status != ApprovalStatus::InProgress {
            return Err(ApprovalError::InvalidStateTransition(
                format!("Cannot submit approval in state: {:?}", instance.status)
            ));
        }

        // 记录历史
        let history = ApprovalHistory {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id: instance_id.clone(),
            action: result.to_string(),
            operator_id: approver_id.clone(),
            from_status: Some(instance.status.to_string()),
            to_status: None,
            comment: comment.clone(),
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        {
            let mut repo = self.repository.write().await;
            repo.insert_history(history).await?;
        }

        // 根据结果处理
        match result {
            ApprovalResult::Approve => self.handle_approve(instance, node_instance_id, approver_id).await,
            ApprovalResult::Reject => self.handle_reject(instance, node_instance_id, approver_id).await,
            ApprovalResult::Cancel => self.handle_cancel(instance, node_instance_id, approver_id).await,
        }
    }

    /// 处理审批通过
    async fn handle_approve(
        &self,
        instance: ApprovalInstance,
        node_instance_id: String,
        approver_id: String,
    ) -> Result<ApprovalInstance, ApprovalError> {
        // 获取流程定义
        let flow_def = {
            let repo = self.repository.read().await;
            repo.get_flow(&instance.flow_def_id).await?
        };

        // 查找下一个节点
        let current_node_id = instance.current_node_id.as_ref()
            .ok_or(ApprovalError::InvalidFlowConfig)?;

        let next_node = self.find_next_node(&flow_def.flow_config, current_node_id)?;

        match next_node {
            Some(node) => {
                // 还有下一节点，继续流转
                let mut updated_instance = instance.clone();
                updated_instance.current_node_id = Some(node.id.clone());
                updated_instance.updated_at = chrono::Utc::now().to_rfc3339();

                let mut repo = self.repository.write().await;
                repo.update_instance(&updated_instance).await?;
                Ok(updated_instance)
            }
            None => {
                // 流程结束，审批通过
                let mut updated_instance = instance.clone();
                updated_instance.status = ApprovalStatus::Approved;
                updated_instance.current_node_id = None;
                updated_instance.updated_at = chrono::Utc::now().to_rfc3339();

                let mut repo = self.repository.write().await;
                repo.update_instance(&updated_instance).await?;
                Ok(updated_instance)
            }
        }
    }

    /// 处理审批拒绝
    async fn handle_reject(
        &self,
        instance: ApprovalInstance,
        node_instance_id: String,
        approver_id: String,
    ) -> Result<ApprovalInstance, ApprovalError> {
        let mut updated_instance = instance.clone();
        updated_instance.status = ApprovalStatus::Rejected;
        updated_instance.current_node_id = None;
        updated_instance.updated_at = chrono::Utc::now().to_rfc3339();

        let mut repo = self.repository.write().await;
        repo.update_instance(&updated_instance).await?;
        Ok(updated_instance)
    }

    /// 处理审批取消
    async fn handle_cancel(
        &self,
        instance: ApprovalInstance,
        node_instance_id: String,
        approver_id: String,
    ) -> Result<ApprovalInstance, ApprovalError> {
        let mut updated_instance = instance.clone();
        updated_instance.status = ApprovalStatus::Cancelled;
        updated_instance.current_node_id = None;
        updated_instance.updated_at = chrono::Utc::now().to_rfc3339();

        let mut repo = self.repository.write().await;
        repo.update_instance(&updated_instance).await?;
        Ok(updated_instance)
    }

    /// 查找下一个节点
    fn find_next_node(
        &self,
        config: &FlowConfig,
        current_node_id: &str,
    ) -> Result<Option<NodeDef>, ApprovalError> {
        // 简化实现：查找第一条出边
        for edge in &config.edges {
            if edge.from == current_node_id {
                return Ok(config.nodes.iter().find(|n| n.id == edge.to).cloned());
            }
        }
        Ok(None)
    }

    /// 提交到下一个节点（内部方法）
    async fn submit_to_next_node(
        &self,
        mut instance: ApprovalInstance,
        node: &NodeDef,
        system_operator: &str,
    ) -> Result<ApprovalInstance, ApprovalError> {
        let now = chrono::Utc::now().to_rfc3339();

        // 创建节点实例
        let node_instance = ApprovalNodeInstance {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id: instance.id.clone(),
            node_def_id: node.id.clone(),
            approver_id: node.approvers.first().cloned().unwrap_or_default(),
            status: ApprovalStatus::Pending,
            result: None,
            comment: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        // 更新实例状态
        instance.status = ApprovalStatus::InProgress;
        instance.updated_at = now;

        {
            let mut repo = self.repository.write().await;
            repo.insert_node_instance(node_instance).await?;
            repo.update_instance(&instance).await?;
        }

        // 记录历史
        let history = ApprovalHistory {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id: instance.id.clone(),
            action: "submit".to_string(),
            operator_id: system_operator.to_string(),
            from_status: Some(ApprovalStatus::Pending.to_string()),
            to_status: Some(ApprovalStatus::InProgress.to_string()),
            comment: None,
            created_at: now,
        };

        let mut repo = self.repository.write().await;
        repo.insert_history(history).await?;

        Ok(instance)
    }
}
```

### 2. 状态机实现

```rust
// state_machine.rs

use crate::approval::models::ApprovalStatus;

/// 状态转换
#[derive(Debug, Clone)]
pub struct Transition {
    pub from: ApprovalStatus,
    pub to: ApprovalStatus,
    pub action: String,
}

/// 审批状态机
pub struct ApprovalStateMachine {
    transitions: Vec<Transition>,
}

impl ApprovalStateMachine {
    pub fn new() -> Self {
        let transitions = vec![
            // 启动流程
            Transition {
                from: ApprovalStatus::Pending,
                to: ApprovalStatus::InProgress,
                action: "submit".to_string(),
            },
            // 审批通过（流转中）
            Transition {
                from: ApprovalStatus::InProgress,
                to: ApprovalStatus::InProgress,
                action: "approve".to_string(),
            },
            // 审批通过（流程结束）
            Transition {
                from: ApprovalStatus::InProgress,
                to: ApprovalStatus::Approved,
                action: "final_approve".to_string(),
            },
            // 审批拒绝
            Transition {
                from: ApprovalStatus::InProgress,
                to: ApprovalStatus::Rejected,
                action: "reject".to_string(),
            },
            // 取消
            Transition {
                from: ApprovalStatus::Pending,
                to: ApprovalStatus::Cancelled,
                action: "cancel".to_string(),
            },
            Transition {
                from: ApprovalStatus::InProgress,
                to: ApprovalStatus::Cancelled,
                action: "cancel".to_string(),
            },
        ];
        Self { transitions }
    }

    /// 验证状态转换是否合法
    pub fn can_transition(
        &self,
        from: &ApprovalStatus,
        to: &ApprovalStatus,
        action: &str,
    ) -> bool {
        self.transitions.iter().any(|t| {
            t.from == *from && t.to == *to && t.action == action
        })
    }

    /// 获取允许的转换
    pub fn get_allowed_transitions(&self, from: &ApprovalStatus) -> Vec<Transition> {
        self.transitions
            .iter()
            .filter(|t| t.from == *from)
            .cloned()
            .collect()
    }
}
```

### 3. 数据访问层

```rust
// repository.rs

use crate::approval::models::*;
use crate::storage::sqlite::SqlitePool;

pub struct ApprovalRepository {
    pool: SqlitePool,
}

impl ApprovalRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // 流程定义操作
    pub async fn insert_flow(&mut self, flow: ApprovalFlowDef) -> Result<(), ApprovalError> {
        let config_json = serde_json::to_string(&flow.flow_config)
            .map_err(|e| ApprovalError::Serialization(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO approval_flow_def (id, name, description, flow_config, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&flow.id)
        .bind(&flow.name)
        .bind(&flow.description)
        .bind(&config_json)
        .bind(&flow.created_at)
        .bind(&flow.updated_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn get_flow(&self, id: &str) -> Result<ApprovalFlowDef, ApprovalError> {
        let row = sqlx::query_as::<_, (String, String, Option<String>, String, String, String)>(
            "SELECT id, name, description, flow_config, created_at, updated_at FROM approval_flow_def WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&*self.pool)
        .await
        .map_err(|e| ApprovalError::NotFound)?;

        let flow_config: FlowConfig = serde_json::from_str(&row.3)
            .map_err(|e| ApprovalError::Serialization(e.to_string()))?;

        Ok(ApprovalFlowDef {
            id: row.0,
            name: row.1,
            description: row.2,
            flow_config,
            created_at: row.4,
            updated_at: row.5,
        })
    }

    pub async fn list_flows(&self) -> Result<Vec<ApprovalFlowDef>, ApprovalError> {
        let rows = sqlx::query_as::<_, (String, String, Option<String>, String, String, String)>(
            "SELECT id, name, description, flow_config, created_at, updated_at FROM approval_flow_def",
        )
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        let flows = rows
            .into_iter()
            .map(|row| {
                let flow_config: FlowConfig = serde_json::from_str(&row.3).unwrap();
                ApprovalFlowDef {
                    id: row.0,
                    name: row.1,
                    description: row.2,
                    flow_config,
                    created_at: row.4,
                    updated_at: row.5,
                }
            })
            .collect();

        Ok(flows)
    }

    // 实例操作
    pub async fn insert_instance(&mut self, instance: ApprovalInstance) -> Result<(), ApprovalError> {
        sqlx::query(
            r#"
            INSERT INTO approval_instance (id, flow_def_id, title, applicant_id, status, current_node_id, context_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&instance.id)
        .bind(&instance.flow_def_id)
        .bind(&instance.title)
        .bind(&instance.applicant_id)
        .bind(instance.status.to_string())
        .bind(&instance.current_node_id)
        .bind(&instance.context_data)
        .bind(&instance.created_at)
        .bind(&instance.updated_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn get_instance(&self, id: &str) -> Result<ApprovalInstance, ApprovalError> {
        let row = sqlx::query_as::<_, (
            String, String, String, String, String, Option<String>, Option<String>, String, String
        )>(
            "SELECT id, flow_def_id, title, applicant_id, status, current_node_id, context_data, created_at, updated_at FROM approval_instance WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&*self.pool)
        .await
        .map_err(|e| ApprovalError::NotFound)?;

        let status: ApprovalStatus = serde_json::from_str(&row.4)
            .map_err(|e| ApprovalError::Serialization(e.to_string()))?;

        Ok(ApprovalInstance {
            id: row.0,
            flow_def_id: row.1,
            title: row.2,
            applicant_id: row.3,
            status,
            current_node_id: row.5,
            context_data: row.6,
            created_at: row.7,
            updated_at: row.8,
        })
    }

    pub async fn update_instance(&mut self, instance: &ApprovalInstance) -> Result<(), ApprovalError> {
        sqlx::query(
            r#"
            UPDATE approval_instance
            SET status = ?, current_node_id = ?, context_data = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(instance.status.to_string())
        .bind(&instance.current_node_id)
        .bind(&instance.context_data)
        .bind(&instance.updated_at)
        .bind(&instance.id)
        .execute(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        Ok(())
    }

    // 节点实例操作
    pub async fn insert_node_instance(&mut self, node: ApprovalNodeInstance) -> Result<(), ApprovalError> {
        sqlx::query(
            r#"
            INSERT INTO approval_node_instance (id, instance_id, node_def_id, approver_id, status, result, comment, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&node.id)
        .bind(&node.instance_id)
        .bind(&node.node_def_id)
        .bind(&node.approver_id)
        .bind(node.status.to_string())
        .bind(&node.result)
        .bind(&node.comment)
        .bind(&node.created_at)
        .bind(&node.updated_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        Ok(())
    }

    // 历史记录操作
    pub async fn insert_history(&mut self, history: ApprovalHistory) -> Result<(), ApprovalError> {
        sqlx::query(
            r#"
            INSERT INTO approval_history (id, instance_id, action, operator_id, from_status, to_status, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&history.id)
        .bind(&history.instance_id)
        .bind(&history.action)
        .bind(&history.operator_id)
        .bind(&history.from_status)
        .bind(&history.to_status)
        .bind(&history.comment)
        .bind(&history.created_at)
        .execute(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn get_history(&self, instance_id: &str) -> Result<Vec<ApprovalHistory>, ApprovalError> {
        let rows = sqlx::query_as::<_, (
            String, String, String, String, Option<String>, Option<String>, Option<String>, String
        )>(
            "SELECT id, instance_id, action, operator_id, from_status, to_status, comment, created_at FROM approval_history WHERE instance_id = ? ORDER BY created_at ASC",
        )
        .bind(instance_id)
        .fetch_all(&*self.pool)
        .await
        .map_err(|e| ApprovalError::Database(e.to_string()))?;

        let histories = rows
            .into_iter()
            .map(|row| ApprovalHistory {
                id: row.0,
                instance_id: row.1,
                action: row.2,
                operator_id: row.3,
                from_status: row.4,
                to_status: row.5,
                comment: row.6,
                created_at: row.7,
            })
            .collect();

        Ok(histories)
    }
}
```

## 组件设计

### 前端 Zustand Store

```typescript
// stores/approvalStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { approvalApi } from '../api/approvalApi';
import type {
  ApprovalFlowDef,
  ApprovalInstance,
  ApprovalHistory,
  FlowConfig,
} from '../types/approval.types';

interface ApprovalState {
  // 数据
  flows: ApprovalFlowDef[];
  currentFlow: ApprovalFlowDef | null;
  instances: ApprovalInstance[];
  currentInstance: ApprovalInstance | null;
  histories: Map<string, ApprovalHistory[]>; // instanceId -> histories

  // 状态
  isLoading: boolean;
  error: string | null;

  // 操作
  loadFlows: () => Promise<void>;
  createFlow: (name: string, description: string | null, config: FlowConfig) => Promise<ApprovalFlowDef>;
  loadInstances: (flowDefId?: string) => Promise<void>;
  createInstance: (flowDefId: string, title: string, contextData?: string) => Promise<ApprovalInstance>;
  submitApproval: (
    instanceId: string,
    nodeInstanceId: string,
    result: 'Approve' | 'Reject' | 'Cancel',
    comment?: string
  ) => Promise<void>;
  loadHistory: (instanceId: string) => Promise<void>;
}

export const useApprovalStore = create<ApprovalState>()(
  immer((set, get) => ({
    flows: [],
    currentFlow: null,
    instances: [],
    currentInstance: null,
    histories: new Map(),
    isLoading: false,
    error: null,

    loadFlows: async () => {
      set({ isLoading: true, error: null });
      try {
        const flows = await approvalApi.listFlows();
        set({ flows, isLoading: false });
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
      }
    },

    createFlow: async (name, description, config) => {
      set({ isLoading: true, error: null });
      try {
        const flow = await approvalApi.createFlow(name, description, config);
        set((state) => {
          state.flows.push(flow);
          state.isLoading = false;
        });
        return flow;
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
        throw e;
      }
    },

    loadInstances: async (flowDefId) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: 实现带过滤的实例查询
        const instances = await approvalApi.getInstancesByFlow(flowDefId);
        set({ instances, isLoading: false });
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
      }
    },

    createInstance: async (flowDefId, title, contextData) => {
      set({ isLoading: true, error: null });
      try {
        const instance = await approvalApi.createInstance(
          flowDefId,
          title,
          'current-user-id', // TODO: 从认证上下文获取
          contextData
        );
        set((state) => {
          state.instances.push(instance);
          state.currentInstance = instance;
          state.isLoading = false;
        });
        return instance;
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
        throw e;
      }
    },

    submitApproval: async (instanceId, nodeInstanceId, result, comment) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await approvalApi.submitApproval(
          instanceId,
          nodeInstanceId,
          'current-user-id', // TODO: 从认证上下文获取
          result,
          comment
        );
        set((state) => {
          const index = state.instances.findIndex((i) => i.id === instanceId);
          if (index !== -1) {
            state.instances[index] = updated;
          }
          if (state.currentInstance?.id === instanceId) {
            state.currentInstance = updated;
          }
          state.isLoading = false;
        });
        // 刷新历史
        await get().loadHistory(instanceId);
      } catch (e) {
        set({ error: (e as Error).message, isLoading: false });
        throw e;
      }
    },

    loadHistory: async (instanceId) => {
      try {
        const history = await approvalApi.getHistory(instanceId);
        set((state) => {
          state.histories.set(instanceId, history);
        });
      } catch (e) {
        set({ error: (e as Error).message });
      }
    },
  }))
);
```

## 安全考虑

1. **权限校验**: 所有审批操作需验证操作者是否有权限
2. **输入验证**: 使用 serde 进行严格的序列化/反序列化验证
3. **SQL 注入防护**: 使用参数化查询
4. **审计日志**: 所有状态变更记录到 approval_history 表

## 性能考虑

1. **索引优化**: 为常用查询字段创建索引
2. **连接池**: 使用 SQLx 连接池管理数据库连接
3. **异步操作**: 所有数据库操作均为异步
4. **分页查询**: 历史记录支持分页加载
