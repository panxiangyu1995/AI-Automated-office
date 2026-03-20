package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// PermissionHandler 权限处理器
type PermissionHandler struct {
	RoleService       *service.RoleService
	PermissionService *service.PermissionService
	UserRoleService   *service.UserRoleService
	Logger            *zap.Logger
}

// NewPermissionHandler 创建权限处理器
func NewPermissionHandler(
	roleService *service.RoleService,
	permissionService *service.PermissionService,
	userRoleService *service.UserRoleService,
	logger *zap.Logger,
) *PermissionHandler {
	return &PermissionHandler{
		RoleService:       roleService,
		PermissionService: permissionService,
		UserRoleService:   userRoleService,
		Logger:            logger,
	}
}

// getTenantID 从上下文获取租户ID
func getTenantID(c *gin.Context) string {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return ""
	}
	if id, ok := tenantID.(string); ok {
		return id
	}
	return ""
}

// getOperatorID 从上下文获取操作者ID
func getOperatorID(c *gin.Context) string {
	operatorID, exists := c.Get("user_id")
	if !exists {
		return ""
	}
	if id, ok := operatorID.(string); ok {
		return id
	}
	return ""
}

// ==================== 角色管理 ====================

// ListRoles 角色列表
// GET /api/admin/roles
func (h *PermissionHandler) ListRoles(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	req := &service.ListRolesRequest{
		Page:     page,
		PageSize: pageSize,
		Name:     c.Query("name"),
		Code:     c.Query("code"),
	}

	if roleType := c.Query("type"); roleType != "" {
		req.Type = model.RoleType(roleType)
	}
	if layer := c.Query("layer"); layer != "" {
		req.Layer = model.PermissionLayer(layer)
	}

	result, err := h.RoleService.ListRoles(c.Request.Context(), tenantID, req)
	if err != nil {
		h.Logger.Error("failed to list roles", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取角色列表失败", nil)
		return
	}

	response.Success(c, result, "")
}

// GetRole 角色详情
// GET /api/admin/roles/:id
func (h *PermissionHandler) GetRole(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	roleID := c.Param("id")
	if roleID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "角色ID不能为空", nil)
		return
	}

	result, err := h.RoleService.GetRoleDetail(c.Request.Context(), tenantID, roleID)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		h.Logger.Error("failed to get role", zap.Error(err), zap.String("roleID", roleID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取角色详情失败", nil)
		return
	}

	response.Success(c, result, "")
}

// CreateRole 创建角色
// POST /api/admin/roles
func (h *PermissionHandler) CreateRole(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	var req service.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 去除空白
	req.Name = strings.TrimSpace(req.Name)
	req.Code = strings.TrimSpace(req.Code)
	req.Description = strings.TrimSpace(req.Description)

	result, err := h.RoleService.CreateRole(c.Request.Context(), tenantID, &req)
	if err != nil {
		if errors.Is(err, service.ErrRoleCodeDuplicate) {
			response.Error(c, http.StatusConflict, "ROLE_CODE_DUPLICATE", "角色编码已存在", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to create role", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建角色失败", nil)
		return
	}

	response.Success(c, result, "角色创建成功")
}

// UpdateRole 更新角色
// PUT /api/admin/roles/:id
func (h *PermissionHandler) UpdateRole(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	roleID := c.Param("id")
	if roleID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "角色ID不能为空", nil)
		return
	}

	var req service.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)

	err := h.RoleService.UpdateRole(c.Request.Context(), tenantID, roleID, &req)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		if errors.Is(err, service.ErrSystemRoleImmutable) {
			response.Error(c, http.StatusForbidden, "SYSTEM_ROLE_IMMUTABLE", "系统角色不可修改", nil)
			return
		}
		h.Logger.Error("failed to update role", zap.Error(err), zap.String("roleID", roleID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新角色失败", nil)
		return
	}

	response.Success(c, gin.H{"id": roleID}, "角色更新成功")
}

// DeleteRole 删除角色
// DELETE /api/admin/roles/:id
func (h *PermissionHandler) DeleteRole(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	roleID := c.Param("id")
	if roleID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "角色ID不能为空", nil)
		return
	}

	err := h.RoleService.DeleteRole(c.Request.Context(), tenantID, roleID)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		if errors.Is(err, service.ErrSystemRoleImmutable) {
			response.Error(c, http.StatusForbidden, "SYSTEM_ROLE_IMMUTABLE", "系统角色不可删除", nil)
			return
		}
		if errors.Is(err, service.ErrValidation) {
			response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		h.Logger.Error("failed to delete role", zap.Error(err), zap.String("roleID", roleID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "删除角色失败", nil)
		return
	}

	response.Success(c, gin.H{"id": roleID}, "角色删除成功")
}

// GetRolePermissions 获取角色权限
// GET /api/admin/roles/:id/permissions
func (h *PermissionHandler) GetRolePermissions(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	roleID := c.Param("id")
	if roleID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "角色ID不能为空", nil)
		return
	}

	result, err := h.RoleService.GetRolePermissions(c.Request.Context(), tenantID, roleID)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		h.Logger.Error("failed to get role permissions", zap.Error(err), zap.String("roleID", roleID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取角色权限失败", nil)
		return
	}

	response.Success(c, gin.H{"data": result}, "")
}

// UpdateRolePermissions 更新角色权限
// PUT /api/admin/roles/:id/permissions
func (h *PermissionHandler) UpdateRolePermissions(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	roleID := c.Param("id")
	if roleID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "角色ID不能为空", nil)
		return
	}

	var req service.UpdateRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	err := h.RoleService.UpdateRolePermissions(c.Request.Context(), tenantID, roleID, &req)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		if errors.Is(err, service.ErrSystemRoleImmutable) {
			response.Error(c, http.StatusForbidden, "SYSTEM_ROLE_IMMUTABLE", "系统角色不可修改权限", nil)
			return
		}
		h.Logger.Error("failed to update role permissions", zap.Error(err), zap.String("roleID", roleID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新角色权限失败", nil)
		return
	}

	response.Success(c, gin.H{"id": roleID}, "角色权限更新成功")
}

// ==================== 权限管理 ====================

// ListPermissions 权限列表
// GET /api/admin/permissions
func (h *PermissionHandler) ListPermissions(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// 检查是否按层级分组
	if c.Query("grouped") == "true" {
		result, err := h.PermissionService.GetPermissionsGroupedByLayer(c.Request.Context(), tenantID)
		if err != nil {
			h.Logger.Error("failed to get grouped permissions", zap.Error(err))
			response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取权限列表失败", nil)
			return
		}
		response.Success(c, result, "")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	req := &service.ListPermissionsRequest{
		Page:     page,
		PageSize: pageSize,
		Code:     c.Query("code"),
		Resource: c.Query("resource"),
	}

	if action := c.Query("action"); action != "" {
		req.Action = model.PermissionAction(action)
	}
	if layer := c.Query("layer"); layer != "" {
		req.Layer = model.PermissionLayer(layer)
	}

	result, err := h.PermissionService.ListPermissions(c.Request.Context(), tenantID, req)
	if err != nil {
		h.Logger.Error("failed to list permissions", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取权限列表失败", nil)
		return
	}

	response.Success(c, result, "")
}

// CheckPermission 检查权限
// POST /api/admin/permissions/check
func (h *PermissionHandler) CheckPermission(c *gin.Context) {
	var req service.CheckPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	result, err := h.PermissionService.CheckPermission(c.Request.Context(), &req)
	if err != nil {
		h.Logger.Error("failed to check permission", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "检查权限失败", nil)
		return
	}

	response.Success(c, result, "")
}

// ==================== 用户角色管理 ====================

// GetUserRoles 获取用户角色
// GET /api/admin/users/:id/roles
func (h *PermissionHandler) GetUserRoles(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	result, err := h.UserRoleService.GetUserRoles(c.Request.Context(), userID)
	if err != nil {
		h.Logger.Error("failed to get user roles", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取用户角色失败", nil)
		return
	}

	response.Success(c, result, "")
}

// UpdateUserRoles 更新用户角色
// PUT /api/admin/users/:id/roles
func (h *PermissionHandler) UpdateUserRoles(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	var req service.UpdateUserRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	assignedBy := getOperatorID(c)

	result, err := h.UserRoleService.UpdateUserRoles(c.Request.Context(), tenantID, userID, assignedBy, &req)
	if err != nil {
		if errors.Is(err, service.ErrRoleNotFound) {
			response.Error(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在", nil)
			return
		}
		h.Logger.Error("failed to update user roles", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新用户角色失败", nil)
		return
	}

	response.Success(c, result, "用户角色更新成功")
}

// RegisterRoutes 注册路由
func (h *PermissionHandler) RegisterRoutes(r *gin.RouterGroup) {
	// 角色路由
	roles := r.Group("/admin/roles")
	{
		roles.GET("", h.ListRoles)
		roles.GET("/:id", h.GetRole)
		roles.POST("", h.CreateRole)
		roles.PUT("/:id", h.UpdateRole)
		roles.DELETE("/:id", h.DeleteRole)
		roles.GET("/:id/permissions", h.GetRolePermissions)
		roles.PUT("/:id/permissions", h.UpdateRolePermissions)
	}

	// 权限路由
	permissions := r.Group("/admin/permissions")
	{
		permissions.GET("", h.ListPermissions)
		permissions.POST("/check", h.CheckPermission)
	}

	// 用户角色路由（需要添加到 admin handler 中）
	// 这里单独注册用户角色相关的路由
	users := r.Group("/admin/users")
	{
		users.GET("/:id/roles", h.GetUserRoles)
		users.PUT("/:id/roles", h.UpdateUserRoles)
	}
}
