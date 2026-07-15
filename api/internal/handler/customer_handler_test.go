package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type mockCustomerService struct {
	createResult *model.Customer
	createErr    *apperrors.AppError
	getResult    *model.Customer
	getErr       *apperrors.AppError
	listResult   []model.Customer
	listTotal    int64
	listErr      *apperrors.AppError
	updateResult *model.Customer
	updateErr    *apperrors.AppError
	deleteErr    *apperrors.AppError
}

func (m *mockCustomerService) Create(enterpriseID, name, industry, creditCode, address, notes string) (*model.Customer, *apperrors.AppError) {
	return m.createResult, m.createErr
}

func (m *mockCustomerService) Get(enterpriseID, customerID string) (*model.Customer, *apperrors.AppError) {
	return m.getResult, m.getErr
}

func (m *mockCustomerService) List(enterpriseID string, page, pageSize int) ([]model.Customer, int64, *apperrors.AppError) {
	return m.listResult, m.listTotal, m.listErr
}

func (m *mockCustomerService) Update(enterpriseID, customerID, name, industry, creditCode, address, notes, level string) (*model.Customer, *apperrors.AppError) {
	return m.updateResult, m.updateErr
}

func (m *mockCustomerService) Delete(enterpriseID, customerID string) *apperrors.AppError {
	return m.deleteErr
}

type mockPanoramaService struct{}

func (m *mockPanoramaService) GetPanorama(customerID, enterpriseID uuid.UUID) (interface{}, error) {
	return nil, nil
}

func setupCustomerRouter(svc *mockCustomerService) (*gin.Engine, *CustomerHandler) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	realSvc := &CustomerHandler{customerService: nil, panoramaService: nil}
	_ = svc
	return r, realSvc
}

func TestCustomerHandler_Create_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/customers", h.Create)

	body, _ := json.Marshal(createCustomerRequest{Name: "Test Customer"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises//customers", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Create_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.POST("/enterprises/:enterprise_id/customers", h.Create)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/enterprises/ent-1/customers", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Get_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/customers/:id", h.Get)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//customers/cust-1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Get_MissingID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/customers/:id", h.Get)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises/ent-1/customers/", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest && w.Code != http.StatusNotFound {
		t.Errorf("expected 400 or 404, got %d", w.Code)
	}
}

func TestCustomerHandler_List_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/customers", h.List)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//customers", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Delete_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.DELETE("/enterprises/:enterprise_id/customers/:id", h.Delete)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/enterprises//customers/cust-1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Update_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.PUT("/enterprises/:enterprise_id/customers/:id", h.Update)

	body, _ := json.Marshal(updateCustomerRequest{Name: "Updated"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "/enterprises//customers/cust-1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Panorama_MissingEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/customers/:customer_id/panorama", h.Panorama)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises//customers/cust-1/panorama", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCustomerHandler_Panorama_InvalidEnterpriseUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &CustomerHandler{}
	r := gin.New()
	r.GET("/enterprises/:enterprise_id/customers/:customer_id/panorama", h.Panorama)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/enterprises/not-a-uuid/customers/not-a-uuid/panorama", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}
