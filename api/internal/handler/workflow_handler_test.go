package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
)

func TestWorkflowHandler_Transfer(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("transfer with valid body", func(t *testing.T) {
		h := &WorkflowHandler{}
		r := gin.New()
		r.POST("/workflows/:id/transfer", h.Transfer)
		body, _ := json.Marshal(map[string]string{"to_approver_id": "uuid-target"})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/workflows/not-a-uuid/transfer", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("transfer without body", func(t *testing.T) {
		h := &WorkflowHandler{}
		r := gin.New()
		r.POST("/workflows/:id/transfer", h.Transfer)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/workflows/not-a-uuid/transfer", bytes.NewReader([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})
}

func TestWorkflowHandler_Return(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("return with reason", func(t *testing.T) {
		h := &WorkflowHandler{}
		r := gin.New()
		r.POST("/workflows/:id/return", h.Return)
		body, _ := json.Marshal(map[string]string{"reason": "材料不完整"})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/workflows/not-a-uuid/return", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("return without reason", func(t *testing.T) {
		h := &WorkflowHandler{}
		r := gin.New()
		r.POST("/workflows/:id/return", h.Return)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/workflows/not-a-uuid/return", bytes.NewReader([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})
}

func TestWorkflowHandler_Resubmit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("resubmit invalid uuid", func(t *testing.T) {
		h := &WorkflowHandler{}
		r := gin.New()
		r.POST("/workflows/:id/resubmit", h.Resubmit)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/workflows/not-a-uuid/resubmit", nil)
		r.ServeHTTP(w, req)
	})
}

func TestWorkflowHandler_CreateDefinition_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.POST("/workflow-definitions", h.CreateDefinition)

	body, _ := json.Marshal(map[string]string{"name": "Leave Approval", "flow_config": `{"steps":[]}`})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflow-definitions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_CreateDefinition_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyEnterpriseID, "00000000-0000-0000-0000-000000000001")
		c.Next()
	})
	r.POST("/workflow-definitions", h.CreateDefinition)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflow-definitions", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_CreateDefinition_MissingBinding(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyEnterpriseID, "00000000-0000-0000-0000-000000000001")
		c.Next()
	})
	r.POST("/workflow-definitions", h.CreateDefinition)

	body, _ := json.Marshal(map[string]string{"flow_config": `{"steps":[]}`})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflow-definitions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_ListDefinitions_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.GET("/workflow-definitions", h.ListDefinitions)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/workflow-definitions", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_Approve_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.POST("/workflows/:id/approve", h.Approve)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflows/not-a-uuid/approve", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_Reject_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.POST("/workflows/:id/reject", h.Reject)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflows/not-a-uuid/reject", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_History_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.GET("/workflows/:id/history", h.History)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/workflows/not-a-uuid/history", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_GetParallelStatus_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.GET("/workflows/:id/parallel-status", h.GetParallelStatus)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/workflows/not-a-uuid/parallel-status", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_SubmitWorkflow_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyEnterpriseID, "00000000-0000-0000-0000-000000000001")
		c.Next()
	})
	r.POST("/workflows/submit", h.SubmitWorkflow)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflows/submit", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestWorkflowHandler_SubmitWorkflow_MissingBinding(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &WorkflowHandler{}
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ContextKeyEnterpriseID, "00000000-0000-0000-0000-000000000001")
		c.Next()
	})
	r.POST("/workflows/submit", h.SubmitWorkflow)

	body, _ := json.Marshal(map[string]string{"definition_id": "def-1"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/workflows/submit", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}
