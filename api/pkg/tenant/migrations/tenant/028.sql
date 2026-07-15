CREATE TABLE IF NOT EXISTS contracts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			contract_no VARCHAR(100) NOT NULL, customer_id UUID NOT NULL, name VARCHAR(255) NOT NULL,
			amount NUMERIC(15,2) DEFAULT 0, paid_amount NUMERIC(15,2) DEFAULT 0, status VARCHAR(30) NOT NULL DEFAULT 'draft',
			signed_at TIMESTAMP WITH TIME ZONE, effective_at TIMESTAMP WITH TIME ZONE, expire_at TIMESTAMP WITH TIME ZONE,
			content TEXT, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_contracts_enterprise ON contracts(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
		CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);