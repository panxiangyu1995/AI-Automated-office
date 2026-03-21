-- 用户导入批次表
CREATE TABLE IF NOT EXISTS user_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255),
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    conflict_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    -- pending, preview, confirmed, processing, completed, failed, cancelled
    preview_data JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, batch_id)
);

-- 导入行记录表
CREATE TABLE IF NOT EXISTS user_import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES user_import_batches(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    raw_data JSONB NOT NULL,
    parsed_data JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    -- pending, valid, conflict, error
    conflict_type VARCHAR(32),
    -- duplicate_username, duplicate_employee_code, department_not_found, position_not_found, manager_not_found
    conflict_detail JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_import_batches_tenant ON user_import_batches(tenant_id);
CREATE INDEX idx_user_import_batches_batch_id ON user_import_batches(batch_id);
CREATE INDEX idx_user_import_batches_status ON user_import_batches(status);
CREATE INDEX idx_user_import_batches_created_at ON user_import_batches(created_at);
CREATE INDEX idx_user_import_rows_batch_id ON user_import_rows(batch_id);
CREATE INDEX idx_user_import_rows_status ON user_import_rows(status);
CREATE INDEX idx_user_import_rows_conflict_type ON user_import_rows(conflict_type);

COMMENT ON TABLE user_import_batches IS '用户导入批次表';
COMMENT ON TABLE user_import_rows IS '用户导入行记录表';
