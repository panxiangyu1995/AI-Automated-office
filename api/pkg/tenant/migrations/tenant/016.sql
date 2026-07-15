CREATE TABLE IF NOT EXISTS contacts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			customer_id UUID NOT NULL,
			name VARCHAR(100) NOT NULL,
			position VARCHAR(100),
			phone VARCHAR(50),
			email VARCHAR(255),
			role VARCHAR(50),
			is_primary BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_contacts_enterprise ON contacts(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id);
		CREATE INDEX IF NOT EXISTS idx_contacts_role ON contacts(role);