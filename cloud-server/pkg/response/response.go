package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ApiResponse struct {
	Success bool        `json:"success"`
	Code    string      `json:"code,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	TraceID string      `json:"trace_id"`
	Details interface{} `json:"details,omitempty"`
}

type ApiError struct {
	Success bool              `json:"success"`
	Code    string            `json:"code"`
	Message string            `json:"message"`
	TraceID string            `json:"trace_id"`
	Details map[string]string `json:"details,omitempty"`
}

// getTraceID 获取 Trace ID
func getTraceID(c *gin.Context) string {
	if traceID, exists := c.Get("trace_id"); exists {
		return traceID.(string)
	}
	return uuid.New().String()
}

// Success 返回成功响应
func Success[T any](c *gin.Context, data T, message string) {
	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Code:    "SUCCESS",
		Data:    data,
		Message: message,
		TraceID: getTraceID(c),
	})
}

// Created 返回 201 Created 响应
func Created(c *gin.Context, data any, message string) {
	c.JSON(http.StatusCreated, ApiResponse{
		Success: true,
		Code:    "CREATED",
		Data:    data,
		Message: message,
		TraceID: getTraceID(c),
	})
}

// NoContent 返回 204 No Content 响应
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Error 返回错误响应
func Error(c *gin.Context, status int, code string, message string, details map[string]string) {
	c.JSON(status, ApiError{
		Success: false,
		Code:    code,
		Message: message,
		TraceID: getTraceID(c),
		Details: details,
	})
}

// BadRequest 返回 400 错误
func BadRequest(c *gin.Context, code string, message string, details map[string]string) {
	Error(c, http.StatusBadRequest, code, message, details)
}

// NotFound 返回 404 错误
func NotFound(c *gin.Context, code string, message string) {
	Error(c, http.StatusNotFound, code, message, nil)
}

// InternalError 返回 500 错误
func InternalError(c *gin.Context, code string, message string) {
	Error(c, http.StatusInternalServerError, code, message, nil)
}

// 错误码常量
const (
	CodeSuccess              = "SUCCESS"
	CodeBadRequest           = "ERR_BAD_REQUEST"
	CodeUnauthorized         = "ERR_UNAUTHORIZED"
	CodeForbidden            = "ERR_FORBIDDEN"
	CodeNotFound             = "ERR_NOT_FOUND"
	CodeInternalServerError = "ERR_INTERNAL"
	CodeTooManyRequests      = "ERR_TOO_MANY_REQUESTS"
)
