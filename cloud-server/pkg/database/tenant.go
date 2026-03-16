package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// EnsureTenantSchema ensures the tenant schema exists in the database.
func EnsureTenantSchema(ctx context.Context, sqlDB *sql.DB, tenantID string) error {
	if sqlDB == nil {
		return fmt.Errorf("database not initialized")
	}
	if tenantID == "" {
		return fmt.Errorf("tenant id is required")
	}

	query := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", quoteIdentifier(tenantID))
	_, err := sqlDB.ExecContext(ctx, query)
	return err
}

// SetSearchPath sets the connection search_path to the tenant schema.
func SetSearchPath(ctx context.Context, sqlDB *sql.DB, tenantID string) error {
	if sqlDB == nil {
		return fmt.Errorf("database not initialized")
	}
	if tenantID == "" {
		return fmt.Errorf("tenant id is required")
	}

	query := fmt.Sprintf("SET search_path TO public, %s", quoteIdentifier(tenantID))
	_, err := sqlDB.ExecContext(ctx, query)
	return err
}

// ResetSearchPath resets the connection search_path to public.
func ResetSearchPath(ctx context.Context, sqlDB *sql.DB) error {
	if sqlDB == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := sqlDB.ExecContext(ctx, "SET search_path TO public")
	return err
}

// quoteIdentifier safely quotes a PostgreSQL identifier.
func quoteIdentifier(value string) string {
	escaped := strings.ReplaceAll(value, `"`, `""`)
	return `"` + escaped + `"`
}
