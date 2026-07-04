package ratelimit

import (
	"sync"
	"time"
)

type windowEntry struct {
	count       int
	windowStart time.Time
}

type RateLimiter struct {
	mu       sync.RWMutex
	windows  map[string]*windowEntry
	limits   map[string]int
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		windows: make(map[string]*windowEntry),
		limits:  make(map[string]int),
	}
}

func (rl *RateLimiter) SetLimit(key string, limit int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.limits[key] = limit
}

func (rl *RateLimiter) GetLimit(key string) int {
	rl.mu.RLock()
	defer rl.mu.RUnlock()
	if limit, ok := rl.limits[key]; ok {
		return limit
	}
	return 0
}

func (rl *RateLimiter) Allow(key string) (bool, int, int) {
	return rl.AllowN(key, 1)
}

func (rl *RateLimiter) AllowN(key string, n int) (bool, int, int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limit, hasLimit := rl.limits[key]
	if !hasLimit {
		return true, 0, 0
	}

	now := time.Now()
	entry, exists := rl.windows[key]
	if !exists {
		entry = &windowEntry{windowStart: now}
		rl.windows[key] = entry
	}

	if now.Sub(entry.windowStart) >= time.Second {
		entry.count = 0
		entry.windowStart = now
	}

	if entry.count+n > limit {
		remaining := limit - entry.count
		if remaining < 0 {
			remaining = 0
		}
		reset := int(time.Second - now.Sub(entry.windowStart))
		if reset < 0 {
			reset = 0
		}
		return false, remaining, reset
	}

	entry.count += n
	remaining := limit - entry.count
	reset := int(time.Second - now.Sub(entry.windowStart))
	if reset < 0 {
		reset = 0
	}
	return true, remaining, reset
}

func (rl *RateLimiter) Reset(key string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.windows, key)
}

func (rl *RateLimiter) Cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	for key, entry := range rl.windows {
		if now.Sub(entry.windowStart) > 2*time.Second {
			delete(rl.windows, key)
		}
	}
}
