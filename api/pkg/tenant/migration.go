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
	schema, err := SchemaName(enterpriseID)
	if err != nil {
		return fmt.Errorf("invalid enterprise ID: %w", err)
	}

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

		sql := m.SQL
		if sql == "" {
			sql, err = LoadMigrationSQL(m.Version)
			if err != nil {
				return fmt.Errorf("migration %s SQL not found: %w", m.Version, err)
			}
		}

		tx := db.Exec(fmt.Sprintf("SET search_path TO %s", schema))
		if tx.Error != nil {
			return fmt.Errorf("failed to set search_path: %w", tx.Error)
		}

		if err := tx.Exec(sql).Error; err != nil {
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
	registerMigrations()
}

func registerMigrations() {
	migrations := []struct {
		Version     string
		Description string
	}{
		{"001", "Create enterprises table"},
		{"002", "Create audit_logs table"},
		{"003", "Create backup_configs table"},
		{"004", "Create backup_records table"},
		{"005", "Create api_quotas table"},
		{"006", "Create feature_flags table"},
		{"007", "Create rate_limit_configs table"},
		{"008", "Create departments table"},
		{"009", "Create employees table"},
		{"010", "Create positions table"},
		{"011", "Create cross_enterprise_permissions table"},
		{"012", "Create employee_permissions table"},
		{"013", "Create customers table"},
		{"014", "Create customer_levels table"},
		{"015", "Create customer_tags table"},
		{"016", "Create contacts table"},
		{"017", "Create opportunities table"},
		{"018", "Create materials table"},
		{"019", "Create suppliers table"},
		{"020", "Create warehouses table"},
		{"021", "Create warehouse_inventories table"},
		{"022", "Create stock_flows table"},
		{"023", "Create material_prices table"},
		{"024", "Create inventory_checks and items tables"},
		{"025", "Create purchase_orders + items"},
		{"026", "Create sales_orders + items"},
		{"027", "Create transfer_orders + requisitions"},
		{"028", "Create contracts table"},
		{"029", "Create contract_attachments + service_orders"},
		{"030", "Create finance tables"},
		{"031", "Create files, messages, knowledge tables"},
		{"032", "Create operations tables"},
		{"033", "Create contract_references table"},
		{"034", "Create skills service_tickets announcements usage_bills service_configs tables"},
		{"035", "Add paid_amount to contracts"},
		{"036", "Add role to employees"},
		{"037", "Add missing columns to messages table"},
		{"038", "Add missing columns to audit_logs table"},
		{"039", "Add missing columns to enterprises table"},
		{"040", "Create missing tenant tables - part 1 (workflow, skills, chat)"},
		{"041", "Create missing tenant tables - part 2 (service, export, knowledge, finance extras)"},
		{"042", "Create missing tenant tables - part 3 (knowledge vector, file metadata, RBAC extras)"},
		{"043", "Create receivables and payables tables"},
		{"044", "Create quality inspection tables"},
		{"045", "Create billing records and payment gateway configs tables, add subscription plan fields"},
		{"046", "Create industry_templates, enterprise_skill_matrix, claude_md_templates; add knowledge versioning columns"},
	}
	for _, m := range migrations {
		RegisterMigration(Migration{
			Version:     m.Version,
			Description: m.Description,
		})
	}
}
