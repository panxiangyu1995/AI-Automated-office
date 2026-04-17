package handler

import (
	"database/sql"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthStatus 健康状态
type HealthStatus string

const (
	HealthStatusHealthy   HealthStatus = "healthy"
	HealthStatusDegraded  HealthStatus = "degraded"
	HealthStatusUnhealthy HealthStatus = "unhealthy"
)

// HealthCheck 健康检查结果
type HealthCheck struct {
	Name      string       `json:"name"`
	Status    HealthStatus `json:"status"`
	LatencyMs int64       `json:"latency_ms,omitempty"`
	Error     string       `json:"error,omitempty"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Version   string                 `json:"version"`
	Checks    map[string]HealthCheck `json:"checks,omitempty"`
}

// HealthHandler 健康检查处理器
type HealthHandler struct {
	Version string
	SQLDB   *sql.DB
}

// NewHealthHandler 创建健康检查处理器
func NewHealthHandler(version string, sqlDB *sql.DB) *HealthHandler {
	return &HealthHandler{
		Version: version,
		SQLDB:   sqlDB,
	}
}

// Health 基础健康检查
func (h *HealthHandler) Health(c *gin.Context) {
	response := HealthResponse{
		Status:    string(HealthStatusHealthy),
		Timestamp: time.Now(),
		Version:   h.Version,
	}

	c.JSON(200, response)
}

// Liveness Kubernetes liveness probe
func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(200, gin.H{
		"status": "alive",
		"timestamp": time.Now(),
	})
}

// Readiness Kubernetes readiness probe
func (h *HealthHandler) Readiness(c *gin.Context) {
	checks := make(map[string]HealthCheck)
	overallStatus := HealthStatusHealthy

	// 检查数据库
	dbCheck := h.checkDatabase()
	checks["database"] = dbCheck
	if dbCheck.Status != HealthStatusHealthy {
		overallStatus = HealthStatusUnhealthy
	}

	response := HealthResponse{
		Status:    string(overallStatus),
		Timestamp: time.Now(),
		Version:   h.Version,
		Checks:    checks,
	}

	statusCode := 200
	if overallStatus != HealthStatusHealthy {
		statusCode = 503
	}

	c.JSON(statusCode, response)
}

// DetailedHealth 详细健康检查
func (h *HealthHandler) DetailedHealth(c *gin.Context) {
	checks := make(map[string]HealthCheck)
	overallStatus := HealthStatusHealthy

	// 数据库检查
	dbCheck := h.checkDatabase()
	checks["database"] = dbCheck
	if dbCheck.Status != HealthStatusHealthy {
		overallStatus = HealthStatusUnhealthy
	}

	// 存储检查
	storageCheck := h.checkStorage()
	checks["storage"] = storageCheck
	if storageCheck.Status != HealthStatusHealthy && overallStatus == HealthStatusHealthy {
		overallStatus = HealthStatusDegraded
	}

	response := HealthResponse{
		Status:    string(overallStatus),
		Timestamp: time.Now(),
		Version:   h.Version,
		Checks:    checks,
	}

	statusCode := 200
	if overallStatus == HealthStatusUnhealthy {
		statusCode = 503
	}

	c.JSON(statusCode, response)
}

func (h *HealthHandler) checkDatabase() HealthCheck {
	start := time.Now()
	
	if h.SQLDB == nil {
		return HealthCheck{
			Name:   "database",
			Status: HealthStatusUnhealthy,
			Error:  "database connection not initialized",
		}
	}

	err := h.SQLDB.Ping()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return HealthCheck{
			Name:      "database",
			Status:    HealthStatusUnhealthy,
			LatencyMs: latency,
			Error:     err.Error(),
		}
	}

	return HealthCheck{
		Name:      "database",
		Status:    HealthStatusHealthy,
		LatencyMs: latency,
	}
}

func (h *HealthHandler) checkStorage() HealthCheck {
	// 存储健康检查（后续扩展）
	return HealthCheck{
		Name:   "storage",
		Status: HealthStatusHealthy,
	}
}
