-- 009_seed_three_layer_permissions.down.sql
-- 回滚三层权限模型种子数据

-- 删除新增的角色权限关联
DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE layer IN ('base', 'department', 'approval')
);

-- 删除新增的权限
DELETE FROM permissions WHERE layer IN ('base', 'department', 'approval');

-- 删除新增的角色
DELETE FROM roles WHERE code IN ('dept_admin', 'approver');

-- 恢复原有角色定义
UPDATE roles SET type = 'custom', layer = 'base', description = NULL WHERE code = 'super_admin';
UPDATE roles SET type = 'custom', layer = 'base', description = NULL WHERE code = 'admin';
UPDATE roles SET type = 'custom', layer = 'base', description = NULL WHERE code = 'manager';
UPDATE roles SET type = 'custom', layer = 'base', description = NULL WHERE code = 'employee';
