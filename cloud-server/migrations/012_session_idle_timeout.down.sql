-- Rollback session idle timeout migration
-- Migration: 012_session_idle_timeout

DROP INDEX IF EXISTS idx_sessions_tenant_status;
DROP INDEX IF EXISTS idx_sessions_last_activity;
DROP INDEX IF EXISTS idx_sessions_status;

ALTER TABLE sessions DROP COLUMN IF EXISTS revoked_reason;
ALTER TABLE sessions DROP COLUMN IF EXISTS status;
ALTER TABLE sessions DROP COLUMN IF EXISTS revoked_at;
