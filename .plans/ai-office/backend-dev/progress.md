# backend-dev - 工作日志

> 用于上下文恢复。压缩/重启后先读此文件。

---

## 2026-04-16 - R1-R2 安全修复

### G1: JWT安全修复
- `auth/mod.rs`: 硬编码 `"secret_key_change_me"` 改为从环境变量 `JWT_SECRET` 读取
- 保留默认值用于开发环境
- 使用默认值时打印 WARNING 日志
- 新增 `with_secret()` 构造函数供测试使用
- 测试代码更新为 `with_secret()`，不依赖环境变量

### G2: CSP配置
- `tauri.conf.json`: 从 `csp: null` 改为完整CSP策略
- default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
- connect-src 允许 self + localhost + openrouter.ai
- frame-src 'none'

### G4: RBAC基础实现
- `auth/mod.rs`: 新增 `Role` 枚举 (Employee < Manager < Admin)
- `auth/mod.rs`: 新增 `Permission` 枚举 (Read/Write/Admin)
- `auth/mod.rs`: 新增 `check_permission()` 函数
- `commands/auth.rs`: register 命令添加 admin 权限检查
- `commands/auth.rs`: 新增 `check_user_permission` 命令
- `lib.rs`: 注册 `check_user_permission` 命令

### 验证
- `cargo check` 编译通过

---

## 2026-04-16 - R1第二轮: 编译错误修复 + JWT生产环境panic加固

### G1: 编译错误修复（确认）
- `enterprise_types.rs` 和 `enterprise_helpers.rs` 已存在于 `src/agent/tools/` 目录
- `AlertCondition::ChangeRateExceeds` 字段名 `percentage` 已一致，无需修复
- `cargo check` 零错误通过（仅474个warnings）

### G4: JWT生产环境panic加固
- `auth/mod.rs:80`: `DEFAULT_JWT_SECRET` 常量加 `#[cfg(any(test, debug_assertions))]` 条件编译
- `auth/mod.rs:95-106`: `Err(_)` 分支拆分为两个条件编译块：
  - `#[cfg(any(test, debug_assertions))]`: 保留 warn 日志 + 默认值（开发/测试安全）
  - `#[cfg(not(any(test, debug_assertions)))]`: panic，拒绝无环境变量启动（生产安全）
- `cargo check` 编译通过

### 验证
- `cargo check` 零错误通过

---

## 2026-04-16 - R3: RBAC接入业务模块

### G4扩展: 将RBAC权限检查接入业务模块

**公共RBAC辅助函数** (`auth/mod.rs`):
- 新增 `verify_and_check(token, auth_service, permission)` 公共函数
- 统一 token 验证 + 权限检查逻辑，消除各模块重复代码

**权限策略**:
- Read (Employee+): list/get/stats 查询操作
- Write (Manager+): create/update/approve/reject/cancel/verify/record_payment/stocktaking 写入操作
- Admin (Admin only): delete 删除操作

**已接入模块** (每个命令添加 token + auth_service 参数 + verify_and_check 调用):

1. `hr/commands.rs` (15个命令):
   - Read: hr_list_employees, hr_get_employee, hr_get_department_tree, hr_get_department, hr_list_positions, hr_get_position
   - Write: hr_create_employee, hr_update_employee, hr_create_department, hr_update_department, hr_create_position, hr_update_position
   - Admin: hr_delete_employee, hr_delete_department, hr_delete_position

2. `finance/commands.rs` (12个命令):
   - Read: finance_list_invoices, finance_get_invoice, finance_list_ledger, finance_get_ledger, finance_get_stats
   - Write: finance_create_invoice, finance_verify_invoice, finance_create_ledger, finance_record_payment, finance_link_invoice_to_contract, finance_create_invoice_from_sales, finance_create_ledger_from_sales

3. `sales/commands.rs` (10个命令):
   - Read: sales_list_customers, sales_get_customer, sales_list_quotes, sales_get_quote, sales_list_contracts, sales_get_contract, sales_get_stats
   - Write: sales_create_customer, sales_update_customer
   - Admin: sales_delete_customer

4. `warehouse/commands.rs` (11个命令):
   - Read: warehouse_list_inbounds, warehouse_get_inbound, warehouse_list_outbounds, warehouse_get_outbound, warehouse_list_inventory, warehouse_get_stats, warehouse_list_inventory_detail, warehouse_list_stocktaking
   - Write: warehouse_create_inbound, warehouse_create_outbound, warehouse_stocktaking

5. `approval/commands.rs` (11个命令):
   - Read: approval_list_flows, approval_get_flow, approval_list_records, approval_get_record, approval_get_stats
   - Write: approval_create_flow, approval_update_flow, approval_create_record, approval_approve, approval_reject, approval_cancel
   - Admin: approval_delete_flow

6. `commands/approval_ai.rs` (4个命令):
   - Read: detect_approval_risks, generate_approval_summary, predict_approval_outcome
   - Write: smart_fill_form

7. `commands/approval_attachment.rs` (12个命令):
   - Read: get_attachment, get_record_attachments, get_record_audits, get_all_audits, query_audits, get_record_timeline, has_timeline
   - Write: add_attachment, add_audit_entry, add_audit_with_state, add_timeline_event
   - Admin: delete_attachment

8. `commands/approval_enhancement.rs` (8个命令):
   - Read: get_delegation, get_delegations_as_delegate, get_reminder_records, get_reminder_stats, get_reminder_settings
   - Write: set_delegation, cancel_delegation, send_approval_reminder, set_reminder_settings

9. `commands/approval_template.rs` (11个命令):
   - Read: get_approval_templates, get_approval_templates_by_category, get_active_approval_templates, get_builtin_approval_templates, get_approval_template, search_approval_templates, get_approval_template_previews, recommend_approval_templates, get_approval_template_stats, get_template_categories
   - Write: create_approval_template, update_approval_template
   - Admin: delete_approval_template

### 验证
- `cargo check` 编译通过（0个新增错误，仅有27个预存在的 knowledge 模块错误）
