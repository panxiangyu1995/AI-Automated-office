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

func TestAppError_WithDetailItems(t *testing.T) {
	items := []ErrorDetail{
		{Resource: "contract", Action: "create", Reason: "duplicate_name"},
		{Resource: "contract", Action: "create", Reason: "invalid_amount"},
	}
	err := ErrValidation.WithDetailItems(items)
	if len(err.DetailItems) != 2 {
		t.Fatalf("expected 2 detail items, got %d", len(err.DetailItems))
	}
	if err.DetailItems[0].Resource != "contract" {
		t.Errorf("expected resource 'contract', got %s", err.DetailItems[0].Resource)
	}
	if err.DetailItems[0].Reason != "duplicate_name" {
		t.Errorf("expected reason 'duplicate_name', got %s", err.DetailItems[0].Reason)
	}
}

func TestAppError_WithMessage(t *testing.T) {
	err := ErrNotFound.WithMessage("custom message")
	if err.Message != "custom message" {
		t.Errorf("expected custom message, got %s", err.Message)
	}
}

func TestAppError_WithLevel(t *testing.T) {
	err := NewAppError("TEST_001", "test", 500).WithLevel(LevelFatal)
	if err.Level != LevelFatal {
		t.Errorf("expected %s, got %s", LevelFatal, err.Level)
	}
}

func TestAppError_WithRecoverable(t *testing.T) {
	err := ErrInternal.WithRecoverable(true, "retry")
	if !err.Recoverable || err.RecoveryAction != "retry" {
		t.Errorf("expected recoverable=true, action=retry, got recoverable=%v, action=%s", err.Recoverable, err.RecoveryAction)
	}
}

func TestAppError_WithRecoveryActionInfo(t *testing.T) {
	info := &RecoveryActionInfo{Type: "refresh_token", API: "POST /api/v1/auth/refresh", Description: "刷新令牌"}
	err := ErrTokenExpired.WithRecoveryActionInfo(info)
	if err.RecoveryActionInfo == nil {
		t.Fatal("expected non-nil RecoveryActionInfo")
	}
	if err.RecoveryActionInfo.Type != "refresh_token" {
		t.Errorf("expected type 'refresh_token', got %s", err.RecoveryActionInfo.Type)
	}
	if err.RecoveryActionInfo.API != "POST /api/v1/auth/refresh" {
		t.Errorf("unexpected API: %s", err.RecoveryActionInfo.API)
	}
}

func TestAppError_WithRequestID(t *testing.T) {
	err := ErrInternal.WithRequestID("req-123")
	if err.RequestID != "req-123" {
		t.Errorf("expected req-123, got %s", err.RequestID)
	}
}

func TestErrorLevels(t *testing.T) {
	levels := []string{LevelRecoverable, LevelUserAction, LevelDataIssue, LevelSystemError, LevelFatal}
	for _, l := range levels {
		if l == "" {
			t.Errorf("level should not be empty")
		}
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

func TestNewErrorCodes(t *testing.T) {
	newErrors := []struct {
		err    *AppError
		code   string
		status int
	}{
		{ErrRefreshTokenExpired, "AUTH_REFRESH_TOKEN_EXPIRED", 401},
		{ErrRoleRequired, "PERM_ROLE_REQUIRED", 403},
		{ErrContractLocked, "BIZ_CONTRACT_LOCKED", 409},
		{ErrQuantityInsufficient, "BIZ_QUANTITY_INSUFFICIENT", 409},
		{ErrWorkflowParallelPending, "BIZ_WORKFLOW_PARALLEL_PENDING", 409},
		{ErrInspectionRequired, "BIZ_INSPECTION_REQUIRED", 400},
		{ErrReceivableNotFound, "FIN_RECEIVABLE_NOT_FOUND", 404},
		{ErrPayableNotFound, "FIN_PAYABLE_NOT_FOUND", 404},
	}
	for _, tt := range newErrors {
		if tt.err.Code != tt.code {
			t.Errorf("expected code %q, got %q", tt.code, tt.err.Code)
		}
		if tt.err.Status != tt.status {
			t.Errorf("%s: expected status %d, got %d", tt.code, tt.status, tt.err.Status)
		}
	}
}

func TestPredefinedErrorsHaveLevels(t *testing.T) {
	if ErrInternal.Level != LevelSystemError {
		t.Errorf("ErrInternal should have level %s, got %s", LevelSystemError, ErrInternal.Level)
	}
	if ErrNotFound.Level != LevelDataIssue {
		t.Errorf("ErrNotFound should have level %s, got %s", LevelDataIssue, ErrNotFound.Level)
	}
	if !ErrTokenExpired.Recoverable {
		t.Error("ErrTokenExpired should be recoverable")
	}
	if ErrTokenExpired.RecoveryActionInfo == nil {
		t.Error("ErrTokenExpired should have RecoveryActionInfo")
	}
	if ErrTokenExpired.RecoveryActionInfo.Type != "refresh_token" {
		t.Errorf("ErrTokenExpired recovery type should be 'refresh_token', got %s", ErrTokenExpired.RecoveryActionInfo.Type)
	}
}

func TestNewValidationError(t *testing.T) {
	err := NewValidationError("email", "invalid format")
	if err.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %s", err.Code)
	}
	if len(err.DetailItems) != 1 {
		t.Fatalf("expected 1 detail item, got %d", len(err.DetailItems))
	}
	if err.DetailItems[0].Resource != "email" {
		t.Errorf("expected resource 'email', got %s", err.DetailItems[0].Resource)
	}
	if err.DetailItems[0].Reason != "invalid format" {
		t.Errorf("expected reason 'invalid format', got %s", err.DetailItems[0].Reason)
	}
}

func TestNewValidationErrors(t *testing.T) {
	errs := []ValidationError{
		{"email", "required"},
		{"name", "too short"},
	}
	err := NewValidationErrors(errs)
	if len(err.DetailItems) != 2 {
		t.Errorf("expected 2 detail items, got %d", len(err.DetailItems))
	}
}

func TestErrorDetailStruct(t *testing.T) {
	d := ErrorDetail{Resource: "employee", Action: "create", Reason: "email_exists"}
	if d.Resource != "employee" || d.Action != "create" || d.Reason != "email_exists" {
		t.Errorf("ErrorDetail fields mismatch: %+v", d)
	}
}

func TestRecoveryActionInfoStruct(t *testing.T) {
	info := RecoveryActionInfo{Type: "login", API: "POST /api/v1/auth/login", Description: "重新登录"}
	if info.Type != "login" || info.API == "" || info.Description == "" {
		t.Errorf("RecoveryActionInfo fields mismatch: %+v", info)
	}
}

func TestClonePreservesNewFields(t *testing.T) {
	err := ErrTokenExpired.WithDetailItems([]ErrorDetail{{Resource: "token", Action: "validate", Reason: "expired"}})
	if len(err.DetailItems) != 1 {
		t.Fatalf("expected 1 detail item, got %d", len(err.DetailItems))
	}
	modified := err.WithMessage("changed")
	if len(modified.DetailItems) != 1 {
		t.Errorf("clone should preserve DetailItems, got %d", len(modified.DetailItems))
	}
	if modified.Message != "changed" {
		t.Errorf("expected changed message, got %s", modified.Message)
	}
}
