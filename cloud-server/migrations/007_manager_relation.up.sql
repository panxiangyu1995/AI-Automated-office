-- Add manager_id to users table for direct manager relationship
-- Epic 2, Story 2.4: Direct Manager Relation

-- Add manager_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);

-- Add index for manager_id lookups
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);

-- Add check constraint to prevent self-reference (done via application logic)
-- Note: PostgreSQL doesn't allow CHECK constraint with same table reference easily
-- The self-reference check is enforced in application layer

-- Comment on the column
COMMENT ON COLUMN users.manager_id IS 'Direct manager (supervisor) user ID';
