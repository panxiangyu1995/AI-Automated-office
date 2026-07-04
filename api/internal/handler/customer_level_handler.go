package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type CustomerLevelHandler struct {
	levelService *service.CustomerLevelService
}

func NewCustomerLevelHandler(levelService *service.CustomerLevelService) *CustomerLevelHandler {
	return &CustomerLevelHandler{levelService: levelService}
}

type createLevelRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	MinAmount   float64 `json:"min_amount"`
	Color       string  `json:"color"`
	SortOrder   int     `json:"sort_order"`
}

func (h *CustomerLevelHandler) Create(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	level, appErr := h.levelService.Create(enterpriseID, req.Name, req.Description, req.MinAmount, req.Color, req.SortOrder)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, level)
}

func (h *CustomerLevelHandler) Update(c *gin.Context) {
	levelID := c.Param("id")
	if levelID == "" {
		response.ValidationError(c, "id", "分级ID不能为空")
		return
	}

	var req createLevelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	level, appErr := h.levelService.Update(levelID, req.Name, req.Description, req.MinAmount, req.Color, req.SortOrder)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, level)
}

func (h *CustomerLevelHandler) Delete(c *gin.Context) {
	levelID := c.Param("id")
	if levelID == "" {
		response.ValidationError(c, "id", "分级ID不能为空")
		return
	}

	appErr := h.levelService.Delete(levelID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *CustomerLevelHandler) List(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	levels, appErr := h.levelService.List(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, levels)
}
