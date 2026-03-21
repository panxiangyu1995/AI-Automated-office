-- Add session state management fields for idle timeout support
-- Migration: 012_session_idle_timeout

-- Add revoked_at column for explicit session revocation tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;

-- Add status column for session state (active, expired, revoked, idle_timeout)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status) WHERE deleted_at IS NULL;

-- Add index for idle timeout queries (sessions that need to be checked)
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at) WHERE deleted_at IS NULL AND status = 'active';

-- Add composite index for tenant + status queries
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_status ON sessions(tenant_id, status) WHERE deleted_at IS NULL;

-- Add revoked_reason column for tracking why session was revoked
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_reason VARCHAR(100);

-- Comment on columns
COMMENT ON COLUMN sessions.revoked_at IS 'Timestamp when session was explicitly revoked';
COMMENT ON COLUMN sessions.status IS 'Session state: active, expired, revoked, idle_timeout';
COMMENT ON COLUMN sessions.revoked_reason IS 'Reason for revocation: user_logout, admin_revoke, idle_timeout, security';
