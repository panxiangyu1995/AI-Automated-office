package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func TestOperatorLogHandler_QueryLogs_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	logSvc := service.NewDebugLogService(repo)
	h := NewOperatorLogHandler(logSvc)

	r := gin.New()
	protected := r.Group("/api/v1")
	protected.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyRole, "operator")
		c.Next()
	})
	protected.Use(middleware.RequireExactPermission(rbac.PermSystemDebug))
	protected.GET("/operator/logs", h.QueryLogs)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/operator/logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestOperatorLogHandler_QueryLogs_DeniedForOwner(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	logSvc := service.NewDebugLogService(repo)
	h := NewOperatorLogHandler(logSvc)

	r := gin.New()
	protected := r.Group("/api/v1")
	protected.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyRole, "owner")
		c.Next()
	})
	protected.Use(middleware.RequireExactPermission(rbac.PermSystemDebug))
	protected.GET("/operator/logs", h.QueryLogs)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/operator/logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403 for owner (PermAll should not bypass system:debug), got %d: %s", w.Code, w.Body.String())
	}
}

func TestOperatorLogHandler_QueryLogs_DeniedForAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	logSvc := service.NewDebugLogService(repo)
	h := NewOperatorLogHandler(logSvc)

	r := gin.New()
	protected := r.Group("/api/v1")
	protected.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyRole, "admin")
		c.Next()
	})
	protected.Use(middleware.RequireExactPermission(rbac.PermSystemDebug))
	protected.GET("/operator/logs", h.QueryLogs)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/operator/logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestOperatorLogHandler_QueryLogs_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	logSvc := service.NewDebugLogService(repo)
	h := NewOperatorLogHandler(logSvc)

	r := gin.New()
	protected := r.Group("/api/v1")
	protected.Use(middleware.RequireExactPermission(rbac.PermSystemDebug))
	protected.GET("/operator/logs", h.QueryLogs)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/operator/logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}
