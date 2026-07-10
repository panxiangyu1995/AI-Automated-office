package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/database"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(c *gin.Context) {
	status := "ok"
	dbStatus := "connected"

	if database.DB != nil {
		sqlDB, err := database.DB.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "disconnected"
			status = "degraded"
		}
	} else {
		dbStatus = "not_configured"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   status,
		"service":  "ai-office-api",
		"version":  "1.0.0",
		"database": dbStatus,
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	if database.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not_ready",
			"reason": "database not connected",
		})
		return
	}

	sqlDB, err := database.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not_ready",
			"reason": "database ping failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}
