package errors

import (
	"testing"
)

func TestAppError_Error(t *testing.T) {
	err := ErrNotFound
	expected := "[RES_NOT_FOUND] 资源不存在"
	if err.Error() != expected {
		t.Errorf("unexpected error message: got %q, want %q", err.Error(), expected)
	}
}

func TestAppError_WithDetail(t *testing.T) {
	err := ErrBadRequest.WithDetail("invalid email")
	if err.Detail != "invalid email" {
		t.Errorf("unexpected detail: %s", err.Detail)
	}
}

func TestAppError_WithDetails(t *testing.T) {
	err := ErrValidation.WithDetails([]string{"field1: required", "field2: too long"})
	if len(err.Details) != 2 {
		t.Errorf("expected 2 details, got %d", len(err.Details))
	}
}

func TestAppError_WithMessage(t *testing.T) {
	err := ErrNotFound.WithMessage("custom message")
	if err.Message != "custom message" {
		t.Errorf("expected custom message, got %s", err.Message)
	}
}

func TestAppError_WithLevel(t *testing.T) {
	err := NewAppError("TEST_001", "test", 500).WithLevel("critical")
	if err.Level != "critical" {
		t.Errorf("expected critical, got %s", err.Level)
	}
}

func TestAppError_WithRecoverable(t *testing.T) {
	err := ErrInternal.WithRecoverable(true, "retry")
	if !err.Recoverable || err.RecoveryAction != "retry" {
		t.Errorf("expected recoverable=true, action=retry, got recoverable=%v, action=%s", err.Recoverable, err.RecoveryAction)
	}
}

func TestAppError_WithRequestID(t *testing.T) {
	err := ErrInternal.WithRequestID("req-123")
	if err.RequestID != "req-123" {
		t.Errorf("expected req-123, got %s", err.RequestID)
	}
}

func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		err    *AppError
		code   string
		status int
		hasMsg bool
	}{
		{ErrInternal, "SYS_INTERNAL_ERROR", 500, true},
		{ErrNotFound, "RES_NOT_FOUND", 404, true},
		{ErrBadRequest, "VAL_INVALID_PARAMS", 400, true},
		{ErrUnauthorized, "AUTH_UNAUTHORIZED", 401, true},
		{ErrForbidden, "AUTH_FORBIDDEN", 403, true},
		{ErrConflict, "RES_CONFLICT", 409, true},
		{ErrTooManyRequests, "SYS_RATE_LIMIT", 429, true},
		{ErrDatabase, "SYS_DB_ERROR", 500, true},
		{ErrValidation, "VAL_INVALID_PARAMS", 400, true},
		{ErrDuplicateEntry, "BIZ_DUPLICATE_ENTRY", 409, true},
		{ErrInvalidStatus, "BIZ_INVALID_STATUS", 400, true},
		{ErrTenantRequired, "AUTH_TENANT_REQUIRED", 400, true},
		{ErrTokenExpired, "AUTH_TOKEN_EXPIRED", 401, true},
		{ErrTokenInvalid, "AUTH_TOKEN_INVALID", 401, true},
		{ErrPermissionDenied, "PERM_DENIED", 403, true},
		{ErrQuotaExceeded, "PERM_QUOTA_EXCEEDED", 429, true},
		{ErrFeatureDisabled, "PERM_FEATURE_DISABLED", 403, true},
	}

	for _, tt := range tests {
		if tt.err.Code != tt.code {
			t.Errorf("%s: expected code %q, got %q", tt.code, tt.code, tt.err.Code)
		}
		if tt.err.Status != tt.status {
			t.Errorf("%s: expected status %d, got %d", tt.code, tt.status, tt.err.Status)
		}
		if tt.hasMsg && tt.err.Message == "" {
			t.Errorf("%s: expected non-empty message", tt.code)
		}
	}
}

func TestPredefinedErrorsHaveLevels(t *testing.T) {
	if ErrInternal.Level != "error" {
		t.Errorf("ErrInternal should have level 'error', got %s", ErrInternal.Level)
	}
	if ErrNotFound.Level != "warn" {
		t.Errorf("ErrNotFound should have level 'warn', got %s", ErrNotFound.Level)
	}
	if !ErrTokenExpired.Recoverable {
		t.Error("ErrTokenExpired should be recoverable")
	}
	if ErrTokenExpired.RecoveryAction != "refresh_token" {
		t.Errorf("ErrTokenExpired recovery action should be 'refresh_token', got %s", ErrTokenExpired.RecoveryAction)
	}
}

func TestNewValidationError(t *testing.T) {
	err := NewValidationError("email", "invalid format")
	if err.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %s", err.Code)
	}
	if len(err.Details) != 1 || err.Details[0] != "email: invalid format" {
		t.Errorf("unexpected details: %v", err.Details)
	}
}

func TestNewValidationErrors(t *testing.T) {
	errs := []ValidationError{
		{"email", "required"},
		{"name", "too short"},
	}
	err := NewValidationErrors(errs)
	if len(err.Details) != 2 {
		t.Errorf("expected 2 details, got %d", len(err.Details))
	}
}
