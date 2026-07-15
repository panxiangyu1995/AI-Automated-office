CREATE TABLE IF NOT EXISTS warehouses (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL, code VARCHAR(100) NOT NULL, address TEXT,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); 		CREATE INDEX IF NOT EXISTS idx_warehouses_enterprise ON warehouses(enterprise_id);