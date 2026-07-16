//go:build debug

package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
)

func setupDebugHandler(t *testing.T) (*DebugHandler, *gin.Engine) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	logSvc := service.NewDebugLogService(repo)
	stubSvc := service.NewDebugStubService()
	h := NewDebugHandler(logSvc, stubSvc)

	r := gin.New()
	debug := r.Group("/api/v1/debug")
	debug.GET("/logs", h.QueryLogs)
	debug.POST("/logs/seed", h.SeedLogs)
	debug.GET("/stubs", h.ListStubs)
	debug.POST("/stubs", h.AddStub)
	debug.DELETE("/stubs/:id", h.RemoveStub)
	debug.DELETE("/stubs", h.ClearStubs)

	return h, r
}

func TestDebugHandler_QueryLogs(t *testing.T) {
	_, r := setupDebugHandler(t)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/debug/logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDebugHandler_SeedLogs(t *testing.T) {
	_, r := setupDebugHandler(t)

	body, _ := json.Marshal([]repository.LogEntry{
		{Level: "info", Msg: "test seed"},
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/debug/logs/seed", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDebugHandler_AddStub(t *testing.T) {
	_, r := setupDebugHandler(t)

	body, _ := json.Marshal(service.StubEntry{
		Method: "GET", Path: "/api/v1/test", Status: 200, Body: "mock",
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/debug/stubs", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDebugHandler_ListStubs(t *testing.T) {
	_, r := setupDebugHandler(t)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/api/v1/debug/stubs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDebugHandler_ClearStubs(t *testing.T) {
	_, r := setupDebugHandler(t)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/api/v1/debug/stubs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}
