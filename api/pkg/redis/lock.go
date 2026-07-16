package redis

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type DistributedLock struct {
	client   *Client
	key      string
	value    string
	ttl      time.Duration
	retries  int
	interval time.Duration
}

func NewDistributedLock(client *Client, key string, ttl time.Duration, retries int, interval time.Duration) *DistributedLock {
	b := make([]byte, 16)
	rand.Read(b)
	return &DistributedLock{
		client:   client,
		key:      key,
		value:    hex.EncodeToString(b),
		ttl:      ttl,
		retries:  retries,
		interval: interval,
	}
}

var unlockScript = goredis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
else
	return 0
end
`)

func (l *DistributedLock) Acquire(ctx context.Context) bool {
	if l.client == nil || l.client.RDB() == nil {
		log.Println("[redis-lock] redis unavailable, skipping lock for", l.key)
		return true
	}
	for i := 0; i <= l.retries; i++ {
		ok, err := l.client.RDB().SetNX(ctx, l.key, l.value, l.ttl).Result()
		if err != nil {
			log.Printf("[redis-lock] setnx error for %s: %v", l.key, err)
			time.Sleep(l.interval)
			continue
		}
		if ok {
			return true
		}
		time.Sleep(l.interval)
	}
	return false
}

func (l *DistributedLock) Release(ctx context.Context) {
	if l.client == nil || l.client.RDB() == nil {
		return
	}
	result, err := unlockScript.Run(ctx, l.client.RDB(), []string{l.key}, l.value).Int64()
	if err != nil {
		log.Printf("[redis-lock] unlock error for %s: %v", l.key, err)
		return
	}
	if result == 0 {
		log.Printf("[redis-lock] unlock failed for %s (lock expired or held by another)", l.key)
	}
}

func InventoryLockKey(warehouseID, materialID string) string {
	return fmt.Sprintf("inv_lock:%s:%s", warehouseID, materialID)
}

type LockProvider struct {
	client *Client
}

func NewLockProvider(client *Client) *LockProvider {
	return &LockProvider{client: client}
}

func (p *LockProvider) AcquireInventoryLock(ctx context.Context, warehouseID, materialID string) (*DistributedLock, bool) {
	lock := NewDistributedLock(
		p.client,
		InventoryLockKey(warehouseID, materialID),
		10*time.Second,
		3,
		200*time.Millisecond,
	)
	acquired := lock.Acquire(ctx)
	return lock, acquired
}
