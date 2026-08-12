package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type CrossEnterpriseHandler struct {
	crossService *service.CrossEnterpriseService
}

func NewCrossEnterpriseHandler(crossService *service.CrossEnterpriseService) *CrossEnterpriseHandler {
	return &CrossEnterpriseHandler{crossService: crossService}
}

// svcFor returns a CrossEnterpriseService bound to the request's tenant database.
func (h *CrossEnterpriseHandler) svcFor(c *gin.Context) *service.CrossEnterpriseService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewCrossEnterpriseService(repository.NewCrossEnterpriseRepository(db))
	}
	return h.crossService
}

type grantPermissionRequest struct {
	UserID             string `json:"user_id"`
	TargetEnterpriseID string `json:"target_enterprise_id"`
	Permissions        string `json:"permissions"`
}

func (h *CrossEnterpriseHandler) Grant(c *gin.Context) {
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

	var req grantPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	perm, appErr := h.svcFor(c).Grant(req.UserID, enterpriseID, req.TargetEnterpriseID, userID, req.Permissions)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, perm)
}

func (h *CrossEnterpriseHandler) Revoke(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	permissionID := c.Param("id")
	if permissionID == "" {
		response.ValidationError(c, "id", "权限ID不能为空")
		return
	}

	appErr := h.svcFor(c).Revoke(enterpriseID, permissionID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *CrossEnterpriseHandler) ListByUser(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		response.ValidationError(c, "user_id", "用户ID不能为空")
		return
	}

	perms, appErr := h.svcFor(c).ListByUser(userID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, perms)
}
