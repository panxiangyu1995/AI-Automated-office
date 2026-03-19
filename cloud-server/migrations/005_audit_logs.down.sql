-- Drop audit_logs table
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_event_type;
DROP INDEX IF EXISTS idx_audit_logs_target;
DROP INDEX IF EXISTS idx_audit_logs_operator;
DROP INDEX IF EXISTS idx_audit_logs_tenant;
DROP TABLE IF EXISTS audit_logs;
