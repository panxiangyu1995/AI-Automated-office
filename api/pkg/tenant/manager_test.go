package tenant

import (
	"testing"
)

func TestSchemaName(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"550e8400-e29b-41d4-a716-446655440000", "tenant_550e8400_e29b_41d4_a716_446655440000"},
		{"simple-id", "tenant_simple_id"},
		{"", "tenant_"},
	}

	for _, tt := range tests {
		got := SchemaName(tt.input)
		if got != tt.expected {
			t.Errorf("SchemaName(%q) = %q, want %q", tt.input, got, tt.expected)
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
