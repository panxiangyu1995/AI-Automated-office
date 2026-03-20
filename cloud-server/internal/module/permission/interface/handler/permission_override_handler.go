package handler

import (
	"errors"
	"net/http"
	"strings"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// PermissionOverrideHandler 权限覆盖处理器
type PermissionOverrideHandler struct {
	overrideCRUDService *service.PermissionOverrideCRUDService
	overrideService     *service.PermissionOverrideService
	dataScopeService    *service.DataScopeService
	fieldService        *service.FieldPermissionService
	logger              *zap.Logger
}

// NewPermissionOverrideHandler 创建权限覆盖处理器
func NewPermissionOverrideHandler(
	overrideCRUDService *service.PermissionOverrideCRUDService,
	overrideService *service.PermissionOverrideService,
	dataScopeService *service.DataScopeService,
	fieldService *service.FieldPermissionService,
	logger *zap.Logger,
) *PermissionOverrideHandler {
	return &PermissionOverrideHandler{
		overrideCRUDService: overrideCRUDService,
		overrideService:     overrideService,
		dataScopeService:    dataScopeService,
		fieldService:        fieldService,
		logger:              logger,
	}
}

// GetUserOverrides 获取用户权限覆盖
// GET /api/admin/users/:id/permission-overrides
func (h *PermissionOverrideHandler) GetUserOverrides(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	req := &service.GetUserOverridesRequest{
		UserID:   userID,
		Resource: c.Query("resource"),
	}

	result, err := h.overrideCRUDService.GetUserOverrides(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("failed to get user overrides", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取用户权限覆盖失败", nil)
		return
	}

	response.Success(c, gin.H{"data": result}, "")
}

// UpdateUserOverrides 批量更新用户权限覆盖
// PUT /api/admin/users/:id/permission-overrides
func (h *PermissionOverrideHandler) UpdateUserOverrides(c *gin.Context) {
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

	var req service.UpdateUserOverridesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	operatorID := getOperatorID(c)

	err := h.overrideCRUDService.UpdateUserOverrides(c.Request.Context(), tenantID, userID, operatorID, &req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidOverrideType) {
			response.Error(c, http.StatusBadRequest, "INVALID_OVERRIDE_TYPE", "无效的覆盖类型", nil)
			return
		}
		if errors.Is(err, service.ErrInvalidDataScope) {
			response.Error(c, http.StatusBadRequest, "INVALID_DATA_SCOPE", "无效的数据范围配置", nil)
			return
		}
		if errors.Is(err, service.ErrInvalidFieldRestriction) {
			response.Error(c, http.StatusBadRequest, "INVALID_FIELD_RESTRICTION", "无效的字段限制配置", nil)
			return
		}
		if errors.Is(err, service.ErrInvalidDateRange) {
			response.Error(c, http.StatusBadRequest, "INVALID_DATE_RANGE", "有效期配置无效", nil)
			return
		}
		h.logger.Error("failed to update user overrides", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "更新用户权限覆盖失败", nil)
		return
	}

	response.Success(c, gin.H{"id": userID}, "用户权限覆盖更新成功")
}

// CreateOverride 添加权限覆盖项
// POST /api/admin/users/:id/permission-overrides
func (h *PermissionOverrideHandler) CreateOverride(c *gin.Context) {
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

	var req struct {
		Resource         string                       `json:"resource"`
		PermissionID     *string                      `json:"permission_id,omitempty"`
		OverrideType     model.OverrideType           `json:"override_type"`
		DataScope        *service.DataScopeInput      `json:"data_scope,omitempty"`
		FieldRestrictions model.FieldRestrictionsMap  `json:"field_restrictions,omitempty"`
		EffectiveFrom    *string                      `json:"effective_from,omitempty"`
		EffectiveUntil   *string                      `json:"effective_until,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "请求参数错误", nil)
		return
	}

	// 清理输入
	req.Resource = strings.TrimSpace(req.Resource)

	operatorID := getOperatorID(c)

	createReq := &service.CreateOverrideRequest{
		TenantID:         tenantID,
		UserID:           userID,
		Resource:         req.Resource,
		PermissionID:     req.PermissionID,
		OverrideType:     req.OverrideType,
		DataScope:        req.DataScope,
		FieldRestrictions: req.FieldRestrictions,
		EffectiveFrom:    req.EffectiveFrom,
		EffectiveUntil:   req.EffectiveUntil,
		CreatedBy:        operatorID,
	}

	result, err := h.overrideCRUDService.CreateOverride(c.Request.Context(), createReq)
	if err != nil {
		if errors.Is(err, service.ErrInvalidOverrideType) {
			response.Error(c, http.StatusBadRequest, "INVALID_OVERRIDE_TYPE", "无效的覆盖类型", nil)
			return
		}
		if strings.Contains(err.Error(), "already exists") {
			response.Error(c, http.StatusConflict, "OVERRIDE_EXISTS", "该用户对此资源的权限覆盖已存在", nil)
			return
		}
		h.logger.Error("failed to create override", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "创建权限覆盖失败", nil)
		return
	}

	response.Created(c, gin.H{"data": result}, "权限覆盖创建成功")
}

// DeleteOverride 删除权限覆盖项
// DELETE /api/admin/users/:id/permission-overrides/:overrideId
func (h *PermissionOverrideHandler) DeleteOverride(c *gin.Context) {
	overrideID := c.Param("overrideId")
	if overrideID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "权限覆盖ID不能为空", nil)
		return
	}

	err := h.overrideCRUDService.DeleteOverride(c.Request.Context(), overrideID)
	if err != nil {
		if errors.Is(err, service.ErrOverrideNotFound) {
			response.Error(c, http.StatusNotFound, "OVERRIDE_NOT_FOUND", "权限覆盖不存在", nil)
			return
		}
		h.logger.Error("failed to delete override", zap.Error(err), zap.String("overrideID", overrideID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "删除权限覆盖失败", nil)
		return
	}

	response.NoContent(c)
}

// GetUserPermissionResult 获取用户完整权限结果
// GET /api/admin/users/:id/permission-result
func (h *PermissionOverrideHandler) GetUserPermissionResult(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	resource := c.Query("resource")
	if resource == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "资源标识不能为空", nil)
		return
	}

	// 获取用户基础权限（通过角色）
	basePermissions := make(map[string]bool)
	// TODO: 从 PermissionCalculator 获取基础权限

	// 获取完整权限结果
	result, err := h.overrideService.GetPermissionResult(c.Request.Context(), userID, resource, basePermissions)
	if err != nil {
		h.logger.Error("failed to get permission result", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取权限结果失败", nil)
		return
	}

	response.Success(c, result, "")
}

// GetDataScope 获取用户数据范围
// GET /api/admin/users/:id/data-scope
func (h *PermissionOverrideHandler) GetDataScope(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	resource := c.Query("resource")

	dataScope, err := h.overrideService.GetDataScope(c.Request.Context(), userID, resource)
	if err != nil {
		h.logger.Error("failed to get data scope", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取数据范围失败", nil)
		return
	}

	response.Success(c, dataScope, "")
}

// GetFieldRestrictions 获取字段限制
// GET /api/admin/users/:id/field-restrictions
func (h *PermissionOverrideHandler) GetFieldRestrictions(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "用户ID不能为空", nil)
		return
	}

	resource := c.Query("resource")
	if resource == "" {
		response.Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "资源标识不能为空", nil)
		return
	}

	restrictions, err := h.fieldService.GetFieldRestrictions(c.Request.Context(), userID, resource)
	if err != nil {
		h.logger.Error("failed to get field restrictions", zap.Error(err), zap.String("userID", userID))
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "获取字段限制失败", nil)
		return
	}

	response.Success(c, restrictions, "")
}

// RegisterRoutes 注册路由
func (h *PermissionOverrideHandler) RegisterRoutes(r *gin.RouterGroup) {
	users := r.Group("/admin/users")
	{
		users.GET("/:id/permission-overrides", h.GetUserOverrides)
		users.PUT("/:id/permission-overrides", h.UpdateUserOverrides)
		users.POST("/:id/permission-overrides", h.CreateOverride)
		users.DELETE("/:id/permission-overrides/:overrideId", h.DeleteOverride)
		users.GET("/:id/permission-result", h.GetUserPermissionResult)
		users.GET("/:id/data-scope", h.GetDataScope)
		users.GET("/:id/field-restrictions", h.GetFieldRestrictions)
	}
}
