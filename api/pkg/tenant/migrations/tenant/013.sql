CREATE TABLE IF NOT EXISTS customers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			industry VARCHAR(100),
			unified_social_credit_code VARCHAR(50),
			address TEXT,
			notes TEXT,
			level VARCHAR(30) NOT NULL DEFAULT '普通',
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_customers_enterprise ON customers(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
		CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(level);