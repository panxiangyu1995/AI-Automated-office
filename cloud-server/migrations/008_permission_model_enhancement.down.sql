-- 008_permission_model_enhancement.down.sql
-- 回滚三层权限模型增强迁移

-- 1. 移除 role_permissions 表扩展字段
DROP INDEX IF EXISTS idx_role_permissions_tenant;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS created_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS id;

-- 2. 移除 user_roles 表扩展字段
DROP INDEX IF EXISTS idx_user_roles_department;
DROP INDEX IF EXISTS idx_user_roles_tenant;
ALTER TABLE user_roles DROP COLUMN IF EXISTS assigned_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS assigned_by;
ALTER TABLE user_roles DROP COLUMN IF EXISTS department_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS id;

-- 3. 移除 permissions 表扩展字段
DROP INDEX IF EXISTS idx_permissions_resource;
DROP INDEX IF EXISTS idx_permissions_layer;
DROP INDEX IF EXISTS idx_permissions_tenant;
DROP INDEX IF EXISTS idx_permissions_tenant_code;
DROP INDEX IF EXISTS idx_permissions_global_code;
ALTER TABLE permissions DROP COLUMN IF EXISTS created_at;
ALTER TABLE permissions DROP COLUMN IF EXISTS layer;
ALTER TABLE permissions DROP COLUMN IF EXISTS tenant_id;
CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_key ON permissions(code);

-- 4. 移除 roles 表扩展字段
DROP INDEX IF EXISTS idx_roles_layer;
DROP INDEX IF EXISTS idx_roles_type;
ALTER TABLE roles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE roles DROP COLUMN IF EXISTS layer;
ALTER TABLE roles DROP COLUMN IF EXISTS type;
