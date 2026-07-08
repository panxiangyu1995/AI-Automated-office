package redis

import (
	"context"
	"testing"
	"time"
)

func TestTokenBlacklist_AddAndCheck(t *testing.T) {
	client := newTestClient(t)
	bl := NewTokenBlacklist(client)
	ctx := context.Background()

	jti := "test-jti-123"
	exists, err := bl.IsBlacklisted(ctx, jti)
	if err != nil {
		t.Fatalf("IsBlacklisted failed: %v", err)
	}
	if exists {
		t.Error("token should not be blacklisted yet")
	}

	err = bl.Add(ctx, jti, 10*time.Minute)
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	exists, err = bl.IsBlacklisted(ctx, jti)
	if err != nil {
		t.Fatalf("IsBlacklisted failed: %v", err)
	}
	if !exists {
		t.Error("token should be blacklisted")
	}
}

func TestTokenBlacklist_Expiration(t *testing.T) {
	client := newTestClient(t)
	bl := NewTokenBlacklist(client)
	ctx := context.Background()

	jti := "expiring-jti"
	err := bl.Add(ctx, jti, 1*time.Second)
	if err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	exists, _ := bl.IsBlacklisted(ctx, jti)
	if !exists {
		t.Error("token should be blacklisted immediately after add")
	}

	time.Sleep(2 * time.Second)

	exists, err = bl.IsBlacklisted(ctx, jti)
	if err != nil {
		t.Fatalf("IsBlacklisted failed: %v", err)
	}
	if exists {
		t.Error("token should have expired from blacklist")
	}
}

func TestTokenBlacklist_NilClient(t *testing.T) {
	bl := NewTokenBlacklist(nil)
	ctx := context.Background()

	err := bl.Add(ctx, "jti", time.Minute)
	if err == nil {
		t.Error("expected error with nil client")
	}

	exists, err := bl.IsBlacklisted(ctx, "jti")
	if err == nil {
		t.Error("IsBlacklisted with nil client should return error (fail-closed)")
	}
	if exists {
		t.Error("should return false with nil client")
	}
}
