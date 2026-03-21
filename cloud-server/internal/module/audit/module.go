package audit

import (
	"cloud-server/internal/module/audit/application/service"
	"cloud-server/internal/module/audit/domain/repository"
	"cloud-server/internal/module/audit/infrastructure/persistence"
	"cloud-server/internal/module/audit/interface/middleware"

	"database/sql"
	"go.uber.org/zap"
)

// Module 审计模块
type Module struct {
	Repo      repository.AuditLogRepository
	Logger    *service.AuditLogger
	Builder   *service.AuditLogBuilder
	Middleware *middleware.AuditMiddleware
}

// Config 模块配置
type Config struct {
	DB              *sql.DB
	ZapLogger       *zap.Logger
	LoggerConfig    service.AuditLoggerConfig
	MiddlewareConfig middleware.AuditMiddlewareConfig
}

// NewModule 创建审计模块
func NewModule(cfg Config) *Module {
	// 创建仓储
	repo := persistence.NewAuditLogRepository(cfg.DB)

	// 创建审计日志器
	loggerConfig := cfg.LoggerConfig
	if loggerConfig.QueueSize == 0 {
		loggerConfig = service.DefaultAuditLoggerConfig()
	}
	auditLogger := service.NewAuditLogger(repo, loggerConfig, cfg.ZapLogger)

	// 创建中间件
	middlewareConfig := cfg.MiddlewareConfig
	if len(middlewareConfig.SkipPaths) == 0 {
		middlewareConfig = middleware.DefaultAuditMiddlewareConfig()
	}
	auditMiddleware := middleware.NewAuditMiddleware(auditLogger, middlewareConfig, cfg.ZapLogger)

	return &Module{
		Repo:       repo,
		Logger:     auditLogger,
		Builder:    service.NewAuditLogBuilder(),
		Middleware: auditMiddleware,
	}
}

// Start 启动模块
func (m *Module) Start() {
	m.Logger.Start()
}

// Stop 停止模块
func (m *Module) Stop() {
	m.Logger.Stop()
}
