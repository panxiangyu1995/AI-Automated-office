CREATE TABLE IF NOT EXISTS stock_flows (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, material_id UUID NOT NULL,
			flow_type VARCHAR(30) NOT NULL, quantity INT NOT NULL,
			batch_no VARCHAR(100), before_qty INT, after_qty INT,
			reference_id UUID, reference_type VARCHAR(50), flow_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_sf_enterprise ON stock_flows(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_sf_warehouse ON stock_flows(warehouse_id);
		CREATE INDEX IF NOT EXISTS idx_sf_material ON stock_flows(material_id);
		CREATE INDEX IF NOT EXISTS idx_sf_flow_time ON stock_flows(enterprise_id, flow_time DESC);