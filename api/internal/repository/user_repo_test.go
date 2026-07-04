package repository

import (
	"testing"
)

func TestNewUserRepository(t *testing.T) {
	repo := NewUserRepository(nil)
	if repo == nil {
		t.Fatal("expected non-nil repository")
	}
}
