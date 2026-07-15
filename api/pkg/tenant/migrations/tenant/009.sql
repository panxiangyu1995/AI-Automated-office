CREATE TABLE IF NOT EXISTS employees (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			department_id UUID NOT NULL,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(255),
			phone VARCHAR(50),
			position VARCHAR(100),
			employee_no VARCHAR(100),
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			hire_date TIMESTAMP WITH TIME ZONE,
			resign_date TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_employees_enterprise ON employees(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
		CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);