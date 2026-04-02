## Why

当前项目的知识库系统缺乏企业级的权限控制和 CRUD 管理能力：
1. **权限模型缺失**：没有实现 Dify 那样的数据集权限控制（仅我/团队/部分成员）
2. **CRUD 不完整**：知识库创建后无法更新配置、无法管理成员、无法批量操作文档
3. **数据隔离不完善**：仅依赖 tenant_id，缺乏细粒度的访问控制
4. **审计追踪缺失**：没有创建人、修改人、操作日志等审计字段

参考 Dify 的企业级知识库实现，需要构建完整的权限和 CRUD 体系。

## What Changes

**Phase 1: 权限模型**
- 定义知识库权限枚举（OnlyMe/AllTeam/PartialTeam）
- 实现知识库成员权限表（KnowledgePermissionRecord）
- 实现权限验证服务（检查租户隔离、角色、显式权限）
- Owner 角色绕过检查

**Phase 2: 知识库 CRUD**
- `knowledge_base_create`: 创建知识库（名称唯一性检查、权限设置）
- `knowledge_base_list`: 分页查询（支持搜索、标签过滤、权限过滤）
- `knowledge_base_get`: 获取知识库详情
- `knowledge_base_update`: 更新知识库配置
- `knowledge_base_delete`: 删除知识库（级联删除文档、片段、权限、向量索引）

**Phase 3: 文档 CRUD**
- `knowledge_document_upload`: 上传文档到知识库
- `knowledge_document_list`: 分页查询文档（支持状态过滤）
- `knowledge_document_update`: 更新文档（标签、自定义元数据）
- `knowledge_document_delete`: 删除文档
- `knowledge_document_batch_update_status`: 批量更新状态

**Phase 4: 片段管理**
- `knowledge_segment_list`: 分页查询片段
- `knowledge_segment_update`: 更新片段内容（触发重新嵌入）
- `knowledge_segment_delete`: 删除片段

**Phase 5: 成员管理**
- `knowledge_member_list`: 获取知识库成员列表
- `knowledge_member_add`: 添加成员
- `knowledge_member_remove`: 移除成员
- `knowledge_member_update`: 更新成员权限

## Capabilities

### New Capabilities

- `rag-permission-model`: 知识库权限模型，支持 OnlyMe/AllTeam/PartialTeam 三种权限类型
- `rag-permission-service`: 权限验证服务，完整的租户隔离和角色检查
- `rag-knowledgebase-crud`: 知识库 CRUD 操作，含创建、查询、更新、删除
- `rag-document-crud`: 文档 CRUD 操作，含上传、分页、批量管理
- `rag-segment-management`: 片段管理，支持片段的更新和删除
- `rag-member-management`: 成员管理，支持成员的添加、移除和权限更新

### Modified Capabilities

- `knowledge-retrieval`: 扩展检索 API，支持多知识库并发检索和权限过滤

## Impact

**后端 (Rust/Tauri)**
- 新增 `src-tauri/src/knowledge/types.rs` - 扩展权限相关类型
- 新增 `src-tauri/src/knowledge/permission.rs` - 权限服务
- 新增 `src-tauri/src/knowledge/commands/` - 所有 CRUD Commands
- 修改 `src-tauri/src/knowledge/mod.rs` - 导出新模块

**前端**
- 新增 `src/features/knowledge/components/KnowledgeBaseManager.tsx` - 知识库管理界面
- 新增 `src/features/knowledge/components/DocumentManager.tsx` - 文档管理界面
- 新增 `src/features/knowledge/components/MemberManager.tsx` - 成员管理界面
- 新增 `src/features/knowledge/hooks/useKnowledgeBase.ts` - 知识库操作 Hook
- 新增 `src/features/knowledge/hooks/useDocument.ts` - 文档操作 Hook

**数据库**
- 新增 `knowledge_bases` 表（知识库主表）
- 新增 `knowledge_documents` 表（文档表）
- 新增 `knowledge_segments` 表（片段表）
- 新增 `knowledge_permissions` 表（成员权限表）
- 新增 `knowledge_audit_logs` 表（审计日志表）

**API 设计**
- 所有 Command 统一错误处理
- 权限检查前置，错误码统一
- 分页响应格式标准化
