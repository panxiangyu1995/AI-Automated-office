package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type MaterialHandler struct {
	matService *service.MaterialService
}

func NewMaterialHandler(matService *service.MaterialService) *MaterialHandler { return &MaterialHandler{matService: matService} }

type createMatRequest struct {
	Name         string  `json:"name"`
	SKUCode      string  `json:"sku_code"`
	MaterialType string  `json:"material_type"`
	Category     string  `json:"category"`
	Spec         string  `json:"spec"`
	Unit         string  `json:"unit"`
	UnitPrice    float64 `json:"unit_price"`
}

type updateMatRequest struct {
	Name         string  `json:"name"`
	MaterialType string  `json:"material_type"`
	Spec         string  `json:"spec"`
	Unit         string  `json:"unit"`
	UnitPrice    float64 `json:"unit_price"`
	Status       string  `json:"status"`
}

func (h *MaterialHandler) Create(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req createMatRequest
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "请求体格式错误"); return }
	if req.MaterialType == "" {
		req.MaterialType = req.Category
	}
	m, appErr := h.matService.Create(enterpriseID, req.Name, req.SKUCode, req.MaterialType, req.Spec, req.Unit, req.UnitPrice)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, m)
}

func (h *MaterialHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" { response.Error(c, errors.ErrTenantRequired); return }
	matID := c.Param("id")
	if matID == "" { response.ValidationError(c, "id", "物料ID不能为空"); return }
	var req updateMatRequest
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "请求体格式错误"); return }
	m, appErr := h.matService.Update(enterpriseID, matID, req.Name, req.MaterialType, req.Spec, req.Unit, req.UnitPrice, req.Status)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, m)
}

func (h *MaterialHandler) Delete(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" { response.Error(c, errors.ErrTenantRequired); return }
	matID := c.Param("id")
	if matID == "" { response.ValidationError(c, "id", "物料ID不能为空"); return }
	appErr := h.matService.Delete(enterpriseID, matID)
	if appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *MaterialHandler) Get(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" { response.Error(c, errors.ErrTenantRequired); return }
	matID := c.Param("id")
	if matID == "" { response.ValidationError(c, "id", "物料ID不能为空"); return }
	m, appErr := h.matService.Get(enterpriseID, matID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, m)
}

func (h *MaterialHandler) List(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" { response.Error(c, errors.ErrTenantRequired); return }
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	ms, total, appErr := h.matService.List(enterpriseID, page, pageSize)
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, ms, &response.MetaInfo{TotalCount: total, Page: page, PageSize: pageSize})
}
