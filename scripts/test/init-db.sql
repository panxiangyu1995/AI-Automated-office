-- E2E 测试数据库初始化脚本
-- 此脚本在 PostgreSQL 容器首次启动时自动执行

-- 创建测试用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(128),
    email VARCHAR(255),
    phone VARCHAR(64),
    avatar_url VARCHAR(512),
    employee_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'active',
    tenant_id VARCHAR(64) DEFAULT 'default',
    department_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建测试部门表
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    parent_id VARCHAR(64),
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建测试角色表
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    layer VARCHAR(32) DEFAULT 'base',
    is_builtin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 创建权限表
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(64) NOT NULL,
    permission_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- 创建会话表
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token VARCHAR(512) NOT NULL,
    refresh_token VARCHAR(512),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    resource VARCHAR(256),
    resource_id VARCHAR(64),
    details JSONB,
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建公告表
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    content TEXT,
    priority VARCHAR(32) DEFAULT 'normal',
    status VARCHAR(32) DEFAULT 'draft',
    author_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据

-- 测试部门
INSERT INTO departments (id, name, code, parent_id, level) VALUES
    ('test-dept-root', '测试公司', 'ROOT', NULL, 1),
    ('test-dept-hr', '人力资源部', 'HR', 'test-dept-root', 2),
    ('test-dept-finance', '财务部', 'FINANCE', 'test-dept-root', 2),
    ('test-dept-sales', '销售部', 'SALES', 'test-dept-root', 2),
    ('test-dept-tech', '技术部', 'TECH', 'test-dept-root', 2)
ON CONFLICT (code) DO NOTHING;

-- 测试角色
INSERT INTO roles (id, name, code, layer, is_builtin) VALUES
    ('test-role-admin', '系统管理员', 'ADMIN', 'base', true),
    ('test-role-manager', '部门经理', 'DEPT_MANAGER', 'department', false),
    ('test-role-employee', '普通员工', 'EMPLOYEE', 'base', true),
    ('test-role-hr', 'HR管理员', 'HR_ADMIN', 'department', false)
ON CONFLICT (code) DO NOTHING;

-- 测试权限
INSERT INTO permissions (id, code, name, description) VALUES
    ('test-perm-user-read', 'admin_user_read', '用户读取', '读取用户信息'),
    ('test-perm-user-write', 'admin_user_write', '用户写入', '创建和编辑用户'),
    ('test-perm-user-delete', 'admin_user_delete', '用户删除', '删除用户'),
    ('test-perm-role-read', 'admin_role_read', '角色读取', '读取角色信息'),
    ('test-perm-role-write', 'admin_role_write', '角色写入', '创建和编辑角色'),
    ('test-perm-dept-read', 'admin_department_read', '部门读取', '读取部门信息'),
    ('test-perm-dept-write', 'admin_department_write', '部门写入', '创建和编辑部门'),
    ('test-perm-audit-read', 'audit_log_read', '审计日志读取', '读取审计日志'),
    ('test-perm-audit-export', 'audit_log_export', '审计日志导出', '导出审计日志'),
    ('test-perm-profile-read', 'auth_profile_read', '个人资料读取', '读取个人资料')
ON CONFLICT (code) DO NOTHING;

-- 给管理员角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'test-role-admin', p.id FROM permissions p WHERE p.code LIKE 'admin_%' OR p.code LIKE 'audit_%'
ON CONFLICT DO NOTHING;

-- 给员工角色分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'test-role-employee', p.id FROM permissions p WHERE p.code = 'auth_profile_read'
ON CONFLICT DO NOTHING;

-- 插入测试用户（使用 bcrypt 哈希）
INSERT INTO users (id, username, password_hash, real_name, email, employee_id, status, tenant_id) VALUES
    ('test-admin-001', 'admin', '$2a$12$jQddmKhjdbj1gMlMnA7/cO.42x3Upbnl8cvZnYEKToFRR1St2y4dG', '系统管理员', 'admin@test.local', 'ADMIN001', 'active', 'default'),
    ('test-manager-001', 'manager', '$2a$12$KGHTvo5Wpwfj1i1oXyJ5jOJnuMwlrB8AGJKzGV0c/nnZmZtYJmymq', '部门经理', 'manager@test.local', 'MGR001', 'active', 'default'),
    ('test-employee-001', 'employee', '$2a$12$Ur6db1GMZfizXb1N12SXre/G5AAQLWXpxFYOQxluHHDqqO1zsUYdm', '普通员工', 'employee@test.local', 'EMP001', 'active', 'default')
ON CONFLICT (username) DO NOTHING;

-- 添加租户表（如果需要）
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- 插入默认租户
INSERT INTO tenants (id, name, code, status) VALUES
    ('default', '默认租户', 'DEFAULT', 'active')
ON CONFLICT (code) DO NOTHING;

-- 分配角色给用户
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'manager' AND r.code = 'DEPT_MANAGER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'employee' AND r.code = 'EMPLOYEE'
ON CONFLICT DO NOTHING;
