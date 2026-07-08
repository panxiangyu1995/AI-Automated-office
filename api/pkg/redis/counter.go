package redis

import (
	"context"
	"fmt"
	"time"
)

type UnreadCounter struct {
	client *Client
}

func NewUnreadCounter(client *Client) *UnreadCounter {
	return &UnreadCounter{client: client}
}

func (c *UnreadCounter) key(enterpriseID, employeeID string) string {
	return fmt.Sprintf("unread:%s:%s", enterpriseID, employeeID)
}

func (c *UnreadCounter) Incr(ctx context.Context, enterpriseID, employeeID string) (int64, error) {
	if c.client == nil || c.client.RDB() == nil {
		return 0, fmt.Errorf("redis client not available")
	}
	val, err := c.client.RDB().Incr(ctx, c.key(enterpriseID, employeeID)).Result()
	if err != nil {
		return 0, err
	}
	c.client.RDB().Expire(ctx, c.key(enterpriseID, employeeID), 7*24*time.Hour)
	return val, nil
}

func (c *UnreadCounter) Decr(ctx context.Context, enterpriseID, employeeID string) (int64, error) {
	if c.client == nil || c.client.RDB() == nil {
		return 0, nil
	}
	key := c.key(enterpriseID, employeeID)
	current, err := c.client.RDB().Get(ctx, key).Int64()
	if err != nil || current <= 0 {
		return 0, nil
	}
	return c.client.RDB().Decr(ctx, key).Result()
}

func (c *UnreadCounter) Get(ctx context.Context, enterpriseID, employeeID string) (int64, error) {
	if c.client == nil || c.client.RDB() == nil {
		return 0, nil
	}
	val, err := c.client.RDB().Get(ctx, c.key(enterpriseID, employeeID)).Int64()
	if err != nil {
		return 0, nil
	}
	return val, nil
}

func (c *UnreadCounter) Reset(ctx context.Context, enterpriseID, employeeID string) error {
	if c.client == nil || c.client.RDB() == nil {
		return fmt.Errorf("redis client not available")
	}
	return c.client.RDB().Del(ctx, c.key(enterpriseID, employeeID)).Err()
}
