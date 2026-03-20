package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ApiResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

type ApiError struct {
	Success bool              `json:"success"`
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

func Success[T any](c *gin.Context, data T, message string) {
	c.JSON(200, ApiResponse[T]{Success: true, Data: data, Message: message})
}

func Error(c *gin.Context, status int, code string, message string, details map[string]string) {
	c.JSON(status, ApiError{Success: false, Code: code, Message: message, Details: details})
}

// Created 返回 201 Created 响应
func Created(c *gin.Context, data any, message string) {
	c.JSON(http.StatusCreated, ApiResponse[any]{Success: true, Data: data, Message: message})
}

// NoContent 返回 204 No Content 响应
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
