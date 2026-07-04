package repository

import (
	"testing"
)

func TestNewEmployeeRepository(t *testing.T) {
	repo := NewEmployeeRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
