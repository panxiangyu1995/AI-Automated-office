package router

import (
	"database/sql"

	"cloud-server/api/swagger"
	"cloud-server/internal/config"
	"cloud-server/internal/handler"
	"cloud-server/internal/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

func NewRouter(cfg config.Config, log *zap.Logger, sqlDB *sql.DB) *gin.Engine {
	mode := cfg.Server.Mode
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	r := gin.New()
	r.Use(middleware.RecoveryMiddleware(log))
	r.Use(middleware.LoggerMiddleware(log))
	r.Use(middleware.CORSMiddleware(cfg.Cors))

	swagger.SwaggerInfo.Host = ""
	swagger.SwaggerInfo.BasePath = "/api/v1"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	healthHandler := &handler.HealthHandler{
		Version: "1.0.0",
		SQLDB:   sqlDB,
	}

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", healthHandler.Health)
		v1.GET("/health/liveness", healthHandler.Liveness)
		v1.GET("/health/readiness", healthHandler.Readiness)
	}

	return r
}
