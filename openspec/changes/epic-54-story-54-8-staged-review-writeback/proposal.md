# Proposal: AI暂存写回与审阅机制

## 变更类型
- [x] 重构 (refactor)

## 背景

Agent在执行任务时可能会生成需要写入业务模块的数据（如创建报价单、编辑客户信息、生成合同等）。为了确保数据安全和用户可控，需要实现"暂存-审阅-确认-写回"的机制：
1. Agent生成的数据先暂存，不直接写入业务数据库
2. 用户可以在专门的审阅界面查看AI生成的内容
3. 用户可以编辑、修改或拒绝AI生成的内容
4. 用户确认后，数据才会正式写入业务模块
5. 整个过程需要完整的审计日志

当前前端已有StagedReviewPanel组件，本Story需要实现完整的后端暂存管理、审阅流程和正式写回功能。

## 目标

实现AI暂存写回与审阅机制，满足以下验收标准：
- 创建StagedReviewManager管理暂存内容
- 实现AI生成内容的暂存展示界面
- 实现用户审阅与编辑功能
- 实现确认后的正式写回
- 添加审阅历史的审计记录

## 范围

### 包含
- 创建StagedReviewManager管理暂存内容
- AI生成内容的暂存存储（Redis/SQLite）
- 暂存内容的展示界面（增强StagedReviewPanel）
- 用户审阅与编辑功能（接受/修改/拒绝）
- 确认后的正式写回（写入业务数据库）
- 拒绝后的处理（记录原因，清理暂存）
- 审阅历史的审计日志记录
- 多类型暂存内容支持（报价单、合同、客户信息等）
- 暂存内容的版本管理

### 不包含
- Agent决策逻辑（Story 51.x负责）
- 具体的业务数据写入逻辑（各业务模块Story负责）
- 暂存内容的自动清理策略（可后续扩展）
- 暂存内容的对比功能（如有）

## 影响范围

### 前端
- 修改 `src/features/agent/components/StagedReviewPanel.tsx`
- 创建 `src/features/staged-review/components/StagedContentViewer.tsx` - 暂存内容查看器
- 创建 `src/features/staged-review/components/StagedContentEditor.tsx` - 暂存内容编辑器
- 创建 `src/features/staged-review/components/ReviewHistory.tsx` - 审阅历史
- 创建 `src/features/staged-review/hooks/useStagedReview.ts` - 审阅Hook
- 创建 `src/features/staged-review/hooks/useStagedContent.ts` - 暂存内容Hook
- 创建 `src/features/staged-review/stores/stagedReviewStore.ts` - 状态管理

### 后端
- 创建 `src-tauri/src/agent/staged_review/` 目录
- 创建 `src-tauri/src/agent/staged_review/manager.rs` - 暂存管理器
- 创建 `src-tauri/src/agent/staged_review/storage.rs` - 暂存存储
- 创建 `src-tauri/src/agent/staged_review/commands.rs` - Tauri命令
- 创建 `src-tauri/src/agent/staged_review/audit.rs` - 审计日志
- 修改 `src-tauri/src/agent/commands.rs` 集成暂存审阅功能

### 数据库
- 创建表：staged_contents（暂存内容表）
- 创建表：staged_review_audit_logs（审阅审计日志表）
- 创建表：staged_content_versions（版本表）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 依赖的业务模块API未就绪 | 高 | 高 | 使用Mock适配器隔离测试 |
| 暂存内容与业务模型不匹配 | 中 | 高 | 定义清晰的暂存内容Schema |
| 并发审阅冲突 | 低 | 中 | 使用乐观锁处理 |
| 暂存数据过期未清理 | 低 | 低 | 实现TTL自动清理 |

## 依赖

### 前置依赖
- **Story 54.2**: 审批中心 - Agent集成（必需）
- **Story 54.4**: 销售模块 - 动态表单与数据绑定（必需）
- **Story 54.7**: 财务模块 - 发票OCR与台账生成（必需）

### 后置依赖
- **Epic 55**: 审计日志系统（直接依赖本Story）
- **Epic 55**: 错误恢复与故障转移（可选依赖）

## 实现步骤

1. 创建StagedReviewManager管理暂存内容
2. 实现AI生成内容的暂存展示界面
3. 实现用户审阅与编辑功能
4. 实现确认后的正式写回
5. 添加审阅历史的审计记录

## 技术约束

- 遵循ADR-037关于Agent Runtime集成的规范
- 遵循NFR1和NFR16的性能要求
- 遵循UX-01/UX-04/UX-05的设计规范
- 暂存内容必须支持多种数据类型
- 每次写回必须记录完整的审计日志
