package router

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/handler"
	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/repository"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/auth"
	"github.com/ai-office/api/pkg/config"
	"github.com/ai-office/api/pkg/observability"
	"github.com/ai-office/api/pkg/ratelimit"
	"github.com/ai-office/api/pkg/rbac"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(cfg *config.Config, logger *zap.Logger, db *gorm.DB) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	observability.InitTracing("ai-office-api", "")

	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Metrics())
	r.Use(middleware.Tracing())
	r.Use(middleware.CORS(cfg.Server.CORSOrigins))
	r.Use(middleware.Tenant())

	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/v1")
	{
		healthHandler := handler.NewHealthHandler()
		api.GET("/health", healthHandler.Health)
		api.GET("/ready", healthHandler.Ready)
	}

	var backupService *service.BackupService
	var quotaService *service.QuotaService
	if db != nil {
		userRepo := repository.NewUserRepository(db)

		groupRepo := repository.NewGroupRepository(db)
		groupService := service.NewGroupService(groupRepo, userRepo, jwtManager)
		groupHandler := handler.NewGroupHandler(groupService)

		enterpriseRepo := repository.NewEnterpriseRepository(db)
		enterpriseService := service.NewEnterpriseService(enterpriseRepo, db)
		enterpriseHandler := handler.NewEnterpriseHandler(enterpriseService)
		deptRepo := repository.NewDepartmentRepository(db)

		deptService := service.NewDepartmentService(deptRepo)
		deptHandler := handler.NewDepartmentHandler(deptService)

		empRepo := repository.NewEmployeeRepository(db)
		empService := service.NewEmployeeService(empRepo, deptRepo)
		empHandler := handler.NewEmployeeHandler(empService)

		positionRepo := repository.NewPositionRepository(db)
		positionService := service.NewPositionService(positionRepo)
		positionHandler := handler.NewPositionHandler(positionService)

		crossEnterpriseRepo := repository.NewCrossEnterpriseRepository(db)
		crossEnterpriseService := service.NewCrossEnterpriseService(crossEnterpriseRepo)
		crossEnterpriseHandler := handler.NewCrossEnterpriseHandler(crossEnterpriseService)

		authService := service.NewAuthServiceFull(userRepo, enterpriseRepo, crossEnterpriseRepo, jwtManager)
		authHandler := handler.NewAuthHandler(authService)

		auditLogRepo := repository.NewAuditLogRepository(db)
		auditLogService := service.NewAuditLogService(auditLogRepo)
		auditLogHandler := handler.NewAuditLogHandler(auditLogService)

		auditMiddleware := middleware.NewAuditMiddleware(auditLogService)

		backupConfigRepo := repository.NewBackupConfigRepository(db)
		backupRecordRepo := repository.NewBackupRecordRepository(db)
		backupService = service.NewBackupService(
			backupConfigRepo, backupRecordRepo,
			cfg.Database.Host, fmt.Sprintf("%d", cfg.Database.Port), cfg.Database.User, cfg.Database.Password, cfg.Database.DBName,
			cfg.Server.BackupDir,
		)
		backupHandler := handler.NewBackupHandler(backupService)

		apiQuotaRepo := repository.NewApiQuotaRepository(db)
		featureFlagRepo := repository.NewFeatureFlagRepository(db)
		quotaService = service.NewQuotaService(apiQuotaRepo, featureFlagRepo)
		quotaHandler := handler.NewQuotaHandler(quotaService)
		quotaMiddleware := middleware.NewQuotaMiddleware(quotaService)
		featureFlagMiddleware := middleware.NewFeatureFlagMiddleware(quotaService)

		rateLimiter := ratelimit.NewRateLimiter()
		rateLimitMiddleware := middleware.NewRateLimitMiddleware(rateLimiter)

		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		operatorOnly := middleware.RequirePermission(rbac.PermSystemConfig)

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtManager), auditMiddleware.Record(), quotaMiddleware.Check(), rateLimitMiddleware.Check())
		{
			protected.POST("/auth/switch-enterprise", authHandler.SwitchEnterprise)
			protected.GET("/me", authHandler.Me)
			protected.GET("/audit-logs", auditLogHandler.List)
			protected.POST("/cross-enterprise/permissions", crossEnterpriseHandler.Grant)
			protected.DELETE("/cross-enterprise/permissions/:id", crossEnterpriseHandler.Revoke)
			protected.GET("/cross-enterprise/permissions", crossEnterpriseHandler.ListByUser)

			groups := protected.Group("/groups")
			groups.Use(operatorOnly)
			{
				groups.POST("", groupHandler.Create)
				groups.PUT("/:id", groupHandler.Update)
				groups.DELETE("/:id", groupHandler.Delete)
				groups.GET("", groupHandler.List)
				groups.GET("/:id", groupHandler.Get)
			}

			enterprises := protected.Group("/enterprises")
			enterprises.Use(operatorOnly)
			{
				enterprises.POST("", enterpriseHandler.Create)
				enterprises.PUT("/:id", enterpriseHandler.Update)
				enterprises.GET("", enterpriseHandler.List)
				enterprises.GET("/:id", enterpriseHandler.Get)
			}
			protected.GET("/quota", quotaHandler.GetQuota)
			protected.PUT("/quota", quotaHandler.UpdateQuota)
			protected.GET("/features", quotaHandler.ListFeatures)
			protected.PUT("/features/:key", quotaHandler.UpdateFeature)

			enterprise := protected.Group("/enterprises/:enterprise_id")
			{
				enterprise.GET("/departments/tree", deptHandler.GetTree)
				enterprise.POST("/departments", deptHandler.Create)
			}
			enterprise.POST("/employees", empHandler.Create)
			enterprise.GET("/employees", empHandler.List)
			enterprise.POST("/positions", positionHandler.Create)
			enterprise.GET("/positions", positionHandler.List)
			protected.PUT("/positions/:id", positionHandler.Update)
			protected.PUT("/employees/:id", empHandler.Update)
			protected.DELETE("/employees/:id", empHandler.Delete)
			protected.GET("/employees/:id", empHandler.Get)
			protected.PUT("/employees/:id/transfer", empHandler.Transfer)

			protected.PUT("/departments/:id", deptHandler.Update)
			protected.PUT("/departments/:id/manager", deptHandler.SetManager)
			protected.DELETE("/departments/:id", deptHandler.Delete)

			backup := protected.Group("/backup")
			backup.Use(featureFlagMiddleware.Require("backup"))
			{
				backup.POST("/configs", backupHandler.CreateConfig)
				backup.PUT("/configs/:id", backupHandler.UpdateConfig)
				backup.DELETE("/configs/:id", backupHandler.DeleteConfig)
				backup.GET("/configs", backupHandler.ListConfigs)
				backup.GET("/configs/:id", backupHandler.GetConfig)
				backup.GET("/records", backupHandler.ListRecords)
				backup.POST("/trigger", backupHandler.TriggerBackup)
				backup.POST("/restore/:record_id", backupHandler.Restore)
			}
		}
	}

	if backupService != nil {
		go func() {
			ticker := time.NewTicker(1 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				backupService.CheckAndRunScheduled()
			}
		}()
	}

	return r
}
