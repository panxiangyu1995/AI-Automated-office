package admin_module

import (
	"database/sql"

	"cloud-server/internal/module/admin/application/service"
	"cloud-server/internal/module/admin/domain/repository"
	auditService "cloud-server/internal/module/admin/infrastructure/service"
	"cloud-server/internal/module/admin/infrastructure/persistence"

	"go.uber.org/zap"
)

// AdminModule 管理模块
type AdminModule struct {
	UserService *service.UserService
	UserRepo    repository.UserRepository
	AuditLogger service.AuditLogger
}

// NewAdminModule 创建管理模块
func NewAdminModule(db *sql.DB, logger *zap.Logger) *AdminModule {
	// 创建仓储
	userRepo := persistence.NewUserRepository(db)

	// 创建审计服务
	auditLogger := auditService.NewAuditService(db, logger)

	// 创建用户服务
	userService := service.NewUserService(userRepo, db, logger)
	userService.SetAuditLogger(auditLogger)

	return &AdminModule{
		UserService: userService,
		UserRepo:    userRepo,
		AuditLogger: auditLogger,
	}
}
