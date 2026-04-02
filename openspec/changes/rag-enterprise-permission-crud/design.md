## Context

当前项目的知识库系统位于 `src-tauri/src/knowledge/`，已实现基础框架但缺乏企业级的权限控制和 CRUD 管理能力。

**当前状态**：
- 仅有 `DocumentMetadata` 和 `DocumentChunk` 结构
- 没有知识库（Dataset）的概念
- 没有权限控制机制
- CRUD 操作基本为空实现

**参考实现**：Dify 的知识库系统（`开源库参考项目/dify/api/models/dataset.py`）

Dify 实现了完整的三层权限模型：
1. **数据集权限枚举**：`ONLY_ME` / `ALL_TEAM` / `PARTIAL_TEAM`
2. **成员权限表**：`DatasetPermission` 记录每个用户的显式权限
3. **角色检查**：`Owner` 可绕过权限检查

## Goals / Non-Goals

**Goals:**
- 实现知识库（KnowledgeBase）的完整 CRUD
- 实现三种权限类型（仅我/团队/部分成员）
- 实现文档的完整生命周期管理
- 实现片段的细粒度管理
- 实现成员权限管理
- 实现完整的权限验证流程

**Non-Goals:**
- 不实现多租户数据同步（已有 sync 模块）
- 不实现知识库模板系统
- 不实现知识库评分和推荐
- 不实现外部知识库集成

## Decisions

### Decision 1: 数据模型分层

**选择**：KnowledgeBase → Document → Segment → Chunk 四层结构

**理由**：
- 符合 Dify 的实践经验
- 支持细粒度的权限控制
- 便于批量操作和事务管理
- 清晰的数据归属关系

### Decision 2: 权限模型

**选择**：采用与 Dify 完全一致的权限模型

**理由**：
- 经过生产验证
- 概念清晰，易于理解
- 支持常见的企业组织场景
- 便于后续扩展

### Decision 3: API 设计

**选择**：统一 Tauri Command 风格

**理由**：
- 与现有代码风格一致
- 便于前端集成
- 自动支持跨平台

### Decision 4: 错误处理

**选择**：统一的错误类型和错误码

**理由**：
- 便于前端统一处理
- 支持国际化错误消息
- 便于日志记录和监控

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| 权限检查性能 | 每次 API 调用都检查权限 | 缓存用户权限，定期刷新 |
| 级联删除复杂性 | 删除知识库需要清理大量数据 | 使用数据库事务，确保原子性 |
| 权限升级漏洞 | 潜在的安全风险 | 严格测试权限边界 |

## Migration Plan

**Phase 1: 权限模型**
1. 定义 Rust 类型（KnowledgePermission, KnowledgeBase 等）
2. 创建数据库表
3. 实现权限验证服务
4. 添加权限相关的 Tauri Commands

**Phase 2: 知识库 CRUD**
1. 实现 `knowledge_base_*` Commands
2. 实现成员管理 Commands
3. 添加前端知识库管理界面

**Phase 3: 文档 CRUD**
1. 实现 `knowledge_document_*` Commands
2. 添加前端文档管理界面
3. 实现批量操作

**Phase 4: 片段管理**
1. 实现 `knowledge_segment_*` Commands
2. 添加片段编辑界面
3. 实现重新嵌入功能

## Open Questions

1. **是否需要实现草稿状态？**
   - 建议：不实现，简化 MVP
   - 文档直接创建和索引

2. **是否需要实现版本控制？**
   - 建议：不实现，作为 Phase 2
   - 当前 MVP 只需支持覆盖

3. **审计日志保留多久？**
   - 建议：默认 90 天
   - 可配置保留周期
