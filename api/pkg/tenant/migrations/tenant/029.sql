CREATE TABLE IF NOT EXISTS contract_attachments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			contract_id UUID NOT NULL, file_name VARCHAR(255) NOT NULL, file_type VARCHAR(100),
			file_size BIGINT, file_url TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_ca_contract ON contract_attachments(contract_id);
		CREATE TABLE IF NOT EXISTS service_orders (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			order_no VARCHAR(100) NOT NULL, contract_id UUID, customer_id UUID NOT NULL,
			order_type VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'pending',
			description TEXT, amount NUMERIC(15,2) DEFAULT 0, technician_id UUID,
			signed_at TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_so_enterprise ON service_orders(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_so_customer ON service_orders(customer_id);