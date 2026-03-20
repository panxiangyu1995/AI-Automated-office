-- 010_user_permission_overrides.up.sql
-- Story 2.6 细粒度权限覆盖迁移脚本

-- 1. 创建用户权限覆盖表
CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    resource VARCHAR(100) NOT NULL,              -- 资源标识 (如 hr.employee, finance.invoice)
    permission_id UUID REFERENCES permissions(id), -- 可选，具体权限覆盖
    override_type VARCHAR(20) NOT NULL,          -- grant, deny
    
    -- 数据范围配置
    data_scope_type VARCHAR(50) NOT NULL DEFAULT 'all', -- all, department, department_tree, self, custom
    data_scope_rule JSONB,                       -- 自定义规则 JSON
    
    -- 字段级权限
    field_restrictions JSONB,                    -- 字段限制配置 JSON
    
    -- 有效期
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,    -- 可选，临时授权过期时间
    
    -- 审计
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_override_type CHECK (override_type IN ('grant', 'deny')),
    CONSTRAINT chk_data_scope_type CHECK (data_scope_type IN ('all', 'department', 'department_tree', 'self', 'custom')),
    CONSTRAINT unique_user_resource_permission UNIQUE (tenant_id, user_id, resource, permission_id)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_perm_overrides_user ON user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perm_overrides_resource ON user_permission_overrides(resource);
CREATE INDEX IF NOT EXISTS idx_user_perm_overrides_tenant ON user_permission_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_perm_overrides_effective ON user_permission_overrides(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_user_perm_overrides_user_resource ON user_permission_overrides(user_id, resource);

-- 3. 创建字段限制配置的 JSON Schema 验证函数 (可选，PostgreSQL 14+)
-- 用于验证 field_restrictions 字段的格式

-- 4. 添加注释
COMMENT ON TABLE user_permission_overrides IS '用户权限覆盖表 - 支持用户级权限覆盖、数据范围权限和字段级权限控制';
COMMENT ON COLUMN user_permission_overrides.resource IS '资源标识，如 hr.employee, finance.invoice';
COMMENT ON COLUMN user_permission_overrides.permission_id IS '可选，具体权限覆盖。为空表示资源级覆盖';
COMMENT ON COLUMN user_permission_overrides.override_type IS '覆盖类型：grant(授权) 或 deny(剥夺)';
COMMENT ON COLUMN user_permission_overrides.data_scope_type IS '数据范围类型：all/department/department_tree/self/custom';
COMMENT ON COLUMN user_permission_overrides.data_scope_rule IS '自定义数据范围规则，仅当 data_scope_type=custom 时有效';
COMMENT ON COLUMN user_permission_overrides.field_restrictions IS '字段限制配置，JSON 格式 {field_name: {mode, maskRule}}';
COMMENT ON COLUMN user_permission_overrides.effective_until IS '可选，临时授权过期时间。过期后覆盖自动失效';

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_permission_overrides_updated_at 
    BEFORE UPDATE ON user_permission_overrides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
