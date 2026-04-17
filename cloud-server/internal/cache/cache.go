package cache

import (
	"sync"
	"time"
)

// Time constants
const (
	Second = time.Second
	Minute = time.Minute
	Hour   = time.Hour
)

// Item 缓存项
type Item struct {
	Value      interface{}
	Expiration time.Time
}

// Cache 内存缓存
type Cache struct {
	items map[string]*Item
	mu    sync.RWMutex
	ttl   time.Duration
}

// NewCache 创建缓存实例
func NewCache(ttl time.Duration) *Cache {
	c := &Cache{
		items: make(map[string]*Item),
		ttl:   ttl,
	}
	
	// 启动过期清理
	go c.cleanup()
	
	return c
}

// Get 获取缓存值
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(item.Expiration) {
		return nil, false
	}

	return item.Value, true
}

// Set 设置缓存值
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = &Item{
		Value:      value,
		Expiration: time.Now().Add(c.ttl),
	}
}

// SetWithTTL 设置缓存值（自定义TTL）
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = &Item{
		Value:      value,
		Expiration: time.Now().Add(ttl),
	}
}

// Delete 删除缓存
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// Clear 清空缓存
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*Item)
}

// cleanup 清理过期缓存
func (c *Cache) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for key, item := range c.items {
			if now.After(item.Expiration) {
				delete(c.items, key)
			}
		}
		c.mu.Unlock()
	}
}

// Stats 缓存统计
type Stats struct {
	Items int
}

// Stats 获取缓存统计
func (c *Cache) Stats() Stats {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return Stats{
		Items: len(c.items),
	}
}
