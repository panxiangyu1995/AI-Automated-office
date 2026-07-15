CREATE TABLE IF NOT EXISTS employee_permissions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			employee_id UUID NOT NULL,
			permission VARCHAR(100) NOT NULL,
			granted_by UUID NOT NULL,
			effect VARCHAR(10) NOT NULL DEFAULT 'allow',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_emp_perm_employee ON employee_permissions(employee_id);
		CREATE INDEX IF NOT EXISTS idx_emp_perm_enterprise ON employee_permissions(enterprise_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_perm_employee_key ON employee_permissions(employee_id, permission);