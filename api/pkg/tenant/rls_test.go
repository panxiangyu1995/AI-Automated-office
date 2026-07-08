package tenant

import (
	"testing"
)

func TestRLSTableSpecDefaults(t *testing.T) {
	if len(DefaultRLSTables) == 0 {
		t.Error("DefaultRLSTables should not be empty")
	}

	seen := make(map[string]bool)
	for _, spec := range DefaultRLSTables {
		if spec.TableName == "" {
			t.Error("TableName should not be empty")
		}
		if spec.EnterpriseIDColumn == "" {
			t.Errorf("EnterpriseIDColumn should not be empty for %s", spec.TableName)
		}
		if seen[spec.TableName] {
			t.Errorf("duplicate TableName: %s", spec.TableName)
		}
		seen[spec.TableName] = true
	}
}

func TestSetEnterpriseContext_NilDB(t *testing.T) {
	err := SetEnterpriseContext(nil, "some-id")
	if err == nil {
		t.Error("expected error for nil db (fail-closed)")
	}
}

func TestSetEnterpriseContext_EmptyEnterpriseID(t *testing.T) {
	err := SetEnterpriseContext(nil, "")
	if err == nil {
		t.Error("expected error for empty enterpriseID (fail-closed)")
	}
}
