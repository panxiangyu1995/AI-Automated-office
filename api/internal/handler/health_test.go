package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthHandler_Health(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewHealthHandler()
	r.GET("/api/v1/health", h.Health)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if body["status"] != "ok" {
		t.Errorf("expected status ok, got %v", body["status"])
	}
	if body["service"] != "ai-office-api" {
		t.Errorf("expected service ai-office-api, got %v", body["service"])
	}
	if body["version"] != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %v", body["version"])
	}
}

func TestHealthHandler_Ready_WithoutDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := NewHealthHandler()
	r.GET("/api/v1/ready", h.Ready)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/ready", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, w.Code)
	}

	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["status"] != "not_ready" {
		t.Errorf("expected status not_ready, got %v", body["status"])
	}
}
