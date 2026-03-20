package permission_module

import (
	"database/sql"

	"cloud-server/internal/module/permission/application/service"
	"cloud-server/internal/module/permission/domain/repository"
	"cloud-server/internal/module/permission/infrastructure/persistence"

	"go.uber.org/zap"
)

// PermissionModule 权限模块
type PermissionModule struct {
	RoleService       *service.RoleService
	PermissionService *service.PermissionService
	UserRoleService   *service.UserRoleService
	PermissionCalculator *service.PermissionCalculator

	RoleRepo       repository.RoleRepository
	PermissionRepo repository.PermissionRepository
	UserRoleRepo   repository.UserRoleRepository
}

// NewPermissionModule 创建权限模块
func NewPermissionModule(db *sql.DB, logger *zap.Logger) *PermissionModule {
	// 创建仓储
	roleRepo := persistence.NewRoleRepository(db)
	permissionRepo := persistence.NewPermissionRepository(db)
	userRoleRepo := persistence.NewUserRoleRepository(db)

	// 创建权限计算器
	calculator := service.NewPermissionCalculator(permissionRepo, logger)

	// 创建服务
	roleService := service.NewRoleService(roleRepo, permissionRepo, db, logger)
	permissionService := service.NewPermissionService(permissionRepo, logger)
	userRoleService := service.NewUserRoleService(userRoleRepo, roleRepo, calculator, logger)

	return &PermissionModule{
		RoleService:         roleService,
		PermissionService:   permissionService,
		UserRoleService:     userRoleService,
		PermissionCalculator: calculator,
		RoleRepo:            roleRepo,
		PermissionRepo:      permissionRepo,
		UserRoleRepo:        userRoleRepo,
	}
}
