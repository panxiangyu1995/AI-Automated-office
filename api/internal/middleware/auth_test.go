package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/pkg/auth"
)

func TestAuthRequired_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")
	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called")
	})

	w := performRequest(r, "GET", "/test")

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthRequired_InvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")
	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called")
	})

	w := performRequestWithHeader(r, "GET", "/test", "Authorization", "InvalidFormat token")

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func performRequest(r *gin.Engine, method, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, nil)
	r.ServeHTTP(w, req)
	return w
}

func performRequestWithHeader(r *gin.Engine, method, path, header, value string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, nil)
	req.Header.Set(header, value)
	r.ServeHTTP(w, req)
	return w
}
