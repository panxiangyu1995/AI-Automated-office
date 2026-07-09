package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type RestoreHandler struct{ svc *service.RestoreService }

func NewRestoreHandler(svc *service.RestoreService) *RestoreHandler {
	return &RestoreHandler{svc}
}

func (h *RestoreHandler) Restore(c *gin.Context) {
	eid := c.GetString("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	resourceType := c.Param("type")
	id := c.Param("id")
	if appErr := h.svc.Restore(eid, resourceType, id); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}
