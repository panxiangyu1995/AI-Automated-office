# ai-office - API 契约

> 前后端接口定义。字段名和类型的真理源头。
> 维护者：devs（添加/变更端点时**必须**更新）
>
> **Contract-First 规则**：当同一接口的前后端由不同 agent 实现时，每个端点的字段表
> **必须**在这里先定义好，**再**让任何一方动手写代码。双方从这里抄字段名——禁止
> 本地发明。

## Tauri IPC Commands

### DataSyncEngine (C1 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `sync_entity` | `entity_type: SyncEntityType, entity_id: String` | `DataSyncResult` | 同步单个业务实体 |
| `sync_all_pending` | — | `Vec<DataSyncResult>` | 同步所有待处理实体 |
| `detect_conflicts` | `entity_type: SyncEntityType` | `Vec<SyncConflict>` | 检测指定类型的冲突 |
| `resolve_conflict` | `conflict_id: String, strategy: ConflictResolutionStrategy` | `DataSyncResult` | 按策略解决冲突 |

**类型定义 (Rust):**
- `SyncEntityType`: 枚举 — Message/Employee/Department/SalesOrder/PurchaseOrder/Inventory/Invoice/ApprovalFlow/Ticket/Contract/Payroll/LeaveRequest/ExpenseReport
- `SyncConflict`: { id, entity_type, entity_id, local_version, remote_version, conflicting_fields }
- `ConflictResolutionStrategy`: KeepLocal/KeepRemote/KeepBoth/Merge/LastWriteWins

**类型定义 (TS):**
- `SyncConflict`: { id, entityType, entityId, entityLabel, localModifiedAt, remoteModifiedAt, fields: ConflictField[] }
- `ConflictResolutionStrategy`: 'keep-local' | 'keep-remote' | 'keep-both' | 'merge' | 'last-write-wins'
- `ConflictResolutionResult`: { conflictId, strategy, resolvedFields?, resolvedAt }

### DashScope LLM Provider (C1 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `dashscope_complete` | `request: LlmRequest` | `LlmResponse` | 非流式补全 |
| `dashscope_complete_stream` | `request: LlmRequest` | `Stream<LlmResponse>` | 流式补全 |
| `dashscope_health_check` | — | `bool` | 健康检查 |

### 部门工具注册集 (C1 新增)

6部门 × 5工具 = 30个工具，命名遵循 `{plugin}_{entity}_{action}` 格式：

| 部门 | query | aggregate | mutate | action | export |
|------|-------|-----------|--------|--------|--------|
| HR | hr_employee_query | hr_employee_aggregate | hr_employee_mutate | hr_attendance_action | hr_report_export |
| Sales | sales_customer_query | sales_opportunity_aggregate | sales_order_mutate | sales_quotation_action | sales_report_export |
| Approval | approval_flow_query | approval_flow_aggregate | approval_flow_mutate | approval_batch_action | approval_report_export |
| Warehouse | warehouse_inventory_query | warehouse_inventory_aggregate | warehouse_inventory_mutate | warehouse_movement_action | warehouse_report_export |
| Service | service_ticket_query | service_ticket_aggregate | service_ticket_mutate | service_dispatch_action | service_report_export |
| Finance | (已有) finance_invoice_query | finance_invoice_aggregate | finance_invoice_mutate | finance_ocr_action | finance_report_export |

### 群聊Agent协作 (C2 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `group_agent_join` | `group_id, agent_id, role` | `bool` | Agent自动入群 (FR634) |
| `group_agent_set_silent` | `group_id, agent_id, silent: bool` | `bool` | 设置Agent静默模式 (FR640) |
| `group_agent_mention` | `group_id, agent_id, message` | `Response` | @提及触发Agent响应 (FR641) |

### 模板存储 (C2 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `template_store_save` | `template: TemplateData` | `TemplateId` | 保存模板到SQLite |
| `template_store_load` | `id: TemplateId` | `TemplateData` | 从SQLite加载模板 |
| `template_store_list` | `filter?: TemplateFilter` | `Vec<TemplateSummary>` | 列出模板 |
| `template_store_delete` | `id: TemplateId` | `bool` | 删除模板 |

### 模板Schema+设计器 (C3 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `template_schema_validate` | `schema: TemplateSchema` | `ValidationResult` | 验证模板Schema |
| `template_designer_create` | `design: DesignerInput` | `TemplateId` | 创建模板(设计器) |
| `template_designer_render` | `id: TemplateId, data: BindData` | `RenderResult` | 渲染模板(数据绑定) |
| `template_binding_resolve` | `binding: TemplateBinding, context: DataContext` | `ResolvedData` | 解析数据绑定 |

### 消息状态追踪 (C3 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `message_status_update` | `message_id, status: MessageStatus` | `bool` | 更新消息状态 |
| `message_status_batch` | `message_ids: Vec<String>` | `Vec<MessageStatusResult>` | 批量查询状态 (FR622-630) |

### 模板命令层 (C4 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `template_create` | `name, description?` | `TemplateId` | 创建模板 |
| `template_create_with_schema` | `name, schema` | `TemplateId` | 带Schema创建模板 |
| `template_get` | `id` | `Template` | 获取模板 |
| `template_list` | `filter?` | `Vec<Template>` | 列出模板 |
| `template_save_schema` | `id, schema` | `bool` | 保存Schema |
| `template_get_schema` | `id` | `TemplateSchema` | 获取Schema |
| `template_validate_schema` | `schema` | `ValidationResult` | 验证Schema |
| `template_create_draft` | `id` | `VersionId` | 创建草稿版本 |
| `template_publish_version` | `id, version_id` | `bool` | 发布版本 |
| `template_get_active_version` | `id` | `TemplateVersion` | 获取活跃版本 |
| `template_list_versions` | `id` | `Vec<TemplateVersion>` | 列出版本 |
| `template_set_default_version` | `id, version_id` | `bool` | 设置默认版本 |
| `template_analyze_schema` | `schema` | `BindingAnalysis` | 分析Schema绑定 |
| `template_preview_binding` | `schema, data` | `PreviewResult` | 预览绑定 |
| `template_fill_bindings` | `schema, data` | `FilledTemplate` | 填充绑定 |
| `template_apply_element_operation` | `schema, op` | `TemplateSchema` | 应用元素操作 |
| `template_apply_layer_operation` | `schema, op` | `TemplateSchema` | 应用图层操作 |
| `template_align_elements` | `schema, ids, alignment` | `TemplateSchema` | 对齐元素 |

### SIEM审计 (C4 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `siem_get_config` | — | `SiemConfig` | 获取SIEM配置 |
| `siem_update_config` | `config` | `bool` | 更新SIEM配置 |
| `siem_flush` | — | `usize` | 刷新待发送事件 |
| `siem_pending_count` | — | `usize` | 查询待发送事件数 |

## Auth / RBAC (R2 新增)

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `check_user_permission` | `token: String, permission: String` | `bool` | 检查用户权限 (G4) |
| `register` | (原有) | (原有) | 新增 admin 权限检查 (G4) |

**类型定义 (Rust):**
- `Role`: 枚举 — Employee < Manager < Admin (有序层级)
- `Permission`: 枚举 — Read / Write / Admin
- `check_permission(role: &Role, required: &Role) -> bool`

**安全配置:**
- JWT secret: 从环境变量 `JWT_SECRET` 读取，开发环境保留默认值 + WARNING
- CSP: tauri.conf.json 完整策略 (default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src self+localhost+openrouter.ai; frame-src 'none')
- API keys: 从环境变量读取 (OPENROUTER_API_KEY 等)，未配置时跳过初始化

## Cloud API

（随实现逐步添加）
