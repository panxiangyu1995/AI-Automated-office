package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestFinanceHandler_CreatePayment_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/payments", h.CreatePayment)

	body, _ := json.Marshal(payReq{CustomerID: "cust-1", Amount: 5000, PaymentMethod: "bank_transfer"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//payments", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreatePayment_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/payments", h.CreatePayment)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/payments", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_ListPayments_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/payments", h.ListPayments)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//payments", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateExpense_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/expenses", h.CreateExpense)

	body, _ := json.Marshal(expReq{Category: "office", Amount: 1000, Description: "test"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//expenses", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateExpense_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/expenses", h.CreateExpense)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/expenses", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_ListExpenses_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/expenses", h.ListExpenses)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//expenses", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateInvoice_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/invoices", h.CreateInvoice)

	body, _ := json.Marshal(invReq{CustomerID: "cust-1", Amount: 10000, TaxAmount: 600})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//invoices", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateInvoice_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/invoices", h.CreateInvoice)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/invoices", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_ListInvoices_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/invoices", h.ListInvoices)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//invoices", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateReceivable_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/receivables", h.CreateReceivable)

	body := `{"customer_id":"cust-1","amount":30000}`
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//receivables", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreateReceivable_InvalidEnterpriseUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/receivables", h.CreateReceivable)

	body := `{"customer_id":"cust-1","amount":30000}`
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/not-a-uuid/receivables", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_ListReceivables_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/receivables", h.ListReceivables)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//receivables", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_CreatePayable_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/payables", h.CreatePayable)

	body := `{"supplier_id":"sup-1","amount":40000}`
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//payables", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestFinanceHandler_ApproveExpense_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &FinanceHandler{}
	r := gin.New()
	r.POST("/expenses/:id/approve", h.ApproveExpense)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/expenses/not-a-uuid/approve", nil)
	r.ServeHTTP(w, req)
}
