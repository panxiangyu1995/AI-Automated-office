// Package errors provides standardized error types for the API.
package errors

import (
	"fmt"
	"net/http"
)

// AppError represents a standardized application error.
type AppError struct {
	Code       string            `json:"code"`
	Message    string            `json:"message"`
	HTTPStatus int               `json:"-"`
	Details    map[string]string `json:"details,omitempty"`
	TraceID    string            `json:"trace_id,omitempty"`
	Stack      string            `json:"-"` // Not exposed to client
}

// Error implements the error interface.
func (e *AppError) Error() string {
	if e.TraceID != "" {
		return fmt.Sprintf("%s: %s (trace_id=%s)", e.Code, e.Message, e.TraceID)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// WithDetails adds details to the error.
func (e *AppError) WithDetails(details map[string]string) *AppError {
	e.Details = details
	return e
}

// WithTraceID adds a trace ID to the error.
func (e *AppError) WithTraceID(traceID string) *AppError {
	e.TraceID = traceID
	return e
}

// NewError creates a new application error.
func NewError(code string, httpStatus int, message string) *AppError {
	if message == "" {
		message = GetMessage(code)
	}
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
	}
}

// ==================== General Errors ====================

// BadRequest creates a bad request error.
func BadRequest(message string, details ...map[string]string) *AppError {
	err := NewError(ErrBadRequest, http.StatusBadRequest, message)
	if len(details) > 0 {
		err.Details = details[0]
	}
	return err
}

// NotFound creates a not found error.
func NotFound(resource string) *AppError {
	return NewError(ErrNotFound, http.StatusNotFound, fmt.Sprintf("%s not found", resource))
}

// Conflict creates a conflict error.
func Conflict(message string) *AppError {
	return NewError(ErrConflict, http.StatusConflict, message)
}

// Internal creates an internal server error.
func Internal(message string) *AppError {
	return NewError(ErrInternal, http.StatusInternalServerError, message)
}

// ValidationError creates a validation error.
func ValidationError(details map[string]string) *AppError {
	return NewError(ErrValidationFailed, http.StatusBadRequest, "Validation failed").
		WithDetails(details)
}

// ==================== Authentication Errors ====================

// Unauthorized creates an unauthorized error.
func Unauthorized(code string, message string) *AppError {
	if code == "" {
		code = ErrAuthRequired
	}
	return NewError(code, http.StatusUnauthorized, message)
}

// InvalidCredentials creates an invalid credentials error.
func InvalidCredentials() *AppError {
	return NewError(ErrInvalidCredentials, http.StatusUnauthorized, "")
}

// TokenExpired creates a token expired error.
func TokenExpired() *AppError {
	return NewError(ErrTokenExpired, http.StatusUnauthorized, "")
}

// TokenInvalid creates an invalid token error.
func TokenInvalid() *AppError {
	return NewError(ErrTokenInvalid, http.StatusUnauthorized, "")
}

// SessionExpired creates a session expired error.
func SessionExpired() *AppError {
	return NewError(ErrSessionExpired, http.StatusUnauthorized, "")
}

// AccountLocked creates an account locked error.
func AccountLocked() *AppError {
	return NewError(ErrAccountLocked, http.StatusForbidden, "")
}

// AccountDisabled creates an account disabled error.
func AccountDisabled() *AppError {
	return NewError(ErrAccountDisabled, http.StatusForbidden, "")
}

// ==================== Permission Errors ====================

// Forbidden creates a forbidden error.
func Forbidden(code string, message string) *AppError {
	if code == "" {
		code = ErrPermissionDenied
	}
	if message == "" {
		message = GetMessage(code)
	}
	return NewError(code, http.StatusForbidden, message)
}

// PermissionDenied creates a permission denied error.
func PermissionDenied(resource, requiredPerm string) *AppError {
	return NewError(ErrPermissionDenied, http.StatusForbidden, "Permission denied").
		WithDetails(map[string]string{
			"resource":            resource,
			"required_permission": requiredPerm,
		})
}

// DataScopeDenied creates a data scope denied error.
func DataScopeDenied(message string) *AppError {
	return NewError(ErrDataScopeDenied, http.StatusForbidden, message)
}

// ==================== User Errors ====================

// UserNotFound creates a user not found error.
func UserNotFound() *AppError {
	return NewError(ErrUserNotFound, http.StatusNotFound, "")
}

// UserAlreadyExists creates a user already exists error.
func UserAlreadyExists(field string) *AppError {
	return NewError(ErrUserAlreadyExists, http.StatusConflict,
		fmt.Sprintf("User with this %s already exists", field))
}

// ==================== Tenant Errors ====================

// TenantRequired creates a tenant required error.
func TenantRequired() *AppError {
	return NewError(ErrTenantRequired, http.StatusBadRequest, "")
}

// TenantInvalid creates an invalid tenant error.
func TenantInvalid() *AppError {
	return NewError(ErrTenantInvalid, http.StatusForbidden, "")
}

// TenantInactive creates a tenant inactive error.
func TenantInactive() *AppError {
	return NewError(ErrTenantInactive, http.StatusForbidden, "")
}

// ==================== Import/Export Errors ====================

// ImportFailed creates an import failed error.
func ImportFailed(message string) *AppError {
	return NewError(ErrImportFailed, http.StatusBadRequest, message)
}

// ExportFailed creates an export failed error.
func ExportFailed(message string) *AppError {
	return NewError(ErrExportFailed, http.StatusInternalServerError, message)
}

// InvalidFileFormat creates an invalid file format error.
func InvalidFileFormat(format string) *AppError {
	return NewError(ErrInvalidFileFormat, http.StatusBadRequest,
		fmt.Sprintf("Invalid file format: %s", format))
}

// FileTooLarge creates a file too large error.
func FileTooLarge(maxSize string) *AppError {
	return NewError(ErrFileTooLarge, http.StatusBadRequest,
		fmt.Sprintf("File size exceeds maximum allowed size of %s", maxSize))
}

// RateLimitError creates a rate limit exceeded error.
func RateLimitError(retryAfter int) *AppError {
	return NewError(ErrRateLimitExceeded, http.StatusTooManyRequests,
		fmt.Sprintf("Rate limit exceeded. Retry after %d seconds", retryAfter))
}
