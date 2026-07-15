package tenant

import (
	"testing"
)

func TestRegisterAndListMigrations(t *testing.T) {
	tenantMigrations = nil

	RegisterMigration(Migration{
		Version:     "001",
		Description: "create enterprises table",
	})
	RegisterMigration(Migration{
		Version:     "002",
		Description: "create departments table",
	})

	if len(tenantMigrations) != 2 {
		t.Errorf("expected 2 migrations, got %d", len(tenantMigrations))
	}

	if tenantMigrations[0].Version != "001" {
		t.Errorf("expected version 001, got %s", tenantMigrations[0].Version)
	}
}

func TestStringTrimPrefix(t *testing.T) {
	result := stringsTrimPrefix("tenant_abc123", "tenant_")
	if result != "abc123" {
		t.Errorf("expected abc123, got %s", result)
	}

	result = stringsTrimPrefix("no_prefix", "tenant_")
	if result != "no_prefix" {
		t.Errorf("expected no_prefix, got %s", result)
	}
}

func TestStringTrimPrefix_Empty(t *testing.T) {
	result := stringsTrimPrefix("", "prefix")
	if result != "" {
		t.Errorf("expected empty string, got %s", result)
	}
}

func TestDefaultMigrationRegistered(t *testing.T) {
	if len(tenantMigrations) == 0 {
		t.Error("expected at least one migration registered by init()")
	}
}

func TestMigrationVersion(t *testing.T) {
	tenantMigrations = nil
	RegisterMigration(Migration{Version: "001", Description: "test"})

	if tenantMigrations[0].Version != "001" {
		t.Errorf("expected version 001, got %s", tenantMigrations[0].Version)
	}
	if tenantMigrations[0].Description != "test" {
		t.Errorf("expected description 'test', got %s", tenantMigrations[0].Description)
	}
}

func TestLoadMigrationSQL(t *testing.T) {
	sql, err := LoadMigrationSQL("001")
	if err != nil {
		t.Fatalf("failed to load migration 001: %v", err)
	}
	if sql == "" {
		t.Error("expected non-empty SQL for migration 001")
	}
}

func TestLoadMigrationSQL_NotFound(t *testing.T) {
	_, err := LoadMigrationSQL("999")
	if err == nil {
		t.Error("expected error for non-existent migration file")
	}
}
