package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type PositionHandler struct {
	positionService *service.PositionService
}

func NewPositionHandler(positionService *service.PositionService) *PositionHandler {
	return &PositionHandler{positionService: positionService}
}

type createPositionRequest struct {
	DepartmentID string `json:"department_id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
}

type updatePositionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *PositionHandler) Create(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createPositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	position, appErr := h.positionService.Create(enterpriseID, req.DepartmentID, req.Name, req.Description)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, position)
}

func (h *PositionHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	positionID := c.Param("id")
	if positionID == "" {
		response.ValidationError(c, "id", "岗位ID不能为空")
		return
	}

	var req updatePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	position, appErr := h.positionService.Update(enterpriseID, positionID, req.Name, req.Description)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, position)
}

func (h *PositionHandler) List(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	positions, appErr := h.positionService.List(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, positions)
}
