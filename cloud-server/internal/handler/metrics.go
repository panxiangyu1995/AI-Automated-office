package handler

import (
	"cloud-server/internal/metrics"

	"github.com/gin-gonic/gin"
)

// MetricsHandler 指标处理器
type MetricsHandler struct{}

// NewMetricsHandler 创建指标处理器
func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{}
}

// Metrics 返回 Prometheus 指标
func (h *MetricsHandler) Metrics(c *gin.Context) {
	metrics.Handler().ServeHTTP(c.Writer, c.Request)
}
