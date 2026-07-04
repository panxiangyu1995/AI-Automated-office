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
	RegisterMigration(Migration{
		Version:     "011",
		Description: "Create cross_enterprise_permissions table",
		SQL: `CREATE TABLE IF NOT EXISTS cross_enterprise_permissions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			source_enterprise_id UUID NOT NULL,
			target_enterprise_id UUID NOT NULL,
			granted_by UUID NOT NULL,
			permissions TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_cep_user ON cross_enterprise_permissions(user_id);
		CREATE INDEX IF NOT EXISTS idx_cep_source ON cross_enterprise_permissions(source_enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_cep_target ON cross_enterprise_permissions(target_enterprise_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_cep_user_target ON cross_enterprise_permissions(user_id, target_enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "012",
		Description: "Create employee_permissions table",
		SQL: `CREATE TABLE IF NOT EXISTS employee_permissions (
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
		CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_perm_employee_key ON employee_permissions(employee_id, permission);`,
	})
	RegisterMigration(Migration{
		Version:     "013",
		Description: "Create customers table",
		SQL: `CREATE TABLE IF NOT EXISTS customers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			industry VARCHAR(100),
			unified_social_credit_code VARCHAR(50),
			address TEXT,
			notes TEXT,
			level VARCHAR(30) NOT NULL DEFAULT '普通',
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_customers_enterprise ON customers(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
		CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(level);`,
	})
	RegisterMigration(Migration{
		Version:     "014",
		Description: "Create customer_levels table",
		SQL: `CREATE TABLE IF NOT EXISTS customer_levels (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			name VARCHAR(50) NOT NULL,
			description VARCHAR(255),
			min_amount NUMERIC(15,2) DEFAULT 0,
			color VARCHAR(20),
			sort_order INT DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_customer_levels_enterprise ON customer_levels(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version:     "015",
		Description: "Create customer_tags table",
		SQL: `CREATE TABLE IF NOT EXISTS customer_tags (
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
		CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_tags_customer_tag ON customer_tags(customer_id, tag);`,
	})
	RegisterMigration(Migration{
		Version:     "016",
		Description: "Create contacts table",
		SQL: `CREATE TABLE IF NOT EXISTS contacts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			customer_id UUID NOT NULL,
			name VARCHAR(100) NOT NULL,
			position VARCHAR(100),
			phone VARCHAR(50),
			email VARCHAR(255),
			role VARCHAR(50),
			is_primary BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_contacts_enterprise ON contacts(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id);
		CREATE INDEX IF NOT EXISTS idx_contacts_role ON contacts(role);`,
	})
	RegisterMigration(Migration{
		Version:     "017",
		Description: "Create opportunities table",
		SQL: `CREATE TABLE IF NOT EXISTS opportunities (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			enterprise_id UUID NOT NULL,
			customer_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL,
			amount NUMERIC(15,2) DEFAULT 0,
			status VARCHAR(20) NOT NULL DEFAULT '跟进中',
			expected_close_at TIMESTAMP WITH TIME ZONE,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			deleted_at TIMESTAMP WITH TIME ZONE
		);
		CREATE INDEX IF NOT EXISTS idx_opportunities_enterprise ON opportunities(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
		CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);`,
	})
	RegisterMigration(Migration{
		Version:     "018",
		Description: "Create materials table",
		SQL: `CREATE TABLE IF NOT EXISTS materials (
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
		CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);`,
	})
	RegisterMigration(Migration{
		Version: "019", Description: "Create suppliers table",
		SQL: `CREATE TABLE IF NOT EXISTS suppliers (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL, contact_name VARCHAR(100), contact_phone VARCHAR(50),
			contact_email VARCHAR(255), address TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_suppliers_enterprise ON suppliers(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version: "020", Description: "Create warehouses table",
		SQL: `CREATE TABLE IF NOT EXISTS warehouses (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			name VARCHAR(255) NOT NULL, code VARCHAR(100) NOT NULL, address TEXT,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); 		CREATE INDEX IF NOT EXISTS idx_warehouses_enterprise ON warehouses(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version: "021", Description: "Create warehouse_inventories table",
		SQL: `CREATE TABLE IF NOT EXISTS warehouse_inventories (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, material_id UUID NOT NULL,
			quantity INT NOT NULL DEFAULT 0, safety_stock INT NOT NULL DEFAULT 0, in_transit INT NOT NULL DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_wi_enterprise ON warehouse_inventories(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_wi_warehouse ON warehouse_inventories(warehouse_id);
		CREATE INDEX IF NOT EXISTS idx_wi_material ON warehouse_inventories(material_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_wi_wh_mat ON warehouse_inventories(warehouse_id, material_id);`,
	})
	RegisterMigration(Migration{
		Version: "022", Description: "Create stock_flows table",
		SQL: `CREATE TABLE IF NOT EXISTS stock_flows (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, material_id UUID NOT NULL,
			flow_type VARCHAR(30) NOT NULL, quantity INT NOT NULL,
			batch_no VARCHAR(100), before_qty INT, after_qty INT,
			reference_id UUID, reference_type VARCHAR(50), flow_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_sf_enterprise ON stock_flows(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_sf_warehouse ON stock_flows(warehouse_id);
		CREATE INDEX IF NOT EXISTS idx_sf_material ON stock_flows(material_id);
		CREATE INDEX IF NOT EXISTS idx_sf_flow_time ON stock_flows(enterprise_id, flow_time DESC);`,
	})
	RegisterMigration(Migration{
		Version: "023", Description: "Create material_prices table",
		SQL: `CREATE TABLE IF NOT EXISTS material_prices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			material_id UUID NOT NULL, level VARCHAR(30) NOT NULL,
			unit_price NUMERIC(15,2) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_mp_enterprise ON material_prices(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_mp_material ON material_prices(material_id);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_mat_level ON material_prices(material_id, level);`,
	})
	RegisterMigration(Migration{
		Version: "024", Description: "Create inventory_checks and items tables",
		SQL: `CREATE TABLE IF NOT EXISTS inventory_checks (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			warehouse_id UUID NOT NULL, check_no VARCHAR(100) NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'draft', checked_by UUID, checked_at TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_ic_enterprise ON inventory_checks(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_ic_warehouse ON inventory_checks(warehouse_id);
		CREATE TABLE IF NOT EXISTS inventory_check_items (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), check_id UUID NOT NULL,
			material_id UUID NOT NULL, expected_qty INT, actual_qty INT, difference INT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS ici_check ON inventory_check_items(check_id);`,
	})
	RegisterMigration(Migration{
		Version: "025", Description: "Create purchase_orders + items",
		SQL: `CREATE TABLE IF NOT EXISTS purchase_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL, order_no VARCHAR(100) NOT NULL, supplier_id UUID NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft', total_amount NUMERIC(15,2) DEFAULT 0, order_date TIMESTAMP WITH TIME ZONE, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_po_enterprise ON purchase_orders(enterprise_id); CREATE TABLE IF NOT EXISTS purchase_order_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL, material_id UUID NOT NULL, quantity INT NOT NULL, unit_price NUMERIC(15,2), received_qty INT DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_poi_order ON purchase_order_items(order_id);`,
	})
	RegisterMigration(Migration{
		Version: "026", Description: "Create sales_orders + items",
		SQL: `CREATE TABLE IF NOT EXISTS sales_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL, order_no VARCHAR(100) NOT NULL, customer_id UUID NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft', total_amount NUMERIC(15,2) DEFAULT 0, order_date TIMESTAMP WITH TIME ZONE, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_so_enterprise ON sales_orders(enterprise_id); CREATE TABLE IF NOT EXISTS sales_order_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL, material_id UUID NOT NULL, quantity INT NOT NULL, unit_price NUMERIC(15,2), shipped_qty INT DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_soi_order ON sales_order_items(order_id);`,
	})
	RegisterMigration(Migration{
		Version: "027", Description: "Create transfer_orders + requisitions",
		SQL: `CREATE TABLE IF NOT EXISTS transfer_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL, order_no VARCHAR(100) NOT NULL, source_wh_id UUID NOT NULL, target_wh_id UUID NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft', material_id UUID NOT NULL, quantity INT NOT NULL, received_qty INT DEFAULT 0, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_to_enterprise ON transfer_orders(enterprise_id); CREATE TABLE IF NOT EXISTS requisitions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL, requisition_no VARCHAR(100) NOT NULL, applicant_id UUID NOT NULL, warehouse_id UUID NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', material_id UUID NOT NULL, quantity INT NOT NULL, issued_qty INT DEFAULT 0, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE); CREATE INDEX IF NOT EXISTS idx_req_enterprise ON requisitions(enterprise_id);`,
	})
	RegisterMigration(Migration{
		Version: "028", Description: "Create contracts table",
		SQL: `CREATE TABLE IF NOT EXISTS contracts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			contract_no VARCHAR(100) NOT NULL, customer_id UUID NOT NULL, name VARCHAR(255) NOT NULL,
			amount NUMERIC(15,2) DEFAULT 0, status VARCHAR(30) NOT NULL DEFAULT 'draft',
			signed_at TIMESTAMP WITH TIME ZONE, effective_at TIMESTAMP WITH TIME ZONE, expire_at TIMESTAMP WITH TIME ZONE,
			content TEXT, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_contracts_enterprise ON contracts(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
		CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);`,
	})
	RegisterMigration(Migration{
		Version: "029", Description: "Create contract_attachments + service_orders",
		SQL: `CREATE TABLE IF NOT EXISTS contract_attachments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			contract_id UUID NOT NULL, file_name VARCHAR(255) NOT NULL, file_type VARCHAR(100),
			file_size BIGINT, file_url TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_ca_contract ON contract_attachments(contract_id);
		CREATE TABLE IF NOT EXISTS service_orders (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), enterprise_id UUID NOT NULL,
			order_no VARCHAR(100) NOT NULL, contract_id UUID, customer_id UUID NOT NULL,
			order_type VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'pending',
			description TEXT, amount NUMERIC(15,2) DEFAULT 0, technician_id UUID,
			signed_at TIMESTAMP WITH TIME ZONE, notes TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), deleted_at TIMESTAMP WITH TIME ZONE
		); CREATE INDEX IF NOT EXISTS idx_so_enterprise ON service_orders(enterprise_id);
		CREATE INDEX IF NOT EXISTS idx_so_customer ON service_orders(customer_id);`,
	})
}
