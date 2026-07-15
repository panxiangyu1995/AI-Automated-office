package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

func TestSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		Success(c, gin.H{"key": "value"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp Response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Data == nil {
		t.Error("expected non-nil data")
	}
	if resp.Error != nil {
		t.Error("expected nil error")
	}
}

func TestCreated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/test", func(c *gin.Context) {
		Created(c, gin.H{"id": "123"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, w.Code)
	}
}

func TestError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		Error(c, apperrors.ErrNotFound)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected non-nil error")
	}
	if resp.Error.Code != "RES_NOT_FOUND" {
		t.Errorf("expected code RES_NOT_FOUND, got %s", resp.Error.Code)
	}
}

func TestErrorWithRequestIDAutoInject(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		c.Set("request_id", "req-auto-123")
		Error(c, apperrors.ErrInternal)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected non-nil error")
	}
	if resp.Error.RequestID != "req-auto-123" {
		t.Errorf("expected auto-injected request_id 'req-auto-123', got %s", resp.Error.RequestID)
	}
}

func TestErrorWithTimestampAutoInject(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		Error(c, apperrors.ErrInternal)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected non-nil error")
	}
	if resp.Error.Timestamp == "" {
		t.Error("expected auto-injected timestamp, got empty")
	}
}

func TestErrorWithDetailItems(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		err := apperrors.ErrValidation.WithDetailItems([]apperrors.ErrorDetail{
			{Resource: "contract", Action: "create", Reason: "duplicate_name"},
		})
		Error(c, err)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected non-nil error")
	}
	if len(resp.Error.DetailItems) != 1 {
		t.Fatalf("expected 1 detail item, got %d", len(resp.Error.DetailItems))
	}
	if resp.Error.DetailItems[0].Resource != "contract" {
		t.Errorf("expected resource 'contract', got %s", resp.Error.DetailItems[0].Resource)
	}
}

func TestErrorWithRecoveryActionInfo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		Error(c, apperrors.ErrTokenExpired)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected non-nil error")
	}
	if resp.Error.RecoveryActionInfo == nil {
		t.Fatal("expected non-nil RecoveryActionInfo")
	}
	if resp.Error.RecoveryActionInfo.Type != "refresh_token" {
		t.Errorf("expected type 'refresh_token', got %s", resp.Error.RecoveryActionInfo.Type)
	}
	if resp.Error.RecoveryActionInfo.API != "POST /api/v1/auth/refresh" {
		t.Errorf("unexpected API: %s", resp.Error.RecoveryActionInfo.API)
	}
}

func TestHandleError_AppError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		HandleError(c, apperrors.ErrForbidden)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected status %d, got %d", http.StatusForbidden, w.Code)
	}
}

func TestHandleError_GenericError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		HandleError(c, http.ErrBodyNotAllowed)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}
}

func TestSuccessWithMeta(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		SuccessWithMeta(c, []string{"a", "b"}, &MetaInfo{Page: 1, PageSize: 20, TotalCount: 2})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Meta == nil {
		t.Fatal("expected non-nil meta")
	}
	if resp.Meta.Page != 1 || resp.Meta.PageSize != 20 || resp.Meta.TotalCount != 2 {
		t.Errorf("unexpected meta: %+v", resp.Meta)
	}
}

func TestValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/test", func(c *gin.Context) {
		ValidationError(c, "email", "required")
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}

	var resp Response
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Error == nil {
		t.Fatal("expected error")
	}
	if resp.Error.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %s", resp.Error.Code)
	}
	if len(resp.Error.DetailItems) != 1 {
		t.Errorf("expected 1 detail item, got %d", len(resp.Error.DetailItems))
	}
}
