package router

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/ai-office/api/internal/handler"
	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/pkg/config"
)

func Setup(cfg *config.Config, logger *zap.Logger) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.CORS(cfg.Server.CORSOrigins))

	api := r.Group("/api/v1")
	{
		healthHandler := handler.NewHealthHandler()
		api.GET("/health", healthHandler.Health)
		api.GET("/ready", healthHandler.Ready)
	}

	return r
}
