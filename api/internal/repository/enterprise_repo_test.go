package repository

import (
	"testing"
)

func TestNewEnterpriseRepository(t *testing.T) {
	repo := NewEnterpriseRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
