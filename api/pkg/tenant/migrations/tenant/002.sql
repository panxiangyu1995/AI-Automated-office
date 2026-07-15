CREATE TABLE IF NOT EXISTS audit_logs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			user_id UUID NOT NULL,
			action VARCHAR(50) NOT NULL,
			resource_type VARCHAR(50) NOT NULL,
			resource_id VARCHAR(100),
			details TEXT,
			ip_address VARCHAR(45),
			user_agent VARCHAR(500),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_audit_logs_enterprise ON audit_logs(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
		CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
		CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
		CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(enterprise_id, created_at DESC);