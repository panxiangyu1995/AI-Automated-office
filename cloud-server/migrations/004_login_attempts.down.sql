-- Drop login_attempts table
DROP INDEX IF EXISTS idx_login_attempts_created;
DROP INDEX IF EXISTS idx_login_attempts_tenant;
DROP INDEX IF EXISTS idx_login_attempts_user;
DROP TABLE IF EXISTS login_attempts;

-- Remove columns from users table
DROP INDEX IF EXISTS idx_users_locked_until;
ALTER TABLE users DROP COLUMN IF EXISTS locked_until;
ALTER TABLE users DROP COLUMN IF EXISTS failed_login_count;
