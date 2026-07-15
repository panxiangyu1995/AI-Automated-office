CREATE TABLE IF NOT EXISTS inventory_checks (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, check_no VARCHAR(100) NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'draft', checked_by UUID, checked_at TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_ic_enterprise ON inventory_checks(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_ic_warehouse ON inventory_checks(warehouse_id);
		CREATE TABLE IF NOT EXISTS inventory_check_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), check_id UUID NOT NULL,
			material_id UUID NOT NULL, expected_qty INT, actual_qty INT, difference INT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS ici_check ON inventory_check_items(check_id);