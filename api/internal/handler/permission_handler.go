package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type PermissionHandler struct {
	permService *service.PermissionService
}

func NewPermissionHandler(permService *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{permService: permService}
}

func (h *PermissionHandler) List(c *gin.Context) {
	perms, appErr := h.permService.ListPermissions()
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, perms)
}

func (h *PermissionHandler) Check(c *gin.Context) {
	var ctx model.PermissionContext
	if err := c.ShouldBindJSON(&ctx); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	roleStr := c.GetString(middleware.ContextKeyRole)
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)

	if ctx.Subject == nil {
		ctx.Subject = &model.Subject{
			UserID:       userIDStr,
			Role:         roleStr,
			EnterpriseID: entIDStr,
		}
	}

	decision, appErr := h.permService.CheckPermission(&ctx)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, decision)
}

type RoleHandler struct {
	permService *service.PermissionService
}

func NewRoleHandler(permService *service.PermissionService) *RoleHandler {
	return &RoleHandler{permService: permService}
}

func (h *RoleHandler) List(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if entIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	roles, appErr := h.permService.ListRoles(entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, roles)
}

func (h *RoleHandler) Create(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if entIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	role := &model.Role{
		EnterpriseID: entID,
		Name:         req.Name,
		Description:  req.Description,
	}

	if appErr := h.permService.CreateRole(role); appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, role)
}

func (h *RoleHandler) GetPermissions(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := uuid.Parse(roleIDStr)
	if err != nil {
		response.ValidationError(c, "id", "角色ID无效")
		return
	}

	perms, appErr := h.permService.GetRolePermissions(roleID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, perms)
}

func (h *RoleHandler) SetPermissions(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := uuid.Parse(roleIDStr)
	if err != nil {
		response.ValidationError(c, "id", "角色ID无效")
		return
	}

	var req struct {
		PermissionIDs []string `json:"permission_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	permIDs := make([]uuid.UUID, 0, len(req.PermissionIDs))
	for _, idStr := range req.PermissionIDs {
		id, parseErr := uuid.Parse(idStr)
		if parseErr != nil {
			response.ValidationError(c, "permission_ids", "权限ID无效: "+idStr)
			return
		}
		permIDs = append(permIDs, id)
	}

	if appErr := h.permService.SetRolePermissions(roleID, permIDs); appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{"message": "权限已更新"})
}
