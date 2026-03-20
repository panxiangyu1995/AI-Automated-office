-- 008_permission_model_enhancement.up.sql
-- 三层权限模型增强迁移脚本

-- 1. 为 roles 表添加 type 和 layer 字段
ALTER TABLE roles ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'custom';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS layer VARCHAR(20) NOT NULL DEFAULT 'base';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(type);
CREATE INDEX IF NOT EXISTS idx_roles_layer ON roles(layer);

-- 2. 为 permissions 表添加 tenant_id 和 layer 字段
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS layer VARCHAR(20) NOT NULL DEFAULT 'base';
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 更新 permissions 表的唯一约束（改为 tenant_id + code 组合唯一）
DROP INDEX IF EXISTS permissions_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_tenant_code ON permissions(tenant_id, code) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_global_code ON permissions(code) WHERE tenant_id IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_permissions_tenant ON permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_layer ON permissions(layer);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

-- 3. 为 user_roles 表添加扩展字段
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_department ON user_roles(department_id);

-- 4. 为 role_permissions 表添加扩展字段
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant ON role_permissions(tenant_id);

-- 5. 更新现有角色的 type 和 layer
UPDATE roles SET type = 'system', layer = 'base' WHERE code = 'super_admin';
UPDATE roles SET type = 'system', layer = 'base' WHERE code = 'admin';
UPDATE roles SET type = 'custom', layer = 'department' WHERE code = 'manager';
UPDATE roles SET type = 'custom', layer = 'base' WHERE code = 'employee';

-- 6. 为现有 user_roles 记录填充 tenant_id
UPDATE user_roles ur SET tenant_id = (
    SELECT r.tenant_id FROM roles r WHERE r.id = ur.role_id
) WHERE ur.tenant_id IS NULL;

-- 7. 为现有 role_permissions 记录填充 tenant_id
UPDATE role_permissions rp SET tenant_id = (
    SELECT r.tenant_id FROM roles r WHERE r.id = rp.role_id
) WHERE rp.tenant_id IS NULL;
