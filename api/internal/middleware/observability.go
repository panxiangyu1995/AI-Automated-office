package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/observability"
)

const (
	ContextKeyRequestID = "request_id"
	ContextKeyTraceID   = "trace_id"
)

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set(ContextKeyRequestID, requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

func Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		recorder := observability.NewMetricsRecorder(c.Request.Method, c.FullPath())
		c.Next()
		recorder.Record(c.Writer.Status())
	}
}

func Tracing() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}
		c.Set(ContextKeyTraceID, traceID)
		c.Header("X-Trace-ID", traceID)

		ctx := context.WithValue(c.Request.Context(), "trace_id", traceID)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if id, ok := c.Get(ContextKeyRequestID); ok {
		return id.(string)
	}
	return ""
}

func GetTraceID(c *gin.Context) string {
	if id, ok := c.Get(ContextKeyTraceID); ok {
		return id.(string)
	}
	return ""
}

type ResponseWriterWrapper struct {
	gin.ResponseWriter
	startTime time.Time
}

func (w *ResponseWriterWrapper) Write(data []byte) (int, error) {
	return w.ResponseWriter.Write(data)
}
