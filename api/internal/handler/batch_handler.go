package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type BatchHandler struct {
	batchService *service.BatchService
}

func NewBatchHandler(batchService *service.BatchService) *BatchHandler {
	return &BatchHandler{batchService: batchService}
}

func (h *BatchHandler) BatchApprove(c *gin.Context) {
	enterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	enterpriseID, err := uuid.Parse(enterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.NewValidationError("enterprise_id", "企业ID无效"))
		return
	}

	userID := c.GetString(middleware.ContextKeyUserID)
	if userID == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	var req struct {
		InstanceIDs []string `json:"instance_ids"`
	}
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		response.ValidationError(c, "instance_ids", "请求格式错误")
		return
	}

	var ids []uuid.UUID
	for _, idStr := range req.InstanceIDs {
		id, parseErr := uuid.Parse(idStr)
		if parseErr != nil {
			response.ValidationError(c, "instance_ids", "无效的流程实例ID: "+idStr)
			return
		}
		ids = append(ids, id)
	}

	succeeded, failed := h.batchService.BatchApprove(ids, enterpriseID, userID)
	response.Success(c, gin.H{
		"succeeded": succeeded,
		"failed":    failed,
	})
}

func (h *BatchHandler) BatchDelete(c *gin.Context) {
	enterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	enterpriseID, err := uuid.Parse(enterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.NewValidationError("enterprise_id", "企业ID无效"))
		return
	}

	var req struct {
		ResourceType string   `json:"resource_type"`
		IDs          []string `json:"ids"`
	}
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		response.ValidationError(c, "body", "请求格式错误")
		return
	}
	if req.ResourceType == "" {
		response.ValidationError(c, "resource_type", "资源类型不能为空")
		return
	}

	var ids []uuid.UUID
	for _, idStr := range req.IDs {
		id, parseErr := uuid.Parse(idStr)
		if parseErr != nil {
			response.ValidationError(c, "ids", "无效的资源ID: "+idStr)
			return
		}
		ids = append(ids, id)
	}

	succeeded, failed := h.batchService.BatchDelete(req.ResourceType, ids, enterpriseID)
	response.Success(c, gin.H{
		"succeeded": succeeded,
		"failed":    failed,
	})
}

func (h *BatchHandler) BatchStatusChange(c *gin.Context) {
	enterpriseIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseIDStr == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	enterpriseID, err := uuid.Parse(enterpriseIDStr)
	if err != nil {
		response.Error(c, apperrors.NewValidationError("enterprise_id", "企业ID无效"))
		return
	}

	var req struct {
		ResourceType string   `json:"resource_type"`
		IDs          []string `json:"ids"`
		NewStatus    string   `json:"new_status"`
	}
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		response.ValidationError(c, "body", "请求格式错误")
		return
	}
	if req.ResourceType == "" {
		response.ValidationError(c, "resource_type", "资源类型不能为空")
		return
	}
	if req.NewStatus == "" {
		response.ValidationError(c, "new_status", "新状态不能为空")
		return
	}

	var ids []uuid.UUID
	for _, idStr := range req.IDs {
		id, parseErr := uuid.Parse(idStr)
		if parseErr != nil {
			response.ValidationError(c, "ids", "无效的资源ID: "+idStr)
			return
		}
		ids = append(ids, id)
	}

	succeeded, failed := h.batchService.BatchStatusChange(req.ResourceType, ids, enterpriseID, req.NewStatus)
	response.Success(c, gin.H{
		"succeeded": succeeded,
		"failed":    failed,
	})
}
