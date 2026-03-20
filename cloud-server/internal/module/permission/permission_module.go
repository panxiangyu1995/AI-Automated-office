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

	// Story 2.6 细粒度权限覆盖
	OverrideRepo            repository.PermissionOverrideRepository
	OverrideService         *service.PermissionOverrideService
	OverrideCRUDService     *service.PermissionOverrideCRUDService
	DataScopeService        *service.DataScopeService
	FieldPermissionService  *service.FieldPermissionService

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
	overrideRepo := persistence.NewPermissionOverrideRepository(db)

	// 创建权限计算器
	calculator := service.NewPermissionCalculator(permissionRepo, logger)

	// 创建基础服务
	roleService := service.NewRoleService(roleRepo, permissionRepo, db, logger)
	permissionService := service.NewPermissionService(permissionRepo, logger)
	userRoleService := service.NewUserRoleService(userRoleRepo, roleRepo, calculator, logger)

	// 创建 Story 2.6 细粒度权限覆盖服务
	overrideService := service.NewPermissionOverrideService(overrideRepo, logger)
	dataScopeService := service.NewDataScopeService(db, logger)
	fieldPermissionService := service.NewFieldPermissionService(overrideRepo, logger)
	overrideCRUDService := service.NewPermissionOverrideCRUDService(
		overrideRepo,
		overrideService,
		fieldPermissionService,
		logger,
	)

	return &PermissionModule{
		RoleService:            roleService,
		PermissionService:      permissionService,
		UserRoleService:        userRoleService,
		PermissionCalculator:   calculator,
		OverrideRepo:           overrideRepo,
		OverrideService:        overrideService,
		OverrideCRUDService:    overrideCRUDService,
		DataScopeService:       dataScopeService,
		FieldPermissionService: fieldPermissionService,
		RoleRepo:               roleRepo,
		PermissionRepo:         permissionRepo,
		UserRoleRepo:           userRoleRepo,
	}
}
