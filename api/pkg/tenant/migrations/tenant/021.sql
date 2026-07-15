CREATE TABLE IF NOT EXISTS warehouse_inventories (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, material_id UUID NOT NULL,
			quantity INT NOT NULL DEFAULT 0, safety_stock INT NOT NULL DEFAULT 0, in_transit INT NOT NULL DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_wi_enterprise ON warehouse_inventories(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_wi_warehouse ON warehouse_inventories(warehouse_id);
		CREATE INDEX IF NOT EXISTS idx_wi_material ON warehouse_inventories(material_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_wi_wh_mat ON warehouse_inventories(warehouse_id, material_id);