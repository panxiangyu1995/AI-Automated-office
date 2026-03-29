## Why

Layer 1 核心工具提供了基础自动化能力，但企业场景需要跨系统、跨部门的高层次能力集成。Layer 2 企业工具在核心工具之上提供资源管理、知识库访问、消息系统和数据库查询等企业级能力，是 Agent 打通业务数据的核心通道。

## What Changes

实现铁律文档定义的 Layer 2 企业平台增强工具，共 5 组 11 个工具：

**Resource 工具组 (2个)**
- `resource_query`: 查询云端/工作区资源
- `resource_upload`: 上传资料到受控资源空间

**Knowledge 工具组 (2个)**
- `knowledge_query`: 企业知识库检索
- `knowledge_submit_draft`: 提交知识条目草稿

**Messaging 工具组 (3个)**
- `message_query`: 查询消息上下文
- `message_send`: 发送用户/Agent 消息
- `agent_delegate`: 委派任务给协作 Agent/Sub-Agent

**Workspace 工具组 (1个)**
- `workspace_stage_change`: 暂存候选改动到页面/编辑器

**Database 工具组 (1个 - 受限)**
- `db_query`: 数据库查询（仅管理员/受控调试可用，需要特殊权限）

## Capabilities

### New Capabilities

- `enterprise-tools-resource`: 云端资源查询和上传工具，打通 Agent 与企业存储
- `enterprise-tools-knowledge`: 知识库 RAG 检索和提交工具，支持草稿管理和审核流程
- `enterprise-tools-messaging`: 统一消息系统工具，支持 Agent 间通信和任务委派
- `enterprise-tools-workspace`: 工作区暂存工具，用于变更候选和编辑器集成
- `enterprise-tools-database`: 数据库查询工具（受限），用于跨插件数据关联和系统配置查询

### Modified Capabilities

- 无（Layer 2 是新增能力，不修改现有规格）

## Impact

**后端 (Rust/Tauri)**
- 新增 `src-tauri/src/agent/tools/enterprise/` 目录
- 实现 resource、knowledge、messaging、workspace、database 工具模块
- 集成现有存储、消息和知识库服务

**前端**
- 无直接变更

**权限**
- `db_query` 标记为受限工具，仅管理员角色可用
- 其他企业工具需要相应业务模块权限

**依赖**
- 现有存储服务（SQLite/云端同步）
- 现有消息系统
- 现有知识库 RAG 系统
