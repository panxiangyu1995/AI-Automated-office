CREATE TABLE IF NOT EXISTS materials (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			sku_code VARCHAR(100) NOT NULL,
			material_type VARCHAR(50) NOT NULL,
			spec TEXT,
			unit VARCHAR(20) NOT NULL,
			unit_price NUMERIC(15,2) DEFAULT 0,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_materials_enterprise ON materials(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku_code);
		CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);