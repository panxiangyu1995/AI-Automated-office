CREATE TABLE IF NOT EXISTS departments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			parent_id UUID,
			manager_id UUID,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_departments_enterprise ON departments(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);