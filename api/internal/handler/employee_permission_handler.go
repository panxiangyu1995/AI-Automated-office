package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type EmployeePermissionHandler struct {
	permService *service.EmployeePermissionService
}

func NewEmployeePermissionHandler(permService *service.EmployeePermissionService) *EmployeePermissionHandler {
	return &EmployeePermissionHandler{permService: permService}
}

// svcFor returns a EmployeePermissionService bound to the request's tenant database.
func (h *EmployeePermissionHandler) svcFor(c *gin.Context) *service.EmployeePermissionService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewEmployeePermissionService(repository.NewEmployeePermissionRepository(db))
	}
	return h.permService
}

type setPermissionRequest struct {
	Permission string `json:"permission"`
	Effect     string `json:"effect"`
}

func (h *EmployeePermissionHandler) Set(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized)
		return
	}
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	var req setPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	perm, appErr := h.svcFor(c).Set(enterpriseID, employeeID, req.Permission, userID, req.Effect)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, perm)
}

func (h *EmployeePermissionHandler) Revoke(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}
	permission := c.Query("permission")
	if permission == "" {
		response.ValidationError(c, "permission", "权限不能为空")
		return
	}

	appErr := h.svcFor(c).Revoke(enterpriseID, employeeID, permission)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *EmployeePermissionHandler) List(c *gin.Context) {
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	perms, appErr := h.svcFor(c).ListByEmployee(employeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, perms)
}
