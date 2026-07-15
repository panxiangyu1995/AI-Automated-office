CREATE TABLE IF NOT EXISTS api_quotas (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL UNIQUE,
			daily_limit INT NOT NULL DEFAULT 10000,
			monthly_limit INT NOT NULL DEFAULT 300000,
			daily_used INT NOT NULL DEFAULT 0,
			monthly_used INT NOT NULL DEFAULT 0,
			daily_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			monthly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_api_quotas_enterprise ON api_quotas(enterprise_id);