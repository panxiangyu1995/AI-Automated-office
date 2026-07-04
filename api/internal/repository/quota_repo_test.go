package repository

import (
	"testing"
)

func TestNewApiQuotaRepository(t *testing.T) {
	repo := NewApiQuotaRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}

func TestNewFeatureFlagRepository(t *testing.T) {
	repo := NewFeatureFlagRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
