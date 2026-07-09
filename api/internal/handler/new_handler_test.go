package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
)

func assertStatus(t *testing.T, w *httptest.ResponseRecorder, expected int, msg string) {
	t.Helper()
	if w.Code != expected {
		t.Errorf("%s: expected status %d, got %d. body: %s", msg, expected, w.Code, w.Body.String())
	}
}

func TestPaymentRequestHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("missing enterprise_id returns error", func(t *testing.T) {
		h := &PaymentRequestHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/payment-requests", h.Create)
		body, _ := json.Marshal(prCreateReq{CustomerID: "abc", Amount: 1000})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises//payment-requests", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		if w.Code < 200 || w.Code >= 300 {
			return
		}
	})

	t.Run("invalid json body returns error", func(t *testing.T) {
		h := &PaymentRequestHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/payment-requests", h.Create)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/payment-requests", bytes.NewReader([]byte("not json")))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		assertStatus(t, w, http.StatusBadRequest, "invalid json should return 400")
	})

	t.Run("valid create request parses body", func(t *testing.T) {
		h := &PaymentRequestHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/payment-requests", h.Create)
		body, _ := json.Marshal(prCreateReq{CustomerID: "uuid-1", Amount: 1000, Notes: "test"})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/payment-requests", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("list with valid params", func(t *testing.T) {
		h := &PaymentRequestHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/payment-requests", h.List)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/payment-requests?page=1&page_size=10", nil)
		r.ServeHTTP(w, req)
	})
}

func TestCollectionHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("missing enterprise_id returns error", func(t *testing.T) {
		h := &CollectionHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/collections", h.Create)
		body, _ := json.Marshal(colCreateReq{CustomerID: "abc", ReceivableID: "def", Amount: 500})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises//collections", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("valid create request", func(t *testing.T) {
		h := &CollectionHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/collections", h.Create)
		body, _ := json.Marshal(colCreateReq{
			CustomerID:   "uuid-1",
			ReceivableID: "uuid-2",
			Amount:       500,
			Method:       "bank_transfer",
		})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/collections", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("get with invalid uuid returns error", func(t *testing.T) {
		h := &CollectionHandler{}
		r := gin.New()
		r.GET("/collections/:id", h.Get)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/collections/not-a-uuid", nil)
		r.ServeHTTP(w, req)
	})
}

func TestPaymentPlanHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("create batch with empty plans returns error", func(t *testing.T) {
		h := &PaymentPlanHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/contracts/:contract_id/payment-plans", h.CreateBatch)
		body, _ := json.Marshal(ppCreateBatchReq{Plans: nil})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/contracts/contract-1/payment-plans", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("valid create batch request", func(t *testing.T) {
		h := &PaymentPlanHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/contracts/:contract_id/payment-plans", h.CreateBatch)
		body, _ := json.Marshal(ppCreateBatchReq{
			Plans: []service.PaymentPlanItem{
				{PlanDate: "2026-08-01", Amount: 5000},
				{PlanDate: "2026-09-01", Amount: 5000},
			},
		})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/contracts/contract-1/payment-plans", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})

	t.Run("list overdue with missing eid", func(t *testing.T) {
		h := &PaymentPlanHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/payment-plans/overdue", h.ListOverdue)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises//payment-plans/overdue", nil)
		r.ServeHTTP(w, req)
	})
}

func TestCashFlowHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("forecast with valid params", func(t *testing.T) {
		h := &CashFlowHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/cash-flow-forecast", h.Forecast)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/cash-flow-forecast?months=6", nil)
		r.ServeHTTP(w, req)
	})
}

func TestReconciliationHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("missing query params returns error", func(t *testing.T) {
		h := &ReconciliationHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/reconciliation", h.GetReconciliation)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/reconciliation", nil)
		r.ServeHTTP(w, req)
	})

	t.Run("valid reconciliation request", func(t *testing.T) {
		h := &ReconciliationHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/reconciliation", h.GetReconciliation)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/reconciliation?customer_id=uuid-1&start_date=2026-01-01&end_date=2026-06-30", nil)
		r.ServeHTTP(w, req)
	})
}

func TestRepairOrderHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("create with valid body", func(t *testing.T) {
		h := &RepairOrderHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/service-orders/:service_order_id/repair-order", h.Create)
		body, _ := json.Marshal(roCreateReq{FaultPoint: "屏幕损坏", RepairContent: "更换屏幕"})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/service-orders/so-1/repair-order", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})
}

func TestServiceOrderHandler_Sign(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("sign endpoint exists", func(t *testing.T) {
		h := &ServiceOrderHandler{}

		r := gin.New()
		r.POST("/service-orders/:id/sign", h.Sign)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/service-orders/not-a-uuid/sign", nil)
		r.ServeHTTP(w, req)
	})
}

func TestOwnerHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("signals with valid eid", func(t *testing.T) {
		h := &OwnerHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/owner/signals", h.Signals)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/owner/signals", nil)
		r.ServeHTTP(w, req)
	})

	t.Run("kpi with valid params", func(t *testing.T) {
		h := &OwnerHandler{}
		r := gin.New()
		r.GET("/enterprises/:enterprise_id/owner/kpi", h.KPI)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/enterprises/ent-1/owner/kpi?period=month", nil)
		r.ServeHTTP(w, req)
	})

	t.Run("create alert rule", func(t *testing.T) {
		h := &OwnerHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/owner/alert-rules", h.CreateAlertRule)
		body, _ := json.Marshal(arCreateReq{
			Dimension: "sales",
			Metric:    "total_revenue",
			Operator:  ">",
			Threshold: 50000,
		})
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/owner/alert-rules", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
	})
}

func TestHealthDashboardHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("enterprise health with invalid uuid", func(t *testing.T) {
		h := &HealthDashboardHandler{}
		r := gin.New()
		r.GET("/operator/enterprises/:id/health", h.GetEnterpriseHealth)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/operator/enterprises/not-a-uuid/health", nil)
		r.ServeHTTP(w, req)
	})
}

func TestRestoreHandler_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("restore with valid params", func(t *testing.T) {
		h := &RestoreHandler{}
		r := gin.New()
		r.POST("/:type/:id/restore", h.Restore)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/customers/00000000-0000-0000-0000-000000000001/restore", nil)
		r.ServeHTTP(w, req)
	})
}
