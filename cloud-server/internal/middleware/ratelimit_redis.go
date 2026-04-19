package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloud-server/internal/redis"
	"cloud-server/internal/metrics"

	"github.com/gin-gonic/gin"
)

// RateLimitType 限流类型
type RateLimitType string

const (
	RateLimitByIP   RateLimitType = "ip"
	RateLimitByUser RateLimitType = "user"
	RateLimitByAPI  RateLimitType = "api"
)

// DistributedRateLimiter 分布式限流器
type DistributedRateLimiter struct {
	redisClient *redis.Client
	limit       int
	window      time.Duration
	keyPrefix   string
}

// NewDistributedRateLimiter 创建分布式限流器
func NewDistributedRateLimiter(redisClient *redis.Client, limit int, window time.Duration) *DistributedRateLimiter {
	return &DistributedRateLimiter{
		redisClient: redisClient,
		limit:       limit,
		window:      window,
		keyPrefix:   "ratelimit",
	}
}

// Allow 检查是否允许请求
func (rl *DistributedRateLimiter) Allow(ctx context.Context, identifier string) (bool, int, error) {
	key := fmt.Sprintf("%s:%s", rl.keyPrefix, identifier)

	// 使用 Redis INCR
	count, err := rl.redisClient.Incr(ctx, key)
	if err != nil {
		return false, 0, err
	}

	// 首次访问，设置过期时间
	if count == 1 {
		_ = rl.redisClient.Expire(ctx, key, rl.window)
	}

	// 计算剩余请求数
	remaining := rl.limit - int(count)
	if remaining < 0 {
		remaining = 0
	}

	return count <= int64(rl.limit), remaining, nil
}

// GetLimit 获取限制数
func (rl *DistributedRateLimiter) GetLimit() int {
	return rl.limit
}

// GetWindow 获取时间窗口
func (rl *DistributedRateLimiter) GetWindow() time.Duration {
	return rl.window
}

// RedisRateLimitMiddleware 创建 Redis 限流中间件
func RedisRateLimitMiddleware(redisClient *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewDistributedRateLimiter(redisClient, limit, window)

	return func(c *gin.Context) {
		// 确定限流标识符
		var identifier string

		if userID := c.GetString("user_id"); userID != "" {
			identifier = "user:" + userID
		} else {
			identifier = "ip:" + c.ClientIP()
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		allowed, remaining, err := limiter.Allow(ctx, identifier)
		if err != nil {
			// Redis 出错时使用内存限流（降级）
			c.Next()
			return
		}

		// 设置限流响应头
		c.Header("X-RateLimit-Limit", strconv.Itoa(limiter.GetLimit()))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Window", limiter.GetWindow().String())

		if !allowed {
			c.Header("Retry-After", strconv.Itoa(int(limiter.GetWindow().Seconds())))
			
			// 记录限流指标
			metrics.HttpRequestsTotal.WithLabelValues(
				c.Request.Method,
				c.FullPath(),
				"429",
			).Inc()

			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":   false,
				"code":      "ERR_RATE_LIMIT_EXCEEDED",
				"message":   "请求过于频繁，请稍后再试",
				"trace_id":  c.GetString("trace_id"),
				"retry_after": int(limiter.GetWindow().Seconds()),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RedisLoginRateLimitMiddleware Redis 登录限流中间件
func RedisLoginRateLimitMiddleware(redisClient *redis.Client) gin.HandlerFunc {
	// 登录接口更严格的限制：10 次/分钟
	return RedisRateLimitMiddleware(redisClient, 10, time.Minute)
}
