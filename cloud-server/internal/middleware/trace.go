package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TraceMiddleware Trace ID 中间件
func TraceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 优先使用请求头中的 Trace ID
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}
		
		// 挂载到 context 和 header
		c.Set("trace_id", traceID)
		c.Header("X-Trace-ID", traceID)
		
		c.Next()
	}
}
