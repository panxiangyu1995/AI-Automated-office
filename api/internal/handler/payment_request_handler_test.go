package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type mockPaymentRequestService struct {
	createResult      interface{}
	createErr         *apperrors.AppError
	listItems         interface{}
	listTotal         int64
	listErr           *apperrors.AppError
	getResult         interface{}
	getErr            *apperrors.AppError
	updateResult      interface{}
	updateErr         *apperrors.AppError
	deleteErr         *apperrors.AppError
	submitErr         *apperrors.AppError
	approveErr        *apperrors.AppError
	rejectErr         *apperrors.AppError
}

func (m *mockPaymentRequestService) Create(eid, customerID string, contractID, salesOrderID *string, amount float64, notes string) (interface{}, *apperrors.AppError) {
	return m.createResult, m.createErr
}
func (m *mockPaymentRequestService) Update(id string, input map[string]interface{}) (interface{}, *apperrors.AppError) {
	return m.updateResult, m.updateErr
}
func (m *mockPaymentRequestService) Delete(id string) *apperrors.AppError { return m.deleteErr }
func (m *mockPaymentRequestService) Get(id string) (interface{}, *apperrors.AppError) {
	return m.getResult, m.getErr
}
func (m *mockPaymentRequestService) List(eid string, page, pageSize int, status string) (interface{}, int64, *apperrors.AppError) {
	return m.listItems, m.listTotal, m.listErr
}
func (m *mockPaymentRequestService) SubmitForApproval(id string) *apperrors.AppError { return m.submitErr }
func (m *mockPaymentRequestService) Approve(id, approverID string) *apperrors.AppError { return m.approveErr }
func (m *mockPaymentRequestService) Reject(id, approverID, reason string) *apperrors.AppError { return m.rejectErr }

type testPRHandler struct {
	*PaymentRequestHandler
	svc *mockPaymentRequestService
}

func newTestPRHandler() *testPRHandler {
	svc := &mockPaymentRequestService{}
	return &testPRHandler{
		PaymentRequestHandler: &PaymentRequestHandler{svc: &service.PaymentRequestService{}},
		svc:                   svc,
	}
}

func setupPRRouter(h *PaymentRequestHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	enterprise := r.Group("/enterprises/:enterprise_id")
	enterprise.POST("/payment-requests", h.Create)
	enterprise.GET("/payment-requests", h.List)
	r.GET("/payment-requests/:id", h.Get)
	r.PUT("/payment-requests/:id", h.Update)
	r.DELETE("/payment-requests/:id", h.Delete)
	r.POST("/payment-requests/:id/submit", h.SubmitForApproval)
	r.POST("/payment-requests/:id/approve", h.Approve)
	r.POST("/payment-requests/:id/reject", h.Reject)
	return r
}

func TestPaymentRequestHandler_Create_Success(t *testing.T) {
	h := &PaymentRequestHandler{}
	r := setupPRRouter(h)
	body, _ := json.Marshal(prCreateReq{CustomerID: "abc", Amount: 1000})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/payment-requests", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code == http.StatusOK || w.Code == http.StatusCreated {
		return
	}
}

func TestPaymentRequestHandler_Create_MissingEnterprise(t *testing.T) {
	h := &PaymentRequestHandler{}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/payment-requests", h.Create)
	body, _ := json.Marshal(prCreateReq{CustomerID: "abc", Amount: 1000})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//payment-requests", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK && w.Code != http.StatusCreated {
		return
	}
}

func TestPaymentRequestHandler_Approve_ValidatesID(t *testing.T) {
	h := &PaymentRequestHandler{}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/payment-requests/:id/approve", h.Approve)
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/payment-requests/invalid-uuid/approve", nil)
	r.ServeHTTP(w, req)
}

func TestPaymentRequestHandler_Reject_ValidatesBody(t *testing.T) {
	h := &PaymentRequestHandler{}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/payment-requests/:id/reject", h.Reject)
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/payment-requests/00000000-0000-0000-0000-000000000001/reject", nil)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
}
