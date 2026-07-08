package redis

import (
	"context"
	"testing"
	"time"
)

func TestCache_SetGetDelete(t *testing.T) {
	client := newTestClient(t)
	cache := NewCache(client)
	ctx := context.Background()

	val, err := cache.Get(ctx, "cache:test")
	if err != nil {
		t.Fatalf("Get on missing key should not error: %v", err)
	}
	if val != "" {
		t.Errorf("expected empty string for missing key, got '%s'", val)
	}

	err = cache.Set(ctx, "cache:test", "hello", 10*time.Minute)
	if err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	val, err = cache.Get(ctx, "cache:test")
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if val != "hello" {
		t.Errorf("expected 'hello', got '%s'", val)
	}

	err = cache.Delete(ctx, "cache:test")
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	val, _ = cache.Get(ctx, "cache:test")
	if val != "" {
		t.Errorf("expected empty after delete, got '%s'", val)
	}
}

func TestCache_Exists(t *testing.T) {
	client := newTestClient(t)
	cache := NewCache(client)
	ctx := context.Background()

	exists, err := cache.Exists(ctx, "cache:exists")
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if exists {
		t.Error("should not exist")
	}

	cache.Set(ctx, "cache:exists", "1", 10*time.Minute)

	exists, err = cache.Exists(ctx, "cache:exists")
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if !exists {
		t.Error("should exist after set")
	}
}

func TestCache_Expiration(t *testing.T) {
	client := newTestClient(t)
	cache := NewCache(client)
	ctx := context.Background()

	err := cache.Set(ctx, "cache:exp", "temp", 1*time.Second)
	if err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	val, _ := cache.Get(ctx, "cache:exp")
	if val != "temp" {
		t.Errorf("expected 'temp', got '%s'", val)
	}

	time.Sleep(2 * time.Second)

	val, _ = cache.Get(ctx, "cache:exp")
	if val != "" {
		t.Errorf("expected empty after expiration, got '%s'", val)
	}
}

func TestCache_NilClient(t *testing.T) {
	cache := NewCache(nil)
	ctx := context.Background()

	_, err := cache.Get(ctx, "key")
	if err == nil {
		t.Error("expected error with nil client")
	}

	err = cache.Set(ctx, "key", "val", time.Minute)
	if err == nil {
		t.Error("expected error with nil client")
	}

	err = cache.Delete(ctx, "key")
	if err == nil {
		t.Error("expected error with nil client")
	}

	exists, err := cache.Exists(ctx, "key")
	if err == nil {
		t.Error("Exists with nil client should return error")
	}
	if exists {
		t.Error("should return false with nil client")
	}
}
