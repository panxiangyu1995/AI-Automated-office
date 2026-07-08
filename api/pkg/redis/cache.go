package redis

import (
	"context"
	"fmt"
	"time"

	goRedis "github.com/redis/go-redis/v9"
)

type Cache struct {
	client *Client
}

func NewCache(client *Client) *Cache {
	return &Cache{client: client}
}

func (c *Cache) Get(ctx context.Context, key string) (string, error) {
	if c.client == nil || c.client.RDB() == nil {
		return "", fmt.Errorf("redis client not available")
	}
	val, err := c.client.RDB().Get(ctx, key).Result()
	if err != nil {
		if err == goRedis.Nil {
			return "", nil
		}
		return "", err
	}
	return val, nil
}

func (c *Cache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	if c.client == nil || c.client.RDB() == nil {
		return fmt.Errorf("redis client not available")
	}
	return c.client.RDB().Set(ctx, key, value, ttl).Err()
}

func (c *Cache) Delete(ctx context.Context, keys ...string) error {
	if c.client == nil || c.client.RDB() == nil {
		return fmt.Errorf("redis client not available")
	}
	return c.client.RDB().Del(ctx, keys...).Err()
}

func (c *Cache) Exists(ctx context.Context, key string) (bool, error) {
	if c.client == nil || c.client.RDB() == nil {
		return false, fmt.Errorf("redis client not available")
	}
	val, err := c.client.RDB().Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}
