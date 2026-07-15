CREATE TABLE IF NOT EXISTS contract_references (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			contract_id UUID NOT NULL, ref_type VARCHAR(30) NOT NULL,
			ref_id UUID NOT NULL, ref_no VARCHAR(100),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_cr_contract ON contract_references(contract_id);
		CREATE INDEX IF NOT EXISTS idx_cr_type_ref ON contract_references(ref_type, ref_id);