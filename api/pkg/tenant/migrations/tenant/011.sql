CREATE TABLE IF NOT EXISTS cross_enterprise_permissions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			source_enterprise_id UUID NOT NULL,
			target_enterprise_id UUID NOT NULL,
			granted_by UUID NOT NULL,
			permissions TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_cep_user ON cross_enterprise_permissions(user_id);
		CREATE INDEX IF NOT EXISTS idx_cep_source ON cross_enterprise_permissions(source_enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_cep_target ON cross_enterprise_permissions(target_enterprise_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_cep_user_target ON cross_enterprise_permissions(user_id, target_enterprise_id);