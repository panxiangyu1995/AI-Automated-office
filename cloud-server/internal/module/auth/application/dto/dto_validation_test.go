package dto

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestLoginRequestValidationRejectsMissingFields(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest("POST", "/auth/login", strings.NewReader(`{"username":"a"}`))
	c.Request.Header.Set("Content-Type", "application/json")

	var req LoginRequest
	err := c.ShouldBindJSON(&req)
	if err == nil {
		t.Fatal("expected validation error for invalid login request")
	}
}

func TestLoginRequestValidationAcceptsValidPayload(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest("POST", "/auth/login", strings.NewReader(`{"username":"demo_user","password":"StrongPass1","tenant_id":"tenant-a"}`))
	c.Request.Header.Set("Content-Type", "application/json")

	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		t.Fatalf("expected valid payload, got error: %v", err)
	}
}

func TestRefreshRequestValidationRejectsMissingToken(t *testing.T) {
	t.Parallel()
	gin.SetMode(gin.TestMode)

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest("POST", "/auth/refresh", strings.NewReader(`{}`))
	c.Request.Header.Set("Content-Type", "application/json")

	var req RefreshRequest
	err := c.ShouldBindJSON(&req)
	if err == nil {
		t.Fatal("expected validation error for empty refresh_token")
	}
}
