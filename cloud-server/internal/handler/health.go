package handler

import (
	"database/sql"
	"net/http"
	"time"

	"cloud-server/pkg/database"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	Version string
	SQLDB   *sql.DB
}

type HealthCheck struct {
	Status  string `json:"status"`
	Latency string `json:"latency,omitempty"`
}

type HealthResponse struct {
	Status    string                 `json:"status"`
	Version   string                 `json:"version"`
	Timestamp string                 `json:"timestamp"`
	Checks    map[string]HealthCheck `json:"checks,omitempty"`
}

func (h *HealthHandler) Health(c *gin.Context) {
	response := HealthResponse{
		Status:    "ok",
		Version:   h.Version,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	c.JSON(http.StatusOK, response)
}

func (h *HealthHandler) Liveness(c *gin.Context) {
	response := HealthResponse{
		Status:    "ok",
		Version:   h.Version,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	c.JSON(http.StatusOK, response)
}

func (h *HealthHandler) Readiness(c *gin.Context) {
	status := "ok"
	checks := map[string]HealthCheck{}

	if h.SQLDB == nil {
		status = "degraded"
		checks["database"] = HealthCheck{Status: "not_configured"}
	} else {
		start := time.Now()
		err := database.Ping(c.Request.Context(), h.SQLDB)
		latency := time.Since(start).String()
		if err != nil {
			status = "unhealthy"
			checks["database"] = HealthCheck{Status: "unhealthy", Latency: latency}
		} else {
			checks["database"] = HealthCheck{Status: "ok", Latency: latency}
		}
	}

	response := HealthResponse{
		Status:    status,
		Version:   h.Version,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    checks,
	}
	c.JSON(http.StatusOK, response)
}
