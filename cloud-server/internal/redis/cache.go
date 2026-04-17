package redis

import (
	"context"
	"encoding/json"
	"time"
)

// Cache Redis 缓存实现
type Cache struct {
	client *Client
	ttl    time.Duration
}

// NewCache 创建 Redis 缓存
func NewCache(client *Client, ttl time.Duration) *Cache {
	return &Cache{
		client: client,
		ttl:    ttl,
	}
}

// Get 获取缓存值
func (c *Cache) Get(ctx context.Context, key string) (interface{}, bool) {
	val, err := c.client.Get(ctx, key)
	if err != nil {
		return nil, false
	}

	var result interface{}
	if err := json.Unmarshal([]byte(val), &result); err != nil {
		// 如果不是 JSON，直接返回字符串
		return val, true
	}

	return result, true
}

// Set 设置缓存值
func (c *Cache) Set(ctx context.Context, key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, string(data), c.ttl)
}

// SetWithTTL 设置缓存值（自定义TTL）
func (c *Cache) SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, string(data), ttl)
}

// Delete 删除缓存
func (c *Cache) Delete(ctx context.Context, key string) error {
	return c.client.Delete(ctx, key)
}

// Clear 清空缓存（谨慎使用）
func (c *Cache) Clear(ctx context.Context) error {
	// Redis 中使用 FLUSHDB 清空当前数据库
	// 注意：这会清空整个数据库，建议使用前缀过滤
	return nil // 需要谨慎实现
}

// Incr 增加计数（用于限流）
func (c *Cache) Incr(ctx context.Context, key string) (int64, error) {
	return c.client.Incr(ctx, key)
}

// SetNX 仅当不存在时设置
func (c *Cache) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return false, err
	}
	return c.client.SetNX(ctx, key, string(data), ttl)
}
