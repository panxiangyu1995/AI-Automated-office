-- 009_seed_three_layer_permissions.up.sql
-- 三层权限模型种子数据

-- 1. 插入全局权限定义（按模块分组）
-- 基础权限层 (base)
INSERT INTO permissions (code, name, resource, action, layer, description) VALUES
    -- 认证模块
    ('auth_profile_read', '查看个人信息', 'auth.profile', 'read', 'base', '查看自己的个人资料'),
    ('auth_profile_write', '编辑个人信息', 'auth.profile', 'write', 'base', '编辑自己的个人资料'),
    ('auth_password_change', '修改密码', 'auth.password', 'write', 'base', '修改自己的登录密码'),
    
    -- 公告模块
    ('announcement_read', '查看公告', 'announcement', 'read', 'base', '查看公告列表和详情'),
    
    -- 消息模块
    ('message_read', '查看消息', 'message', 'read', 'base', '查看接收的消息'),
    ('message_write', '发送消息', 'message', 'write', 'base', '发送消息给其他用户')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    layer = EXCLUDED.layer,
    description = EXCLUDED.description;

-- 部门权限层 (department)
INSERT INTO permissions (code, name, resource, action, layer, description) VALUES
    -- 人事模块
    ('hr_employee_read', '查看员工信息', 'hr.employee', 'read', 'department', '查看部门内员工信息'),
    ('hr_employee_write', '编辑员工信息', 'hr.employee', 'write', 'department', '编辑部门内员工信息'),
    ('hr_employee_create', '创建员工', 'hr.employee', 'write', 'department', '创建新员工'),
    ('hr_employee_delete', '删除员工', 'hr.employee', 'delete', 'department', '删除员工'),
    
    -- 部门模块
    ('department_read', '查看部门信息', 'department', 'read', 'department', '查看部门详情'),
    ('department_write', '编辑部门信息', 'department', 'write', 'department', '编辑部门信息'),
    
    -- 财务模块
    ('finance_invoice_read', '查看发票', 'finance.invoice', 'read', 'department', '查看发票信息'),
    ('finance_invoice_write', '编辑发票', 'finance.invoice', 'write', 'department', '创建和编辑发票'),
    ('finance_report_read', '查看财务报表', 'finance.report', 'read', 'department', '查看财务报表'),
    
    -- 销售模块
    ('sales_customer_read', '查看客户信息', 'sales.customer', 'read', 'department', '查看客户信息'),
    ('sales_customer_write', '编辑客户信息', 'sales.customer', 'write', 'department', '创建和编辑客户'),
    ('sales_order_read', '查看订单', 'sales.order', 'read', 'department', '查看销售订单'),
    ('sales_order_write', '编辑订单', 'sales.order', 'write', 'department', '创建和编辑销售订单'),
    
    -- 仓库模块
    ('warehouse_inventory_read', '查看库存', 'warehouse.inventory', 'read', 'department', '查看库存信息'),
    ('warehouse_inventory_write', '编辑库存', 'warehouse.inventory', 'write', 'department', '编辑库存信息'),
    ('warehouse_inbound_write', '入库操作', 'warehouse.inbound', 'write', 'department', '执行入库操作'),
    ('warehouse_outbound_write', '出库操作', 'warehouse.outbound', 'write', 'department', '执行出库操作'),
    
    -- 知识库模块
    ('knowledge_read', '查看知识库', 'knowledge', 'read', 'department', '查看知识库文档'),
    ('knowledge_write', '编辑知识库', 'knowledge', 'write', 'department', '编辑知识库文档')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    layer = EXCLUDED.layer,
    description = EXCLUDED.description;

-- 审批权限层 (approval)
INSERT INTO permissions (code, name, resource, action, layer, description) VALUES
    -- 审批模块
    ('approval_flow_read', '查看审批流程', 'approval.flow', 'read', 'approval', '查看审批流程配置'),
    ('approval_flow_write', '编辑审批流程', 'approval.flow', 'write', 'approval', '配置审批流程'),
    ('approval_instance_create', '发起审批', 'approval.instance', 'write', 'approval', '发起新的审批申请'),
    ('approval_instance_approve', '审批通过', 'approval.instance', 'write', 'approval', '审批通过申请'),
    ('approval_instance_reject', '审批驳回', 'approval.instance', 'write', 'approval', '审批驳回申请'),
    
    -- 管理权限
    ('admin_user_read', '查看用户管理', 'admin.user', 'read', 'approval', '查看用户管理功能'),
    ('admin_user_write', '编辑用户管理', 'admin.user', 'write', 'approval', '编辑用户信息'),
    ('admin_role_read', '查看角色管理', 'admin.role', 'read', 'approval', '查看角色配置'),
    ('admin_role_write', '编辑角色管理', 'admin.role', 'write', 'approval', '编辑角色配置'),
    ('admin_permission_read', '查看权限管理', 'admin.permission', 'read', 'approval', '查看权限配置'),
    
    -- 系统设置
    ('settings_read', '查看系统设置', 'settings', 'read', 'approval', '查看系统设置'),
    ('settings_write', '编辑系统设置', 'settings', 'write', 'approval', '编辑系统设置'),
    ('plugin_read', '查看插件管理', 'plugin', 'read', 'approval', '查看插件列表'),
    ('plugin_write', '管理插件', 'plugin', 'write', 'approval', '安装/卸载/配置插件')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    layer = EXCLUDED.layer,
    description = EXCLUDED.description;

-- 2. 更新默认角色定义
-- 更新超级管理员
UPDATE roles SET 
    type = 'system', 
    layer = 'base',
    description = '租户级最高权限，拥有所有权限',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'super_admin';

-- 更新管理员
UPDATE roles SET 
    type = 'system', 
    layer = 'base',
    description = '系统管理员，拥有用户和部门管理权限',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'admin';

-- 更新部门经理（如果存在）
UPDATE roles SET 
    type = 'custom', 
    layer = 'department',
    description = '部门管理员，拥有部门内管理权限',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'manager';

-- 更新普通员工
UPDATE roles SET 
    type = 'custom', 
    layer = 'base',
    description = '普通员工，拥有基础权限',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'employee';

-- 3. 插入新角色（如果不存在）
INSERT INTO roles (tenant_id, name, code, type, layer, description, is_system)
SELECT t.id, '部门管理员', 'dept_admin', 'system', 'department', '部门级管理员，管理本部门员工和业务', false
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'dept_admin' AND roles.tenant_id = t.id);

INSERT INTO roles (tenant_id, name, code, type, layer, description, is_system)
SELECT t.id, '审批人', 'approver', 'custom', 'approval', '审批流程中的审批人角色', false
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'approver' AND roles.tenant_id = t.id);

-- 4. 为超级管理员分配所有权限
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT r.tenant_id, r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 5. 为管理员分配管理权限
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT r.tenant_id, r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'auth_profile_read', 'auth_profile_write', 'auth_password_change',
    'announcement_read', 'message_read', 'message_write',
    'hr_employee_read', 'hr_employee_write', 'hr_employee_create',
    'department_read', 'department_write',
    'admin_user_read', 'admin_user_write',
    'admin_role_read', 'admin_permission_read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 6. 为部门管理员分配部门权限
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT r.tenant_id, r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('manager', 'dept_admin')
  AND p.layer IN ('base', 'department')
  AND p.code NOT LIKE 'admin_%'
  AND p.code NOT LIKE 'settings_%'
  AND p.code NOT LIKE 'plugin_%'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 7. 为普通员工分配基础权限
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT r.tenant_id, r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'employee'
  AND p.layer = 'base'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 8. 为审批人分配审批权限
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT r.tenant_id, r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'approver'
  AND p.code IN (
    'auth_profile_read', 'auth_profile_write', 'auth_password_change',
    'announcement_read', 'message_read', 'message_write',
    'approval_instance_create', 'approval_instance_approve', 'approval_instance_reject'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
