package errors

import (
	"testing"
)

func TestAppError_Error(t *testing.T) {
	err := ErrNotFound
	if err.Error() != "[NOT_FOUND] 资源不存在" {
		t.Errorf("unexpected error message: %s", err.Error())
	}
}

func TestAppError_WithDetail(t *testing.T) {
	err := ErrBadRequest.WithDetail("invalid email")
	if err.Detail != "invalid email" {
		t.Errorf("unexpected detail: %s", err.Detail)
	}
}

func TestPredefinedErrors(t *testing.T) {
	tests := []struct {
		err      *AppError
		code     string
		status   int
		hasMsg   bool
	}{
		{ErrInternal, "INTERNAL_ERROR", 500, true},
		{ErrNotFound, "NOT_FOUND", 404, true},
		{ErrBadRequest, "BAD_REQUEST", 400, true},
		{ErrUnauthorized, "UNAUTHORIZED", 401, true},
		{ErrForbidden, "FORBIDDEN", 403, true},
		{ErrConflict, "CONFLICT", 409, true},
		{ErrTooManyRequests, "TOO_MANY_REQUESTS", 429, true},
		{ErrDatabase, "DB_ERROR", 500, true},
		{ErrValidation, "VALIDATION_ERROR", 400, true},
		{ErrDuplicateEntry, "DUPLICATE_ENTRY", 409, true},
		{ErrInvalidStatus, "INVALID_STATUS", 400, true},
	}

	for _, tt := range tests {
		if tt.err.Code != tt.code {
			t.Errorf("expected code %s, got %s", tt.code, tt.err.Code)
		}
		if tt.err.Status != tt.status {
			t.Errorf("expected status %d, got %d", tt.status, tt.err.Status)
		}
		if tt.hasMsg && tt.err.Message == "" {
			t.Errorf("expected non-empty message for %s", tt.code)
		}
	}
}
