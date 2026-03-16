INSERT INTO permissions (code, name, resource, action, description)
VALUES
    ('user:read', '查看用户', 'user', 'read', NULL),
    ('user:write', '编辑用户', 'user', 'update', NULL),
    ('user:delete', '删除用户', 'user', 'delete', NULL),
    ('role:read', '查看角色', 'role', 'read', NULL),
    ('role:write', '编辑角色', 'role', 'update', NULL),
    ('department:read', '查看部门', 'department', 'read', NULL),
    ('department:write', '编辑部门', 'department', 'update', NULL),
    ('tenant:manage', '管理租户', 'tenant', 'manage', NULL),
    ('plugin:install', '安装插件', 'plugin', 'create', NULL),
    ('settings:manage', '系统设置', 'settings', 'manage', NULL)
ON CONFLICT (code) DO NOTHING;
