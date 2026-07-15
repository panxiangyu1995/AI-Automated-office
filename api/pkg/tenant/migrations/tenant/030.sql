CREATE TABLE IF NOT EXISTS payment_records (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			transaction_no VARCHAR(100) NOT NULL, customer_id UUID, contract_id UUID,
			amount NUMERIC(15,2) NOT NULL, payment_method VARCHAR(50), status VARCHAR(20) NOT NULL DEFAULT 'pending',
			paid_at TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_pr_enterprise ON payment_records(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_pr_customer ON payment_records(customer_id);
		CREATE TABLE IF NOT EXISTS expense_records (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			expense_no VARCHAR(100) NOT NULL, amount NUMERIC(15,2) NOT NULL,
			category VARCHAR(50), status VARCHAR(20) NOT NULL DEFAULT 'pending',
			submitted_by UUID, approved_by UUID, description TEXT, expense_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_er_enterprise ON expense_records(enterprise_id);
		CREATE TABLE IF NOT EXISTS invoices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			invoice_no VARCHAR(100) NOT NULL, customer_id UUID,
			amount NUMERIC(15,2) NOT NULL, tax_amount NUMERIC(15,2) DEFAULT 0,
			status VARCHAR(20) NOT NULL DEFAULT 'draft',
			invoice_date TIMESTAMP WITH TIME ZONE, due_date TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_inv_enterprise ON invoices(enterprise_id);