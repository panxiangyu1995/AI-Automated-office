package errors

import (
	"testing"
)

func TestAppError_Error(t *testing.T) {
	err := ErrNotFound
	expected := "[COMMON_NOT_FOUND] 资源不存在"
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

func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		err      *AppError
		code     string
		status   int
		hasMsg   bool
	}{
		{ErrInternal, "COMMON_INTERNAL_ERROR", 500, true},
		{ErrNotFound, "COMMON_NOT_FOUND", 404, true},
		{ErrBadRequest, "COMMON_BAD_REQUEST", 400, true},
		{ErrUnauthorized, "AUTH_UNAUTHORIZED", 401, true},
		{ErrForbidden, "AUTH_FORBIDDEN", 403, true},
		{ErrConflict, "COMMON_CONFLICT", 409, true},
		{ErrTooManyRequests, "COMMON_RATE_LIMIT", 429, true},
		{ErrDatabase, "DB_OPERATION_FAILED", 500, true},
		{ErrValidation, "COMMON_VALIDATION_ERROR", 400, true},
		{ErrDuplicateEntry, "DB_DUPLICATE_ENTRY", 409, true},
		{ErrInvalidStatus, "COMMON_INVALID_STATUS", 400, true},
		{ErrTenantRequired, "AUTH_TENANT_REQUIRED", 400, true},
		{ErrTokenExpired, "AUTH_TOKEN_EXPIRED", 401, true},
		{ErrTokenInvalid, "AUTH_TOKEN_INVALID", 401, true},
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

func TestNewValidationError(t *testing.T) {
	err := NewValidationError("email", "invalid format")
	if err.Code != "COMMON_VALIDATION_ERROR" {
		t.Errorf("expected COMMON_VALIDATION_ERROR, got %s", err.Code)
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
