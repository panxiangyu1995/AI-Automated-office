CREATE TABLE IF NOT EXISTS feature_flags (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			feature_key VARCHAR(100) NOT NULL,
			enabled BOOLEAN NOT NULL DEFAULT true,
			label VARCHAR(200),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_enterprise_key ON feature_flags(enterprise_id, feature_key);
		CREATE INDEX IF NOT EXISTS idx_feature_flags_enterprise ON feature_flags(enterprise_id);