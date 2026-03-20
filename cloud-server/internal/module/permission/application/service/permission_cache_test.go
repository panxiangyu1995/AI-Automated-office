package service

import (
	"testing"
	"time"

	"cloud-server/internal/model"
)

func TestPermissionCache_NewPermissionCache(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	if cache == nil {
		t.Fatal("NewPermissionCache returned nil")
	}
	if cache.items == nil {
		t.Error("items map should not be nil")
	}
	defer cache.Stop()
}

func TestPermissionCache_SetAndGet(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	defer cache.Stop()

	ps := model.NewPermissionSet()
	ps.Add(&model.Permission{
		ID:       "perm-1",
		Code:     "auth_profile_read",
		Resource: "auth.profile",
		Action:   model.PermActionRead,
		Layer:    model.LayerBase,
	})

	// Test Set
	cache.Set("user-1", ps)

	// Test Get
	result, ok := cache.Get("user-1")
	if !ok {
		t.Error("Should find cached item")
	}
	if result.Count() != 1 {
		t.Errorf("Expected 1 permission, got %d", result.Count())
	}
}

func TestPermissionCache_GetNonExistent(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	defer cache.Stop()

	_, ok := cache.Get("non-existent")
	if ok {
		t.Error("Should not find non-existent item")
	}
}

func TestPermissionCache_Delete(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	defer cache.Stop()

	ps := model.NewPermissionSet()
	cache.Set("user-1", ps)

	cache.Delete("user-1")

	_, ok := cache.Get("user-1")
	if ok {
		t.Error("Should not find deleted item")
	}
}

func TestPermissionCache_Clear(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	defer cache.Stop()

	ps := model.NewPermissionSet()
	cache.Set("user-1", ps)
	cache.Set("user-2", ps)

	cache.Clear()

	if len(cache.items) != 0 {
		t.Errorf("Cache should be empty after Clear, got %d items", len(cache.items))
	}
}

func TestPermissionCache_Expiration(t *testing.T) {
	// Create cache with very short TTL
	cache := NewPermissionCache(100 * time.Millisecond)
	defer cache.Stop()

	ps := model.NewPermissionSet()
	cache.Set("user-1", ps)

	// Should be present immediately
	_, ok := cache.Get("user-1")
	if !ok {
		t.Error("Should find cached item immediately")
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Should be expired
	_, ok = cache.Get("user-1")
	if ok {
		t.Error("Item should be expired")
	}
}

func TestPermissionCache_ConcurrentAccess(t *testing.T) {
	cache := NewPermissionCache(5 * time.Minute)
	defer cache.Stop()

	done := make(chan bool)

	// Writer goroutine
	go func() {
		for i := 0; i < 100; i++ {
			ps := model.NewPermissionSet()
			cache.Set("user-1", ps)
		}
		done <- true
	}()

	// Reader goroutine
	go func() {
		for i := 0; i < 100; i++ {
			cache.Get("user-1")
		}
		done <- true
	}()

	// Deleter goroutine
	go func() {
		for i := 0; i < 100; i++ {
			cache.Delete("user-1")
		}
		done <- true
	}()

	// Wait for all goroutines
	<-done
	<-done
	<-done
}
