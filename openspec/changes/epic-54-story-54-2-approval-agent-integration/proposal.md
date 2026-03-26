# Proposal: 审批中心 - Agent集成

## 变更类型
- [x] **refactor** - 基于现有代码重构扩展

> **implementationType**: `refactor`
> 本功能为重构扩展，需要在 Story 54.1 的基础上，集成 ApprovalPilotIntegration 组件与 Agent Runtime，实现审批工具集和自动审批场景识别。

## 背景

### 业务背景
审批中心与 Agent Runtime 的深度集成是实现智能审批的关键。当前的 AI-Automated-office 系统需要：
- Agent 能够自动识别需要审批的业务场景（如报价单提交、合同签署等）
- Agent 能够自动创建审批请求
- Agent 能够查询审批状态并向用户反馈
- Agent 能够处理审批结果并执行业务操作

### 技术背景
根据 PRD 文档（FR503-FR505）和架构设计（ADR-025、ADR-037），Agent 集成需要：
- 基于 Story 54.1 的审批流程引擎
- 创建审批相关的工具集（create_approval、query_approval、approve、reject）
- 与前端 ApprovalPilotIntegration 组件集成

### 现有代码状态
- **前端**: `src/features/agent/components/ApprovalPilotIntegration.tsx` 组件已有
- **后端**: 需要基于 Story 54.1 的审批引擎创建工具集
- **数据库**: 使用 Story 54.1 定义的表结构

## 目标

### 核心目标
将审批中心与 Agent Runtime 深度集成，实现：
1. 审批工具集的创建与注册
2. Agent 自动识别需要审批的场景
3. 审批创建时的内容自动生成
4. 审批状态的实时集成
5. 审批结果的通知与处理

### 验收标准（来自 task.json）
- [x] 创建审批相关的工具集（create_approval、query_approval、approve、reject）
- [x] 实现 Agent 自动识别需要审批的场景
- [x] 实现审批创建时的内容自动生成
- [x] 集成审批状态到 Agent 对话上下文
- [x] 实现审批结果的通知与处理

## 范围

### 包含
1. **审批工具集**
   - `approval_create` - 创建审批请求
   - `approval_query` - 查询审批状态
   - `approval_approve` - 审批通过
   - `approval_reject` - 审批拒绝
   - `approval_cancel` - 取消审批

2. **Agent 场景识别**
   - 意图识别：识别用户表达需要审批的意图
   - 参数提取：从对话中提取审批相关参数
   - 上下文理解：理解业务上下文并生成审批内容

3. **内容自动生成**
   - 审批标题自动生成
   - 审批描述自动生成
   - 上下文数据自动填充

4. **状态集成**
   - 审批状态推送到 Agent 对话上下文
   - 状态变更的实时通知
   - 审批进度的自然语言反馈

5. **前端组件扩展**
   - ApprovalPilotIntegration 组件完善

### 不包含
- 审批通知推送（属于后续迭代）
- 审批流程设计器（后续迭代）
- 移动端适配（后续迭代）

## 影响范围

### 前端影响
- **新增文件**:
  - `src/features/approval/tools/approvalTools.ts` - 审批工具集定义
  - `src/features/agent/tools/approvalAgentTools.ts` - Agent 工具适配器

- **修改文件**:
  - `src/features/agent/components/ApprovalPilotIntegration.tsx` - 扩展现有组件
  - `src/features/agent/tools/toolRegistry.ts` - 注册审批工具

### 后端影响
- **新增模块** (`src-tauri/src/agent/tools/`):
  - `approval_tools.rs` - 审批工具实现

- **修改文件**:
  - `src-tauri/src/agent/tools/mod.rs` - 添加 approval_tools 子模块

### 数据库影响
- 无新增表（复用 Story 54.1 的表结构）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Story 54.1 未完成 | **高** | **高** | 本 Story 依赖 Story 54.1 完成；并行开发时定义清晰接口 |
| 意图识别准确率不足 | 中 | 中 | 提供明确的工具描述；支持参数澄清对话 |
| 前端组件接口变化 | 低 | 中 | 定义稳定的组件接口；使用 adapter 模式隔离变化 |
| 审批状态同步延迟 | 中 | 低 | 使用事件驱动异步更新；提供重试机制 |

## 依赖

### 前置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.1 | 审批中心完整实现 - 流程引擎 | 提供审批核心能力 |
| Story 51.1 | 主 Agent 协调器 - 核心协调模块 | 提供 Agent Runtime 框架 |

### 后置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.8 | AI 暂存写回与审阅机制 | 依赖审批结果处理 |

### 依赖关系图
```
Story 51.1 (Agent 协调器)
         ↓
Story 54.1 (审批流程引擎)
         ↓
Story 54.2 (本 Story - Agent 集成)
         ↓
Story 54.8 (暂存写回与审阅)
```

## 实现约束

### 工具命名约定
遵循 `{plugin}_{entity}_{action}` 格式：
- `approval_create`
- `approval_query`
- `approval_approve`
- `approval_reject`
- `approval_cancel`

### 工具描述规范
每个工具必须有：
- 清晰的英文名称和描述
- 完整的参数说明
- 明确的返回值格式
- 错误情况说明

### 安全约束
- 工具调用需要验证调用者权限
- 敏感操作需要二次确认
- 操作需要完整的审计日志

## 附录

### 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR503-FR505)
- 架构: `_bmad-output/planning-artifacts/architecture.md` (ADR-025, ADR-037)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (UX-01, UX-04)
- 前端组件: `src/features/agent/components/ApprovalPilotIntegration.tsx`

### 技术栈
- **后端**: Rust + Tauri
- **前端**: React + TypeScript + Zustand
