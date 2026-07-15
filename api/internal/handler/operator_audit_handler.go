package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OperatorAuditHandler struct {
	operatorAuditService *service.OperatorAuditService
}

func NewOperatorAuditHandler(operatorAuditService *service.OperatorAuditService) *OperatorAuditHandler {
	return &OperatorAuditHandler{operatorAuditService: operatorAuditService}
}

func (h *OperatorAuditHandler) ListOperatorActions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	action := c.Query("action")
	userID := c.Query("user_id")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	logs, total, err := h.operatorAuditService.ListOperatorActions(page, pageSize, action, userID, startTime, endTime)
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail(err.Error()))
		return
	}
	response.SuccessWithMeta(c, logs, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}
