package repository

import (
	"testing"
)

func TestNewGroupRepository(t *testing.T) {
	repo := NewGroupRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
