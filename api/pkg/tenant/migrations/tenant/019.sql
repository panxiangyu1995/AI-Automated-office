CREATE TABLE IF NOT EXISTS suppliers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL, contact_name VARCHAR(100), contact_phone VARCHAR(50),
			contact_email VARCHAR(255), address TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_suppliers_enterprise ON suppliers(enterprise_id);