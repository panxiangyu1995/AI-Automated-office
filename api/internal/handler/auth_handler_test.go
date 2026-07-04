package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/auth"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type mockAuthService struct {
	loginResp    *service.TokenResponse
	loginErr     *apperrors.AppError
	registerUser *model.User
	registerErr  *apperrors.AppError
	refreshResp  *service.TokenResponse
	refreshErr   *apperrors.AppError
}

func (m *mockAuthService) Login(req service.LoginRequest) (*service.TokenResponse, *apperrors.AppError) {
	return m.loginResp, m.loginErr
}

func (m *mockAuthService) Refresh(req service.RefreshRequest) (*service.TokenResponse, *apperrors.AppError) {
	return m.refreshResp, m.refreshErr
}

func (m *mockAuthService) ValidateToken(tokenStr string) (*auth.Claims, *apperrors.AppError) {
	return nil, nil
}

func (m *mockAuthService) Register(email, password, name, enterpriseID string) (*model.User, *apperrors.AppError) {
	return m.registerUser, m.registerErr
}

func (m *mockAuthService) GetUser(userID uuid.UUID) (*model.User, *apperrors.AppError) {
	return nil, nil
}

func TestAuthHandler_Login_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &mockAuthService{
		loginResp: &service.TokenResponse{
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
			UserID:       uuid.New().String(),
			Role:         "admin",
		},
	}
	h := NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/login", h.Login)

	body, _ := json.Marshal(service.LoginRequest{Email: "admin@test.com", Password: "password"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	if data["access_token"] != "access-token" {
		t.Errorf("expected access-token, got %s", data["access_token"])
	}
}

func TestAuthHandler_Login_ValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &mockAuthService{
		loginErr: apperrors.NewValidationError("email", "邮箱不能为空"),
	}
	h := NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/login", h.Login)

	body, _ := json.Marshal(service.LoginRequest{Email: "", Password: ""})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestAuthHandler_Login_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &mockAuthService{}
	h := NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/login", h.Login)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestAuthHandler_Refresh_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &mockAuthService{
		refreshResp: &service.TokenResponse{
			AccessToken:  "new-access-token",
			RefreshToken: "new-refresh-token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
		},
	}
	h := NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/refresh", h.Refresh)

	body, _ := json.Marshal(service.RefreshRequest{RefreshToken: "valid-refresh-token"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestAuthHandler_Refresh_Error(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &mockAuthService{
		refreshErr: apperrors.ErrTokenExpired.WithDetail("token expired"),
	}
	h := NewAuthHandler(svc)

	r := gin.New()
	r.POST("/api/v1/auth/refresh", h.Refresh)

	body, _ := json.Marshal(service.RefreshRequest{RefreshToken: "expired-token"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}
