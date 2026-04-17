package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	// 每分钟请求数限制
	RequestsPerMinute int
	// 限流前缀（用于区分不同限流策略）
	Prefix string
}

// RateLimiter 限流器
type RateLimiter struct {
	requests map[string]*clientRequests
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

type clientRequests struct {
	count     int
	windowStart time.Time
}

// NewRateLimiter 创建限流器
func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*clientRequests),
		limit:    requestsPerMinute,
		window:   time.Minute,
	}
	
	// 启动清理协程
	go rl.cleanup()
	
	return rl
}

// Allow 检查是否允许请求
func (rl *RateLimiter) Allow(clientID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	
	cr, exists := rl.requests[clientID]
	if !exists || now.Sub(cr.windowStart) > rl.window {
		rl.requests[clientID] = &clientRequests{
			count:       1,
			windowStart: now,
		}
		return true
	}
	
	if cr.count >= rl.limit {
		return false
	}
	
	cr.count++
	return true
}

// cleanup 定期清理过期记录
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, cr := range rl.requests {
			if now.Sub(cr.windowStart) > rl.window {
				delete(rl.requests, key)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware 创建限流中间件
func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取客户端标识（优先使用用户ID，其次使用IP）
		clientID := c.GetString("user_id")
		if clientID == "" {
			clientID = c.ClientIP()
		}
		
		if !limiter.Allow(clientID) {
			retryAfter := int(time.Minute / time.Second)
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.Header("X-RateLimit-Limit", strconv.Itoa(limiter.limit))
			c.Header("X-RateLimit-Remaining", "0")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success":   false,
				"code":      "ERR_RATE_LIMIT_EXCEEDED",
				"message":   "请求过于频繁，请稍后再试",
				"trace_id":  c.GetString("trace_id"),
				"retry_after": retryAfter,
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// IPRateLimitMiddleware IP 限流中间件
func IPRateLimitMiddleware(requestsPerMinute int) gin.HandlerFunc {
	limiter := NewRateLimiter(requestsPerMinute)
	return RateLimitMiddleware(limiter)
}

// LoginRateLimitMiddleware 登录限流中间件
func LoginRateLimitMiddleware() gin.HandlerFunc {
	limiter := NewRateLimiter(10) // 登录接口更严格的限制
	return RateLimitMiddleware(limiter)
}
