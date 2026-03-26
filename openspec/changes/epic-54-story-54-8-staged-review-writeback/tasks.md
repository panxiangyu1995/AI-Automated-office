# Tasks: AI暂存写回与审阅机制

## 任务列表

### Task 131: AI暂存写回与审阅机制
- **描述**: 实现Agent生成内容到业务页面的暂存与审阅机制，支持用户确认后正式应用。
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **验收标准**:
  - 创建StagedReviewManager管理暂存内容
  - 实现AI生成内容的暂存展示界面
  - 实现用户审阅与编辑功能
  - 实现确认后的正式写回
  - 添加审阅历史的审计记录

## implementationType
**refactor** - 基于现有前端组件(StagedReviewPanel)和后端基础设施进行重构扩展

## 执行顺序

1. 完成前置依赖（Story 54.2, Story 54.4, Story 54.7）
2. 创建前端类型定义
3. 创建前端状态管理
4. 创建前端组件
5. 创建前端Hooks
6. 创建后端暂存管理器
7. 创建后端存储层
8. 创建后端Tauri命令
9. 创建后端审计日志
10. 集成测试
11. UI优化

## 详细任务

### 任务1: 创建前端类型定义
- [ ] 创建 `src/features/staged-review/types/index.ts`
- [ ] 定义 StagedContent 类型
- [ ] 定义 StagedContentStatus 枚举
- [ ] 定义 ReviewAction 枚举
- [ ] 定义相关请求/响应类型

### 任务2: 创建前端状态管理
- [ ] 创建 `src/features/staged-review/stores/stagedReviewStore.ts`
- [ ] 实现待审阅内容列表状态
- [ ] 实现当前选中内容状态
- [ ] 实现加载状态管理

### 任务3: 创建前端核心组件
- [ ] 创建 `src/features/staged-review/components/StagedContentCard.tsx`
- [ ] 创建 `src/features/staged-review/components/StagedContentViewer.tsx`
- [ ] 创建 `src/features/staged-review/components/StagedContentEditor.tsx`
- [ ] 创建 `src/features/staged-review/components/ReviewHistory.tsx`
- [ ] 创建 `src/features/staged-review/components/ReviewActions.tsx`

### 任务4: 创建增强版StagedReviewPanel
- [ ] 修改 `src/features/agent/components/StagedReviewPanel.tsx`
- [ ] 添加Tabs支持（待审阅/待写回/历史）
- [ ] 集成StagedContentCard组件
- [ ] 添加空状态显示

### 任务5: 创建前端Hooks
- [ ] 创建 `src/features/staged-review/hooks/useStagedContent.ts`
- [ ] 创建 `src/features/staged-review/hooks/useStagedActions.ts`
- [ ] 创建 `src/features/staged-review/hooks/useAuditLogger.ts`
- [ ] 创建 `src/features/staged-review/utils/contentRenderer.ts`

### 任务6: 创建后端暂存管理器
- [ ] 创建 `src-tauri/src/agent/staged_review/mod.rs`
- [ ] 创建 `src-tauri/src/agent/staged_review/manager.rs`
- [ ] 实现create_staged_content函数
- [ ] 实现approve/reject/modify函数
- [ ] 实现write_back函数

### 任务7: 创建后端存储层
- [ ] 创建 `src-tauri/src/agent/staged_review/storage.rs`
- [ ] 定义StagedStorage trait
- [ ] 实现SQLiteStorage
- [ ] 实现get/save/update/get_all方法

### 任务8: 创建后端Tauri命令
- [ ] 创建 `src-tauri/src/agent/staged_review/commands.rs`
- [ ] 实现create_staged_content命令
- [ ] 实现get_pending_contents命令
- [ ] 实现approve_staged_content命令
- [ ] 实现reject_staged_content命令
- [ ] 实现modify_staged_content命令
- [ ] 实现write_back_staged_content命令
- [ ] 实现get_review_history命令
- [ ] 修改 `src-tauri/src/agent/mod.rs` 集成暂存审阅模块

### 任务9: 创建后端审计日志
- [ ] 创建 `src-tauri/src/agent/staged_review/audit.rs`
- [ ] 定义AuditLogger trait
- [ ] 实现log_create/log_review/log_write_back函数
- [ ] 实现get_review_history函数

### 任务10: 创建写回处理器
- [ ] 创建 `src-tauri/src/agent/staged_review/write_back.rs`
- [ ] 定义WriteBackHandler trait
- [ ] 实现QuotationWriteBackHandler
- [ ] 实现ContractWriteBackHandler
- [ ] 实现CustomerWriteBackHandler

### 任务11: 数据库迁移
- [ ] 创建staged_contents表
- [ ] 创建staged_review_audit_logs表
- [ ] 创建staged_content_versions表
- [ ] 创建必要索引

### 任务12: 集成测试
- [ ] 编写暂存管理器单元测试
- [ ] 编写存储层测试
- [ ] 编写前后端集成测试
- [ ] 编写写回处理器测试

### 任务13: UI优化
- [ ] 添加加载状态指示器
- [ ] 添加错误提示组件
- [ ] 优化卡片布局

## 验收标准详细说明

### 验收标准1: 创建StagedReviewManager管理暂存内容
- [ ] StagedReviewManager可以创建新的暂存内容
- [ ] 可以获取待审阅内容列表
- [ ] 可以获取特定会话的暂存内容
- [ ] 暂存内容有24小时过期时间
- [ ] 支持多类型暂存内容（报价单、合同、客户等）

### 验收标准2: 实现AI生成内容的暂存展示界面
- [ ] StagedReviewPanel显示所有待审阅内容
- [ ] 每条暂存内容显示标题、摘要、来源、置信度
- [ ] 支持分页显示
- [ ] 支持按状态/类型筛选
- [ ] 支持按会话筛选

### 验收标准3: 实现用户审阅与编辑功能
- [ ] 用户可以批准暂存内容
- [ ] 用户可以拒绝暂存内容（需填写原因）
- [ ] 用户可以修改暂存内容
- [ ] 修改后的内容保存为modified_data
- [ ] 支持批量批准/拒绝

### 验收标准4: 实现确认后的正式写回
- [ ] 只有approved状态的内容可以写回
- [ ] 写回时调用对应业务模块的API
- [ ] 写回成功后将状态更新为written_back
- [ ] 写回失败时返回错误，不更新状态
- [ ] 写回结果记录到审计日志

### 验收标准5: 添加审阅历史的审计记录
- [ ] 记录创建、批准、拒绝、修改、写回操作
- [ ] 记录操作人、操作时间、操作原因
- [ ] 支持查询特定内容的审计历史
- [ ] 审计日志不可删除

## 测试要点

### 单元测试
- [ ] StagedReviewManager状态转换测试
- [ ] 暂存内容验证测试
- [ ] 审计日志记录测试

### 集成测试
- [ ] 前端组件与后端命令集成测试
- [ ] 写回处理器与业务模块集成测试
- [ ] 完整流程测试（创建→审阅→写回）

### 浏览器测试
- [ ] StagedReviewPanel渲染测试
- [ ] 批准/拒绝操作测试
- [ ] 编辑器功能测试

## 技术约束

- 遵循ADR-037 Agent Runtime集成规范
- 遵循NFR1/NFR16性能要求
- 遵循UX-01/UX-04/UX-05设计规范
- 暂存内容必须支持多种数据类型
- 每次状态变更必须记录审计日志

## 依赖项

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| Story 54.2 | 前置必需 | 审批中心Agent集成 |
| Story 54.4 | 前置必需 | 销售动态表单 |
| Story 54.7 | 前置必需 | 财务OCR与台账 |
| Story 55.1 | 后置依赖 | 完整审计日志系统 |
| Story 101 | 前置必需 | Rust后端基础设施 |
