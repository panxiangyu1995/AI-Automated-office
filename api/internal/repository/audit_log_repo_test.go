package repository

import (
	"testing"
)

func TestNewAuditLogRepository(t *testing.T) {
	repo := NewAuditLogRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
