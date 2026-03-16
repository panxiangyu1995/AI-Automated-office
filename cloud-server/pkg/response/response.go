package response

import "github.com/gin-gonic/gin"

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
