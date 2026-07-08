package redis

import (
	"context"
	"testing"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"github.com/ai-office/api/pkg/config"
)

func newTestClient(t *testing.T) *Client {
	t.Helper()
	cfg := config.RedisConfig{
		Host: "localhost",
		Port: 6379,
		DB:   1,
	}
	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Redis not available: %v", err)
	}
	t.Cleanup(func() {
		client.RDB().FlushDB(context.Background())
		client.Close()
	})
	return client
}

func TestNewClient_Connection(t *testing.T) {
	cfg := config.RedisConfig{
		Host: "localhost",
		Port: 6379,
		DB:   1,
	}
	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Redis not available: %v", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx); err != nil {
		t.Errorf("Ping failed: %v", err)
	}
}

func TestNewClient_InvalidHost(t *testing.T) {
	cfg := config.RedisConfig{
		Host: "invalid-host-that-does-not-exist",
		Port: 6379,
		DB:   0,
	}
	_, err := NewClient(cfg)
	if err == nil {
		t.Error("expected error for invalid host")
	}
}

func TestClient_RDB(t *testing.T) {
	client := newTestClient(t)
	if client.RDB() == nil {
		t.Error("RDB() should not return nil")
	}
}

func TestClient_SetGet(t *testing.T) {
	client := newTestClient(t)
	ctx := context.Background()

	err := client.RDB().Set(ctx, "test:key", "value", 10*time.Second).Err()
	if err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	val, err := client.RDB().Get(ctx, "test:key").Result()
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if val != "value" {
		t.Errorf("expected 'value', got '%s'", val)
	}
}

func TestClient_Close(t *testing.T) {
	cfg := config.RedisConfig{
		Host: "localhost",
		Port: 6379,
		DB:   1,
	}
	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Redis not available: %v", err)
	}

	if err := client.Close(); err != nil {
		t.Errorf("Close failed: %v", err)
	}
}

func TestClient_CloseNil(t *testing.T) {
	c := &Client{rdb: nil}
	if err := c.Close(); err != nil {
		t.Errorf("Close on nil rdb should not error, got: %v", err)
	}
}

func TestClient_PingAfterClose(t *testing.T) {
	cfg := config.RedisConfig{
		Host: "localhost",
		Port: 6379,
		DB:   1,
	}
	client, err := NewClient(cfg)
	if err != nil {
		t.Skipf("Redis not available: %v", err)
	}
	client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err = client.Ping(ctx)
	if err == nil {
		t.Error("expected error after close")
	}
}

var _ = goredis.NewClient
