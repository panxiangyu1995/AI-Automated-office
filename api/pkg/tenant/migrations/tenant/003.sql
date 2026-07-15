CREATE TABLE IF NOT EXISTS backup_configs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			backup_time VARCHAR(5) NOT NULL,
			backup_directory VARCHAR(500) NOT NULL DEFAULT '/var/backups',
			retention_days INT NOT NULL DEFAULT 30,
			enabled BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_backup_configs_enterprise ON backup_configs(enterprise_id);