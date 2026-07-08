package redis

import (
	"context"
	"fmt"
	"time"
)

type TokenBlacklist struct {
	client *Client
}

func NewTokenBlacklist(client *Client) *TokenBlacklist {
	return &TokenBlacklist{client: client}
}

func (b *TokenBlacklist) Add(ctx context.Context, jti string, ttl time.Duration) error {
	if b.client == nil || b.client.RDB() == nil {
		return fmt.Errorf("redis client not available")
	}
	key := fmt.Sprintf("token_blacklist:%s", jti)
	return b.client.RDB().Set(ctx, key, "1", ttl).Err()
}

func (b *TokenBlacklist) IsBlacklisted(ctx context.Context, jti string) (bool, error) {
	if b.client == nil || b.client.RDB() == nil {
		return false, fmt.Errorf("redis client not available")
	}
	key := fmt.Sprintf("token_blacklist:%s", jti)
	val, err := b.client.RDB().Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}
