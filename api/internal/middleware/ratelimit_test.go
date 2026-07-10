package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/ratelimit"
)

func setupRateLimitTest(middleware gin.HandlerFunc) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", middleware, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})
	return r
}

func TestRateLimitMiddleware_WithinLimit(t *testing.T) {
	limiter := ratelimit.NewRateLimiter()
	mw := NewRateLimitMiddleware(limiter)
	mw.SetEnterpriseQPS(100)

	r := gin.New()
	r.GET("/test", setRole("admin"), setEnterprise("e1"), mw.Check(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	if w.Header().Get("X-RateLimit-Limit") == "" {
		t.Error("expected X-RateLimit-Limit header")
	}
	if w.Header().Get("X-RateLimit-Remaining") == "" {
		t.Error("expected X-RateLimit-Remaining header")
	}
	if w.Header().Get("X-RateLimit-Reset") == "" {
		t.Error("expected X-RateLimit-Reset header")
	}
}

func TestRateLimitMiddleware_ExceedsLimit(t *testing.T) {
	limiter := ratelimit.NewRateLimiter()
	mw := NewRateLimitMiddleware(limiter)
	mw.SetEnterpriseQPS(2)

	r := gin.New()
	r.GET("/test", setEnterprise("e2"), mw.Check(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("request %d: expected 200, got %d", i+1, w.Code)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", w.Code)
	}
}

func TestRateLimitMiddleware_NoEnterprise(t *testing.T) {
	limiter := ratelimit.NewRateLimiter()
	mw := NewRateLimitMiddleware(limiter)

	r := gin.New()
	r.GET("/test", mw.Check(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func setEnterprise(eid string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseID, eid)
		c.Next()
	}
}
