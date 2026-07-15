CREATE TABLE IF NOT EXISTS material_prices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			material_id UUID NOT NULL, level VARCHAR(30) NOT NULL,
			unit_price NUMERIC(15,2) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_mp_enterprise ON material_prices(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_mp_material ON material_prices(material_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_mat_level ON material_prices(material_id, level);