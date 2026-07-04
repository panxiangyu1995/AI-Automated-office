package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTenant_Header(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		schema := GetSchema(c)
		c.JSON(http.StatusOK, gin.H{
			"enterprise_id": eid,
			"schema":        schema,
		})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", "550e8400-e29b-41d4-a716-446655440000")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_NoHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "" {
			t.Errorf("expected empty enterprise_id, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_QueryParam(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "test-enterprise" {
			t.Errorf("expected test-enterprise, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test?enterprise_id=test-enterprise", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_HeaderPriority(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "from-header" {
			t.Errorf("expected from-header, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test?enterprise_id=from-query", nil)
	req.Header.Set("X-Enterprise-ID", "from-header")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}
