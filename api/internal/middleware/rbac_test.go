package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func setupRBACTest(middleware gin.HandlerFunc) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", middleware, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})
	return r
}

func setRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(ContextKeyRole, role)
		c.Next()
	}
}

func TestRequirePermission_Authorized(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("owner"), RequirePermission(rbac.PermUserCreate), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRequirePermission_Denied(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("employee"), RequirePermission(rbac.PermUserCreate), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRequirePermission_NoRole(t *testing.T) {
	r := gin.New()
	r.GET("/test", RequirePermission(rbac.PermUserRead), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRequirePermission_InvalidRole(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("superadmin"), RequirePermission(rbac.PermUserRead), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRequirePermission_OperatorSystemAccess(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("operator"), RequirePermission(rbac.PermSystemConfig), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for operator with system:config, got %d", w.Code)
	}
}

func TestRequirePermission_OperatorAllowedForBusiness(t *testing.T) {
	// 运营商是全平台管理者，拥有全部业务权限（含 user:create）
	r := gin.New()
	r.GET("/test", setRole("operator"), RequirePermission(rbac.PermUserCreate), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for operator with user:create, got %d", w.Code)
	}
}

func TestRequireAnyPermission_Authorized(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("employee"), RequireAnyPermission(rbac.PermEmployeeRead, rbac.PermUserCreate), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRequireAnyPermission_Denied(t *testing.T) {
	r := gin.New()
	r.GET("/test", setRole("employee"), RequireAnyPermission(rbac.PermUserCreate, rbac.PermSystemConfig), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}
