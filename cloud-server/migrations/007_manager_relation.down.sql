-- Rollback: Remove manager relation from users table

DROP INDEX IF EXISTS idx_users_manager;
ALTER TABLE users DROP COLUMN IF EXISTS manager_id;
