package router

import (
	"database/sql"

	"cloud-server/api/swagger"
	"cloud-server/internal/config"
	"cloud-server/internal/handler"
	"cloud-server/internal/middleware"
	adminHandler "cloud-server/internal/module/admin/interface/handler"
	adminModule "cloud-server/internal/module/admin"

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
	authHandler := &handler.AuthHandler{
		SQLDB: sqlDB,
		JWT:   cfg.JWT,
	}

	// 初始化 admin 模块
	adminMod := adminModule.NewAdminModule(sqlDB, log)
	adminH := adminHandler.NewAdminHandler(adminMod.UserService, adminMod.AuditLogger, log)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", healthHandler.Health)
		v1.GET("/health/liveness", healthHandler.Liveness)
		v1.GET("/health/readiness", healthHandler.Readiness)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/forgot-password", authHandler.ForgotPassword)

		// Admin routes (需要认证中间件注入 tenant_id)
		// TODO: 添加认证中间件
		adminH.RegisterRoutes(v1)
	}

	return r
}
