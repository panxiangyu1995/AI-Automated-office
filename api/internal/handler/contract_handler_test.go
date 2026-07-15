package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestContractHandler_Create_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/contracts", h.Create)

	body, _ := json.Marshal(createContractReq{Name: "Test Contract", Amount: 10000})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//contracts", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_Create_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/contracts", h.Create)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/contracts", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_ChangeStatus_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.PUT("/contracts/:id/status", h.ChangeStatus)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/contracts/contract-1/status", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_ChangeStatus_ValidBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.PUT("/contracts/:id/status", h.ChangeStatus)

	body, _ := json.Marshal(statusChangeReq{Status: "pending_approval"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/contracts/contract-1/status", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
}

func TestContractHandler_Get_ValidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.GET("/contracts/:id", h.Get)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/contracts/contract-1", nil)
	r.ServeHTTP(w, req)
}

func TestContractHandler_Delete_ValidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.DELETE("/contracts/:id", h.Delete)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/contracts/contract-1", nil)
	r.ServeHTTP(w, req)
}

func TestContractHandler_Update_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.PUT("/contracts/:id", h.Update)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/contracts/contract-1", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_PatchFields_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.PATCH("/contracts/:id/fields", h.PatchFields)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("PATCH", "/contracts/contract-1/fields", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_List_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/contracts", h.List)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//contracts", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestContractHandler_SubmitApproval(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.POST("/contracts/:id/submit-approval", h.SubmitApproval)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/contracts/contract-1/submit-approval", nil)
	r.ServeHTTP(w, req)
}

func TestContractHandler_Approve(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &ContractHandler{}
	r := gin.New()
	r.POST("/contracts/:id/approve", h.Approve)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/contracts/contract-1/approve", nil)
	r.ServeHTTP(w, req)
}
