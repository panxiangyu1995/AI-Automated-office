CREATE TABLE IF NOT EXISTS customer_levels (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(50) NOT NULL,
			description VARCHAR(255),
			min_amount NUMERIC(15,2) DEFAULT 0,
			color VARCHAR(20),
			sort_order INT DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_customer_levels_enterprise ON customer_levels(enterprise_id);