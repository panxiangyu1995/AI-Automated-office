package tenant

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

type Migration struct {
	Version     string
	Description string
	SQL         string
}

var tenantMigrations []Migration

func RegisterMigration(m Migration) {
	tenantMigrations = append(tenantMigrations, m)
}

func RunMigrations(db *gorm.DB, enterpriseID string) error {
	schema := SchemaName(enterpriseID)

	if err := ensureMigrationTable(db, schema); err != nil {
		return fmt.Errorf("failed to ensure migration table: %w", err)
	}

	for _, m := range tenantMigrations {
		applied, err := isMigrationApplied(db, schema, m.Version)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		tx := db.Exec(fmt.Sprintf("SET search_path TO %s", schema))
		if tx.Error != nil {
			return fmt.Errorf("failed to set search_path: %w", tx.Error)
		}

		if err := tx.Exec(m.SQL).Error; err != nil {
			return fmt.Errorf("migration %s failed: %w", m.Version, err)
		}

		if err := recordMigration(db, schema, m.Version, m.Description); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", m.Version, err)
		}

		log.Printf("[tenant] migration %s applied to %s", m.Version, schema)
	}

	return nil
}

func RunAllMigrations(db *gorm.DB) error {
	schemas, err := ListSchemas(db)
	if err != nil {
		return err
	}

	for _, schema := range schemas {
		enterpriseID := stringsTrimPrefix(schema, SchemaPrefix)
		if err := RunMigrations(db, enterpriseID); err != nil {
			return fmt.Errorf("migration failed for schema %s: %w", schema, err)
		}
	}

	return nil
}

func ensureMigrationTable(db *gorm.DB, schema string) error {
	sql := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s._migrations (
		version VARCHAR(64) PRIMARY KEY,
		description TEXT NOT NULL,
		applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	)`, schema)
	return db.Exec(sql).Error
}

func isMigrationApplied(db *gorm.DB, schema, version string) (bool, error) {
	var count int64
	err := db.Raw(
		fmt.Sprintf("SELECT COUNT(*) FROM %s._migrations WHERE version = ?", schema),
		version,
	).Scan(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func recordMigration(db *gorm.DB, schema, version, description string) error {
	return db.Exec(
		fmt.Sprintf("INSERT INTO %s._migrations (version, description) VALUES (?, ?)", schema),
		version, description,
	).Error
}

func stringsTrimPrefix(s, prefix string) string {
	if len(s) >= len(prefix) && s[:len(prefix)] == prefix {
		return s[len(prefix):]
	}
	return s
}

func init() {
	RegisterMigration(Migration{
		Version:     "001",
		Description: "Create enterprises table",
		SQL: `CREATE TABLE IF NOT EXISTS enterprises (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			code VARCHAR(100) UNIQUE NOT NULL,
			contact_email VARCHAR(255),
			contact_phone VARCHAR(50),
			address TEXT,
			status VARCHAR(20) DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		)`,
	})
	RegisterMigration(Migration{
		Version:     "002",
		Description: "Create audit_logs table",
		SQL: `CREATE TABLE IF NOT EXISTS audit_logs (
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
		CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(enterprise_id, created_at DESC);`,
	})
	RegisterMigration(Migration{
		Version:     "003",
		Description: "Create backup_configs table",
		SQL: `CREATE TABLE IF NOT EXISTS backup_configs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			backup_time VARCHAR(5) NOT NULL,
			backup_directory VARCHAR(500) NOT NULL DEFAULT '/var/backups',
			retention_days INT NOT NULL DEFAULT 30,
			enabled BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_backup_configs_enterprise ON backup_configs(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "004",
		Description: "Create backup_records table",
		SQL: `CREATE TABLE IF NOT EXISTS backup_records (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			config_id UUID,
			status VARCHAR(20) NOT NULL DEFAULT 'pending',
			file_path VARCHAR(500),
			file_size BIGINT DEFAULT 0,
			error_message TEXT,
			started_at TIMESTAMP WITH TIME ZONE,
			completed_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_backup_records_enterprise ON backup_records(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_backup_records_config ON backup_records(config_id);
		CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);`,
	})
	RegisterMigration(Migration{
		Version:     "005",
		Description: "Create api_quotas table",
		SQL: `CREATE TABLE IF NOT EXISTS api_quotas (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL UNIQUE,
			daily_limit INT NOT NULL DEFAULT 10000,
			monthly_limit INT NOT NULL DEFAULT 300000,
			daily_used INT NOT NULL DEFAULT 0,
			monthly_used INT NOT NULL DEFAULT 0,
			daily_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			monthly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_api_quotas_enterprise ON api_quotas(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "006",
		Description: "Create feature_flags table",
		SQL: `CREATE TABLE IF NOT EXISTS feature_flags (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			feature_key VARCHAR(100) NOT NULL,
			enabled BOOLEAN NOT NULL DEFAULT true,
			label VARCHAR(200),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_enterprise_key ON feature_flags(enterprise_id, feature_key);
		CREATE INDEX IF NOT EXISTS idx_feature_flags_enterprise ON feature_flags(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "007",
		Description: "Create rate_limit_configs table",
		SQL: `CREATE TABLE IF NOT EXISTS rate_limit_configs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL UNIQUE,
			enterprise_qps INT NOT NULL DEFAULT 1000,
			ip_qps INT NOT NULL DEFAULT 100,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_enterprise ON rate_limit_configs(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "008",
		Description: "Create departments table",
		SQL: `CREATE TABLE IF NOT EXISTS departments (
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
		CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);`,
	})
	RegisterMigration(Migration{
		Version:     "009",
		Description: "Create employees table",
		SQL: `CREATE TABLE IF NOT EXISTS employees (
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
		CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);`,
	})
	RegisterMigration(Migration{
		Version:     "010",
		Description: "Create positions table",
		SQL: `CREATE TABLE IF NOT EXISTS positions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			department_id UUID,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_positions_enterprise ON positions(enterprise_id);`,
	})
}
