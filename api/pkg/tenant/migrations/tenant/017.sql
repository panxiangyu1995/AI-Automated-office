CREATE TABLE IF NOT EXISTS opportunities (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			customer_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			amount NUMERIC(15,2) DEFAULT 0,
			status VARCHAR(20) NOT NULL DEFAULT '跟进中',
			expected_close_at TIMESTAMP WITH TIME ZONE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_opportunities_enterprise ON opportunities(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
		CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);