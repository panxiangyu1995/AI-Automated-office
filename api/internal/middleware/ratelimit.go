package middleware

import (
	"strconv"

	"github.com/gin-gonic/gin"

	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/ratelimit"
	"github.com/ai-office/api/pkg/response"
)

const (
	defaultEnterpriseQPS = 1000
	defaultIPQPS         = 100
)

type RateLimitMiddleware struct {
	limiter       *ratelimit.RateLimiter
	enterpriseQPS int
	ipQPS         int
}

func NewRateLimitMiddleware(limiter *ratelimit.RateLimiter) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		limiter:       limiter,
		enterpriseQPS: defaultEnterpriseQPS,
		ipQPS:         defaultIPQPS,
	}
}

func (m *RateLimitMiddleware) SetEnterpriseQPS(qps int) {
	m.enterpriseQPS = qps
}

func (m *RateLimitMiddleware) SetIPQPS(qps int) {
	m.ipQPS = qps
}

func (m *RateLimitMiddleware) Check() gin.HandlerFunc {
	return func(c *gin.Context) {
		enterpriseID := c.GetString(ContextKeyEnterpriseID)
		clientIP := c.ClientIP()

		if enterpriseID != "" {
			m.limiter.SetLimit("enterprise:"+enterpriseID, m.enterpriseQPS)
		}
		m.limiter.SetLimit("ip:"+clientIP, m.ipQPS)

		allowed, remaining, reset := true, 0, 0

		if enterpriseID != "" {
			allowed2, rem, res := m.limiter.Allow("enterprise:" + enterpriseID)
			if !allowed2 {
				allowed = false
			}
			remaining = rem
			reset = res
		}

		allowed3, rem2, res2 := m.limiter.Allow("ip:" + clientIP)
		if !allowed3 {
			allowed = false
		}
		if rem2 < remaining || enterpriseID == "" {
			remaining = rem2
		}
		if res2 > reset {
			reset = res2
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(m.enterpriseQPS))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.Itoa(reset))

		if !allowed {
			response.Error(c, apperrors.ErrTooManyRequests)
			c.Abort()
			return
		}

		c.Next()
	}
}

func (m *RateLimitMiddleware) ResetEnterprise(enterpriseID string) {
	m.limiter.Reset("enterprise:" + enterpriseID)
}

func (m *RateLimitMiddleware) ResetIP(ip string) {
	m.limiter.Reset("ip:" + ip)
}
