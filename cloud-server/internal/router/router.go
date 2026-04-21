package router

import (
	"database/sql"

	"cloud-server/api/swagger"
	"cloud-server/internal/config"
	"cloud-server/internal/handler"
	"cloud-server/internal/metrics"
	"cloud-server/internal/middleware"
	adminHandler "cloud-server/internal/module/admin/interface/handler"
	adminModule "cloud-server/internal/module/admin"
	auditModule "cloud-server/internal/module/audit"
	auditService "cloud-server/internal/module/audit/application/service"
	auditHandler "cloud-server/internal/module/audit/interface/handler"
	messageModule "cloud-server/internal/module/message"
	permissionHandler "cloud-server/internal/module/permission/interface/handler"
	permissionModule "cloud-server/internal/module/permission"
	syncHandler "cloud-server/internal/module/sync/interface/handler"
	"cloud-server/internal/websocket"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

// 编译时检查接口实现
var _ = adminModule.NewAdminModule
var _ = permissionModule.NewPermissionModule
var _ = auditModule.NewModule
var _ = messageModule.NewModule

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
	r.Use(middleware.TraceMiddleware())
	r.Use(metrics.Middleware())

	// Prometheus 指标端点
	metricsHandler := handler.NewMetricsHandler()
	r.GET("/metrics", metricsHandler.Metrics)

	swagger.SwaggerInfo.Host = ""
	swagger.SwaggerInfo.BasePath = "/api/v1"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	healthHandler := handler.NewHealthHandler("1.0.0", sqlDB)
	authHandler := &handler.AuthHandler{
		SQLDB:      sqlDB,
		JWT:        cfg.JWT,
		BypassAuth: cfg.Server.BypassAuth,
	}

	// 初始化 audit 模块
	auditMod := auditModule.NewModule(auditModule.Config{
		DB:        sqlDB,
		ZapLogger: log,
	})
	auditMod.Start()
	auditSvc := auditService.NewAuditService(auditMod.Logger, log)
	auditH := auditHandler.NewAuditHandler(auditMod.Logger, auditMod.Repository, log, auditSvc)

	// 初始化 admin 模块
	adminMod := adminModule.NewAdminModule(sqlDB, log)
	adminH := adminHandler.NewAdminHandler(adminMod.UserService, adminMod.DepartmentService, adminMod.PositionService, adminMod.AuditLogger, log)

	// 初始化 permission 模块
	permissionMod := permissionModule.NewPermissionModule(sqlDB, log)
	permissionH := permissionHandler.NewPermissionHandler(
		permissionMod.RoleService,
		permissionMod.PermissionService,
		permissionMod.UserRoleService,
		log,
	)

	// 初始化权限覆盖处理器 (Story 2.6)
	permissionOverrideH := permissionHandler.NewPermissionOverrideHandler(
		permissionMod.OverrideCRUDService,
		permissionMod.OverrideService,
		permissionMod.DataScopeService,
		permissionMod.FieldPermissionService,
		auditSvc,
		log,
	)

	// 初始化 message 模块
	messageMod := messageModule.NewModule(sqlDB)
	messageMod.Init()

	// 初始化 WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()
	wsHandler := websocket.NewHandler(wsHub)

	v1 := r.Group("/api/v1")
	{
		// 公开路由（不需要认证）
		v1.GET("/health", healthHandler.Health)
		v1.GET("/health/liveness", healthHandler.Liveness)
		v1.GET("/health/readiness", healthHandler.Readiness)
		
		// 登录接口限流
		authGroup := v1.Group("/auth")
		authGroup.Use(middleware.LoginRateLimitMiddleware())
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/forgot-password", authHandler.ForgotPassword)
		}

		// 全局限流中间件（认证后的请求）
		ipLimiter := middleware.NewRateLimiter(1000) // 1000 req/min
		
		// 需要认证的路由组
		protected := v1.Group("")
		protected.Use(middleware.RateLimitMiddleware(ipLimiter))
		protected.Use(middleware.TenantMiddleware(sqlDB, log))
		protected.Use(middleware.AuthMiddleware(sqlDB, cfg.JWT, log))
		protected.Use(middleware.PermissionMiddleware(
			permissionMod.PermissionCalculator,
			permissionMod.OverrideService,
			nil, // 使用默认配置
			log,
		))

		// Admin routes (需要认证和权限)
		adminH.RegisterRoutes(protected)

		// Permission routes (需要认证和权限)
		permissionH.RegisterRoutes(protected)

		// Permission override routes (Story 2.6)
		permissionOverrideH.RegisterRoutes(protected)

		// Audit routes (Story 2.11)
		audit := protected.Group("/audit")
		{
			audit.GET("/logs", auditH.List)
			audit.GET("/logs/:id", auditH.Get)
			audit.GET("/export", auditH.Export)
		}

		// Sync routes (数据同步)
		syncH := syncHandler.NewSyncHandler(log)
		syncH.RegisterRoutes(protected)

		// Message routes (消息模块)
		messageMod.Handler().RegisterRoutes(protected)

		// WebSocket routes
		protected.GET("/ws", wsHandler.HandleWebSocket)
	}

	return r
}

// NewRouterWithMiddleware 创建带有自定义中间件配置的路由
// 用于测试或特殊场景
func NewRouterWithMiddleware(
	cfg config.Config,
	log *zap.Logger,
	sqlDB *sql.DB,
	permConfig *middleware.PermissionConfig,
) *gin.Engine {
	mode := cfg.Server.Mode
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	r := gin.New()
	r.Use(middleware.RecoveryMiddleware(log))
	r.Use(middleware.LoggerMiddleware(log))
	r.Use(middleware.CORSMiddleware(cfg.Cors))
	r.Use(middleware.TraceMiddleware())
	r.Use(metrics.Middleware())

	metricsHandler := handler.NewMetricsHandler()
	r.GET("/metrics", metricsHandler.Metrics)

	swagger.SwaggerInfo.Host = ""
	swagger.SwaggerInfo.BasePath = "/api/v1"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	healthHandler := handler.NewHealthHandler("1.0.0", sqlDB)
	authHandler := &handler.AuthHandler{
		SQLDB:      sqlDB,
		JWT:        cfg.JWT,
		BypassAuth: cfg.Server.BypassAuth,
	}

	// 初始化 audit 模块
	auditMod := auditModule.NewModule(auditModule.Config{
		DB:        sqlDB,
		ZapLogger: log,
	})
	auditMod.Start()
	auditSvc := auditService.NewAuditService(auditMod.Logger, log)

	adminMod := adminModule.NewAdminModule(sqlDB, log)
	adminH := adminHandler.NewAdminHandler(adminMod.UserService, adminMod.DepartmentService, adminMod.PositionService, adminMod.AuditLogger, log)

	permissionMod := permissionModule.NewPermissionModule(sqlDB, log)
	permissionH := permissionHandler.NewPermissionHandler(
		permissionMod.RoleService,
		permissionMod.PermissionService,
		permissionMod.UserRoleService,
		log,
	)

	permissionOverrideH := permissionHandler.NewPermissionOverrideHandler(
		permissionMod.OverrideCRUDService,
		permissionMod.OverrideService,
		permissionMod.DataScopeService,
		permissionMod.FieldPermissionService,
		auditSvc,
		log,
	)

	// 初始化 message 模块
	messageMod := messageModule.NewModule(sqlDB)
	messageMod.Init()

	// 初始化 WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()
	wsHandler := websocket.NewHandler(wsHub)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", healthHandler.Health)
		v1.GET("/health/liveness", healthHandler.Liveness)
		v1.GET("/health/readiness", healthHandler.Readiness)
		v1.GET("/health/detailed", healthHandler.DetailedHealth)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/forgot-password", authHandler.ForgotPassword)

		protected := v1.Group("")
		protected.Use(middleware.TenantMiddleware(sqlDB, log))
		protected.Use(middleware.AuthMiddleware(sqlDB, cfg.JWT, log))
		protected.Use(middleware.PermissionMiddleware(
			permissionMod.PermissionCalculator,
			permissionMod.OverrideService,
			permConfig,
			log,
		))

		adminH.RegisterRoutes(protected)
		permissionH.RegisterRoutes(protected)
		permissionOverrideH.RegisterRoutes(protected)

		// Message routes
		messageMod.Handler().RegisterRoutes(protected)

		// WebSocket routes
		protected.GET("/ws", wsHandler.HandleWebSocket)
	}

	return r
}