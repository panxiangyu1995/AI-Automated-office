package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type RestoreHandler struct{ svc *service.RestoreService }

func NewRestoreHandler(svc *service.RestoreService) *RestoreHandler {
	return &RestoreHandler{svc}
}

// svcFor returns a RestoreService bound to the request's tenant database.
func (h *RestoreHandler) svcFor(c *gin.Context) *service.RestoreService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewRestoreService(repository.NewRestoreRepository(db))
	}
	return h.svc
}

func (h *RestoreHandler) Restore(c *gin.Context) {
	eid := c.GetString("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	resourceType := c.Param("type")
	id := c.Param("id")
	if appErr := h.svcFor(c).Restore(eid, resourceType, id); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}
