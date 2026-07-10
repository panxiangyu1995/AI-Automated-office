package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type CustomerTagHandler struct {
	tagService *service.CustomerTagService
}

func NewCustomerTagHandler(tagService *service.CustomerTagService) *CustomerTagHandler {
	return &CustomerTagHandler{tagService: tagService}
}

type addTagRequest struct {
	Tag string `json:"tag"`
}

func (h *CustomerTagHandler) AddTag(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerID := c.Param("customer_id")
	if customerID == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}

	var req addTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	tag, appErr := h.tagService.AddTag(enterpriseID, customerID, req.Tag)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, tag)
}

func (h *CustomerTagHandler) RemoveTag(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}
	tag := c.Query("tag")
	if tag == "" {
		response.ValidationError(c, "tag", "标签不能为空")
		return
	}

	appErr := h.tagService.RemoveTag(customerID, tag)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *CustomerTagHandler) ListByCustomer(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}

	tags, appErr := h.tagService.ListByCustomer(customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, tags)
}

func (h *CustomerTagHandler) ListByEnterprise(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	tags, appErr := h.tagService.ListByEnterprise(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, tags)
}
