DROP TRIGGER IF EXISTS trg_create_tenant_schema ON tenants;
DROP FUNCTION IF EXISTS create_tenant_schema();

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

DROP EXTENSION IF EXISTS "pgcrypto";
