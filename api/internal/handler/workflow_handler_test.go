package handler

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
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
