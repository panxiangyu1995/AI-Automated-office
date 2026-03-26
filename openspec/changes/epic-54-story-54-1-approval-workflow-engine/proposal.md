# Proposal: 审批中心完整实现 - 流程引擎

## 变更类型
- [x] **new** - 全新功能开发

> **implementationType**: `new`
> 本功能为全新开发，需要从零创建 ApprovalWorkflowEngine 核心类、审批流程数据模型、状态机流转逻辑和历史记录管理。

## 背景

### 业务背景
审批中心是企业ERP系统的核心模块之一，承担着跨部门业务审批的重要职责。当前的 AI-Automated-office 系统需要一套完整的审批流程引擎，支持：
- 多种审批流程模板定义
- 审批状态的自动流转（待审批 → 审批中 → 已通过/已拒绝）
- 审批历史记录的完整追溯
- 与 Agent Runtime 的深度集成，实现智能审批

### 技术背景
根据 PRD 文档（FR500-FR502）和架构设计（ADR-025、ADR-037），审批中心需要基于分层微内核架构实现：
- **Presentation Layer**: 审批 UI 组件（Activity Bar → Sidebar → Workbench）
- **Agent Core Layer**: 审批流程引擎、状态机管理
- **Data Layer**: 审批数据存储（SQLite + 增量同步）

### 现有代码状态
- **前端**: 无现有代码（需要全新创建）
- **后端**: 无现有代码（需要全新创建）
- **数据库**: 无现有表结构（需要创建审批相关表）

## 目标

### 核心目标
创建企业级审批流程引擎，实现：
1. 审批流程的可配置化定义
2. 审批状态的自动流转控制
3. 审批节点的串行/并行处理
4. 审批历史的完整记录与追溯
5. 为 Agent 集成提供基础能力

### 验收标准（来自 task.json）
- [x] 创建 ApprovalWorkflowEngine 核心类
- [x] 实现审批流程的定义与存储
- [x] 实现审批状态的流转逻辑（待审批 → 审批中 → 已通过/已拒绝）
- [x] 添加审批节点的处理逻辑
- [x] 实现审批历史记录管理

## 范围

### 包含
1. **ApprovalWorkflowEngine 核心类**
   - 流程定义加载与解析
   - 状态机驱动引擎
   - 节点处理器注册表

2. **审批数据模型**
   - 审批流程定义表（approval_flow_def）
   - 审批实例表（approval_instance）
   - 审批节点表（approval_node）
   - 审批历史表（approval_history）

3. **状态流转逻辑**
   - 待审批（pending）→ 审批中（in_progress）
   - 审批中 → 已通过（approved）
   - 审批中 → 已拒绝（rejected）
   - 审批中 → 已取消（cancelled）

4. **节点处理逻辑**
   - 串行审批节点处理
   - 并行审批节点处理（会签/或签）
   - 条件分支节点

5. **历史记录管理**
   - 审批操作记录
   - 状态变更记录
   - 备注/意见记录

### 不包含
- Agent 集成功能（属于 Story 54.2）
- 前端 UI 界面实现（属于其他 Story）
- 审批通知功能（后续迭代）
- 审批流程设计器 UI（后续迭代）

## 影响范围

### 前端影响
- **新增文件**:
  - `src/features/approval/types/approval.types.ts` - 审批类型定义
  - `src/features/approval/hooks/useApprovalWorkflow.ts` - 审批工作流 Hook
  - `src/features/approval/stores/approvalStore.ts` - 审批状态管理

- **修改文件**:
  - 暂无（UI 层后续 Story 实现）

- **影响组件**: 暂无（UI 层后续 Story 实现）

### 后端影响
- **新增模块** (`src-tauri/src/approval/`):
  - `mod.rs` - 模块入口
  - `engine.rs` - ApprovalWorkflowEngine 核心引擎
  - `state_machine.rs` - 状态机实现
  - `models.rs` - 数据模型
  - `commands.rs` - Tauri 命令接口

- **修改文件**:
  - `src-tauri/src/agent/mod.rs` - 添加 approval 子模块
  - `src-tauri/Cargo.toml` - 添加 serde, tokio 依赖

### 数据库影响
- **新建表**:
  ```sql
  -- 审批流程定义表
  CREATE TABLE approval_flow_def (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    flow_config TEXT NOT NULL, -- JSON 格式流程配置
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 审批实例表
  CREATE TABLE approval_instance (
    id TEXT PRIMARY KEY,
    flow_def_id TEXT NOT NULL,
    title TEXT NOT NULL,
    applicant_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_node_id TEXT,
    context_data TEXT, -- JSON 格式业务上下文
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (flow_def_id) REFERENCES approval_flow_def(id)
  );

  -- 审批节点实例表
  CREATE TABLE approval_node_instance (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    node_def_id TEXT NOT NULL,
    approver_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    comment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES approval_instance(id)
  );

  -- 审批历史表
  CREATE TABLE approval_history (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    action TEXT NOT NULL, -- create/submit/approve/reject/cancel
    operator_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    comment TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES approval_instance(id)
  );
  ```

- **索引**:
  ```sql
  CREATE INDEX idx_instance_status ON approval_instance(status);
  CREATE INDEX idx_instance_applicant ON approval_instance(applicant_id);
  CREATE INDEX idx_history_instance ON approval_history(instance_id);
  ```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | **高** | **高** | Task 101 (Pre-Task) 提供基础架构；本 Story 依赖 Task 101 完成 |
| 数据库表结构设计不合理 | 中 | 高 | 参照 ADR-025 规范设计；预留扩展字段 |
| 状态流转逻辑复杂 | 高 | 中 | 状态机模式清晰分离状态与转换逻辑 |
| 并行审批节点处理逻辑复杂 | 中 | 中 | 先实现串行，再扩展并行；设计可扩展的节点处理器 |
| 前端 UI 依赖未明确 | 低 | 中 | 本 Story 专注后端核心，前端集成在后续 Story |

## 依赖

### 前置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 39.1 | 基础数据模型定义 | 提供数据模型基础规范 |
| Story 39.2 | 基础权限系统 | 提供权限检查基础 |
| Story 42.1 | 基础状态管理框架 | 提供状态管理模式 |
| Task 101 | 后端 Rust Agent 基础架构 | 提供 src-tauri/src/agent/ 基础结构 |

### 后置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.2 | 审批中心 - Agent 集成 | 依赖本 Story 的工具集 |
| Story 54.8 | AI 暂存写回与审阅机制 | 依赖审批结果处理 |

### 依赖关系图
```
Task 101 (Pre-Task)
    ↓
Story 39.1, 39.2, 42.1
    ↓
Story 54.1 (本 Story)
    ↓
Story 54.2 → Story 54.8
```

## 实现约束

### 命名约定
- 遵循 `{plugin}_{entity}_{action}` 格式
- 示例: `approval_flow_create`, `approval_instance_submit`

### 安全约束
- 所有审批操作需要权限校验
- 敏感操作需要审计日志
- 遵循 ADR-018 安全设计规范

### 性能约束
- 审批实例查询响应时间 < 200ms
- 状态流转处理时间 < 100ms
- 历史记录查询支持分页

## 附录

### 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR500-FR502)
- 架构: `_bmad-output/planning-artifacts/architecture.md` (ADR-025, ADR-037)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (UX-01, UX-04)

### 技术栈
- **后端**: Rust + Tauri + SQLite + tokio
- **前端**: React + TypeScript + Zustand + Shadcn/ui
