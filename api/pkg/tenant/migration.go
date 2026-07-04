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
}
