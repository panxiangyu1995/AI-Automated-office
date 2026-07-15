CREATE TABLE IF NOT EXISTS backup_records (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			config_id UUID,
			status VARCHAR(20) NOT NULL DEFAULT 'pending',
			file_path VARCHAR(500),
			file_size BIGINT DEFAULT 0,
			error_message TEXT,
			started_at TIMESTAMP WITH TIME ZONE,
			completed_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_backup_records_enterprise ON backup_records(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_backup_records_config ON backup_records(config_id);
		CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);