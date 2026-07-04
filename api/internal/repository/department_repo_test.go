package repository

import (
	"testing"
)

func TestNewDepartmentRepository(t *testing.T) {
	repo := NewDepartmentRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
