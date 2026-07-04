package ratelimit

import (
	"testing"
	"time"
)

func TestAllow_NoLimit(t *testing.T) {
	rl := NewRateLimiter()
	allowed, _, _ := rl.Allow("test")
	if !allowed {
		t.Error("expected allowed when no limit set")
	}
}

func TestAllow_WithinLimit(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("test", 5)

	for i := 0; i < 5; i++ {
		allowed, remaining, _ := rl.Allow("test")
		if !allowed {
			t.Errorf("request %d should be allowed", i+1)
		}
		if remaining != 5-(i+1) {
			t.Errorf("request %d: expected remaining %d, got %d", i+1, 5-(i+1), remaining)
		}
	}
}

func TestAllow_ExceedsLimit(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("test", 3)

	for i := 0; i < 3; i++ {
		rl.Allow("test")
	}

	allowed, remaining, _ := rl.Allow("test")
	if allowed {
		t.Error("expected denied after limit exceeded")
	}
	if remaining != 0 {
		t.Errorf("expected remaining 0, got %d", remaining)
	}
}

func TestAllow_WindowReset(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("time_test", 2)

	rl.Allow("time_test")
	rl.Allow("time_test")

	allowed, _, _ := rl.Allow("time_test")
	if allowed {
		t.Error("expected denied after limit")
	}

	entry := rl.windows["time_test"]
	entry.windowStart = time.Now().Add(-2 * time.Second)

	allowed, remaining, _ := rl.Allow("time_test")
	if !allowed {
		t.Error("expected allowed after window reset")
	}
	if remaining != 1 {
		t.Errorf("expected remaining 1 after reset, got %d", remaining)
	}
}

func TestAllowN_Multiple(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("batch", 10)

	allowed, remaining, _ := rl.AllowN("batch", 8)
	if !allowed {
		t.Error("expected allowed for 8 within limit of 10")
	}
	if remaining != 2 {
		t.Errorf("expected remaining 2, got %d", remaining)
	}

	allowed, _, _ = rl.AllowN("batch", 5)
	if allowed {
		t.Error("expected denied for 5 with only 2 remaining")
	}
}

func TestReset(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("reset_test", 2)
	rl.Allow("reset_test")
	rl.Allow("reset_test")

	rl.Reset("reset_test")

	allowed, _, _ := rl.Allow("reset_test")
	if !allowed {
		t.Error("expected allowed after reset")
	}
}

func TestGetLimit(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("test", 100)

	limit := rl.GetLimit("test")
	if limit != 100 {
		t.Errorf("expected limit 100, got %d", limit)
	}

	limit = rl.GetLimit("nonexistent")
	if limit != 0 {
		t.Errorf("expected limit 0 for nonexistent key, got %d", limit)
	}
}

func TestCleanup(t *testing.T) {
	rl := NewRateLimiter()
	rl.SetLimit("clean", 5)
	rl.Allow("clean")

	entry := rl.windows["clean"]
	entry.windowStart = time.Now().Add(-10 * time.Second)

	rl.Cleanup()

	_, exists := rl.windows["clean"]
	if exists {
		t.Error("expected old entry to be cleaned up")
	}
}
