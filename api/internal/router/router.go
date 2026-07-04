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
	"github.com/ai-office/api/pkg/ratelimit"
)

func Setup(cfg *config.Config, logger *zap.Logger, db *gorm.DB) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.CORS(cfg.Server.CORSOrigins))
	r.Use(middleware.Tenant())

	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)

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
		authService := service.NewAuthService(userRepo, jwtManager)
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

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtManager), auditMiddleware.Record(), quotaMiddleware.Check(), rateLimitMiddleware.Check())
		{
			protected.GET("/me", authHandler.Me)
			protected.GET("/audit-logs", auditLogHandler.List)
			protected.GET("/quota", quotaHandler.GetQuota)
			protected.PUT("/quota", quotaHandler.UpdateQuota)
			protected.GET("/features", quotaHandler.ListFeatures)
			protected.PUT("/features/:key", quotaHandler.UpdateFeature)

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
