package repository

import (
	"testing"
)

func TestNewPositionRepository(t *testing.T) {
	repo := NewPositionRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
