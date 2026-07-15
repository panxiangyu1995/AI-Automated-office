package tenant

import (
	"testing"
)

func TestSchemaName_ValidUUID(t *testing.T) {
	input := "550e8400-e29b-41d4-a716-446655440000"
	expected := "tenant_550e8400_e29b_41d4_a716_446655440000"
	got, err := SchemaName(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != expected {
		t.Errorf("SchemaName(%q) = %q, want %q", input, got, expected)
	}
}

func TestSchemaName_InvalidInput(t *testing.T) {
	invalidInputs := []string{
		"not-a-uuid",
		"simple-id",
		"",
		"12345",
		"../../etc/passwd",
		"DROP TABLE users;",
	}
	for _, input := range invalidInputs {
		_, err := SchemaName(input)
		if err == nil {
			t.Errorf("SchemaName(%q) should return error for invalid UUID, got nil", input)
		}
	}
}

func TestGetDB_Nil(t *testing.T) {
	GlobalDB = nil
	db := GetDB("test-enterprise")
	if db != nil {
		t.Error("expected nil db when GlobalDB is nil")
	}
}

func TestGetDB_EmptyEnterpriseID(t *testing.T) {
	GlobalDB = nil
	db := GetDB("")
	if db != nil {
		t.Error("expected nil db when GlobalDB is nil")
	}
}

func TestInitGlobalDB(t *testing.T) {
	GlobalDB = nil
	InitGlobalDB(nil)
	if GlobalDB != nil {
		t.Error("GlobalDB should remain nil after InitGlobalDB(nil)")
	}
}
