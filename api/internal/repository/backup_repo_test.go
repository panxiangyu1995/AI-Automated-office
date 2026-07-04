package repository

import (
	"testing"
)

func TestNewBackupConfigRepository(t *testing.T) {
	repo := NewBackupConfigRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}

func TestNewBackupRecordRepository(t *testing.T) {
	repo := NewBackupRecordRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
