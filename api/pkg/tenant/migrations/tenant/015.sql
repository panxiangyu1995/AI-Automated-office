CREATE TABLE IF NOT EXISTS customer_tags (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			customer_id UUID NOT NULL,
			tag VARCHAR(50) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_customer_tags_enterprise ON customer_tags(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_tags_customer_tag ON customer_tags(customer_id, tag);