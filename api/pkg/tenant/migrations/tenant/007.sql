CREATE TABLE IF NOT EXISTS rate_limit_configs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL UNIQUE,
			enterprise_qps INT NOT NULL DEFAULT 1000,
			ip_qps INT NOT NULL DEFAULT 100,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_enterprise ON rate_limit_configs(enterprise_id);