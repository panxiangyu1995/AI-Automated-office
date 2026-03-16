WITH tenant_seed AS (
    INSERT INTO tenants (name, slug, plan, max_users, max_storage_gb, status, settings)
    VALUES (
        COALESCE(current_setting('app.default_tenant_name', true), 'Default Tenant'),
        'default',
        'free',
        10,
        10,
        'active',
        '{}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
),
tenant_selected AS (
    SELECT id FROM tenant_seed
    UNION ALL
    SELECT id FROM tenants WHERE slug = 'default' LIMIT 1
)
INSERT INTO roles (tenant_id, name, code, description, is_system, permissions)
SELECT
    tenant_selected.id,
    role_data.name,
    role_data.code,
    role_data.description,
    role_data.is_system,
    role_data.permissions
FROM tenant_selected
JOIN (
    VALUES
        ('超级管理员', 'super_admin', '全部权限', TRUE, '[]'::jsonb),
        ('管理员', 'admin', '用户与部门管理', TRUE, '[]'::jsonb),
        ('部门经理', 'manager', '部门管理', FALSE, '[]'::jsonb),
        ('普通员工', 'employee', '基础权限', FALSE, '[]'::jsonb)
) AS role_data(name, code, description, is_system, permissions) ON TRUE
ON CONFLICT (tenant_id, code) DO NOTHING;

WITH tenant_selected AS (
    SELECT id FROM tenants WHERE slug = 'default' LIMIT 1
)
INSERT INTO users (
    tenant_id,
    email,
    password_hash,
    name,
    status,
    email_verified,
    created_at,
    updated_at
)
SELECT
    tenant_selected.id,
    current_setting('app.admin_email', true),
    current_setting('app.admin_password_hash', true),
    COALESCE(current_setting('app.admin_name', true), '超级管理员'),
    'active',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenant_selected
WHERE current_setting('app.admin_email', true) IS NOT NULL
  AND current_setting('app.admin_password_hash', true) IS NOT NULL
ON CONFLICT (tenant_id, email) DO NOTHING;
