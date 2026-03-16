DELETE FROM permissions
WHERE code IN (
    'user:read',
    'user:write',
    'user:delete',
    'role:read',
    'role:write',
    'department:read',
    'department:write',
    'tenant:manage',
    'plugin:install',
    'settings:manage'
);
