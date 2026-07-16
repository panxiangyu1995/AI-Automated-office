package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type EnterpriseHandler struct {
	enterpriseService *service.EnterpriseService
}

func NewEnterpriseHandler(enterpriseService *service.EnterpriseService) *EnterpriseHandler {
	return &EnterpriseHandler{enterpriseService: enterpriseService}
}

type createEnterpriseRequest struct {
	GroupID      string `json:"group_id"`
	Name         string `json:"name"`
	Code         string `json:"code"`
	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`
	Address      string `json:"address"`
}

func (h *EnterpriseHandler) Create(c *gin.Context) {
	var req createEnterpriseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	enterprise, appErr := h.enterpriseService.Create(req.GroupID, req.Name, req.Code, req.ContactEmail, req.ContactPhone, req.Address)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, enterprise)
}

func (h *EnterpriseHandler) Update(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	var req struct {
		Name         string `json:"name"`
		ContactEmail string `json:"contact_email"`
		ContactPhone string `json:"contact_phone"`
		Address      string `json:"address"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	enterprise, appErr := h.enterpriseService.Update(enterpriseID, req.Name, req.ContactEmail, req.ContactPhone, req.Address)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, enterprise)
}

func (h *EnterpriseHandler) Get(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	enterprise, appErr := h.enterpriseService.Get(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, enterprise)
}

func (h *EnterpriseHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	enterprises, total, appErr := h.enterpriseService.List(page, pageSize)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, enterprises, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}

func (h *EnterpriseHandler) ChangeStatus(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	var req struct {
		Status     string `json:"status" binding:"required"`
		Reason     string `json:"reason"`
		OperatorID string `json:"operator_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	enterprise, appErr := h.enterpriseService.ChangeStatus(enterpriseID, req.Status, req.Reason, req.OperatorID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, enterprise)
}

func (h *EnterpriseHandler) GetStatusLog(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	logs, appErr := h.enterpriseService.GetStatusLog(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, logs)
}
