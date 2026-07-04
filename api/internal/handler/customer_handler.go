package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type CustomerHandler struct {
	customerService *service.CustomerService
}

func NewCustomerHandler(customerService *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{customerService: customerService}
}

type createCustomerRequest struct {
	Name                   string `json:"name"`
	Industry               string `json:"industry"`
	UnifiedSocialCreditCode string `json:"unified_social_credit_code"`
	Address                string `json:"address"`
	Notes                  string `json:"notes"`
}

type updateCustomerRequest struct {
	Name                   string `json:"name"`
	Industry               string `json:"industry"`
	UnifiedSocialCreditCode string `json:"unified_social_credit_code"`
	Address                string `json:"address"`
	Notes                  string `json:"notes"`
	Level                  string `json:"level"`
}

func (h *CustomerHandler) Create(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	customer, appErr := h.customerService.Create(enterpriseID, req.Name, req.Industry, req.UnifiedSocialCreditCode, req.Address, req.Notes)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, customer)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}

	var req updateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	customer, appErr := h.customerService.Update(customerID, req.Name, req.Industry, req.UnifiedSocialCreditCode, req.Address, req.Notes, req.Level)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, customer)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}

	appErr := h.customerService.Delete(customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}

	customer, appErr := h.customerService.Get(customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, customer)
}

func (h *CustomerHandler) List(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	customers, total, appErr := h.customerService.List(enterpriseID, page, pageSize)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, customers, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}
