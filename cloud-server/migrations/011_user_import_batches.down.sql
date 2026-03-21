-- Drop indexes
DROP INDEX IF EXISTS idx_user_import_rows_conflict_type;
DROP INDEX IF EXISTS idx_user_import_rows_status;
DROP INDEX IF EXISTS idx_user_import_rows_batch_id;
DROP INDEX IF EXISTS idx_user_import_batches_created_at;
DROP INDEX IF EXISTS idx_user_import_batches_status;
DROP INDEX IF EXISTS idx_user_import_batches_batch_id;
DROP INDEX IF EXISTS idx_user_import_batches_tenant;

-- Drop tables
DROP TABLE IF EXISTS user_import_rows;
DROP TABLE IF EXISTS user_import_batches;
