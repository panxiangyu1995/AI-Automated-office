package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type CustomerHandler struct {
	customerService        *service.CustomerService
	panoramaService        *service.CustomerPanoramaService
}

func NewCustomerHandler(customerService *service.CustomerService, panoramaService *service.CustomerPanoramaService) *CustomerHandler {
	return &CustomerHandler{customerService: customerService, panoramaService: panoramaService}
}

// svcFor returns a CustomerService bound to the request's tenant database.
func (h *CustomerHandler) svcFor(c *gin.Context) *service.CustomerService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewCustomerService(repository.NewCustomerRepository(db))
	}
	return h.customerService
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
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	customer, appErr := h.svcFor(c).Create(enterpriseID, req.Name, req.Industry, req.UnifiedSocialCreditCode, req.Address, req.Notes)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, customer)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
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

	customer, appErr := h.svcFor(c).Update(enterpriseID, customerID, req.Name, req.Industry, req.UnifiedSocialCreditCode, req.Address, req.Notes, req.Level)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, customer)
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}

	appErr := h.svcFor(c).Delete(enterpriseID, customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerID := c.Param("id")
	if customerID == "" {
		response.ValidationError(c, "id", "客户ID不能为空")
		return
	}

	customer, appErr := h.svcFor(c).Get(enterpriseID, customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, customer)
}

func (h *CustomerHandler) List(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	customers, total, appErr := h.svcFor(c).List(enterpriseID, page, pageSize)
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

func (h *CustomerHandler) Panorama(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerIDStr := c.Param("customer_id")
	if customerIDStr == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}

	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "企业ID格式错误")
		return
	}
	custID, err := uuid.Parse(customerIDStr)
	if err != nil {
		response.ValidationError(c, "customer_id", "客户ID格式错误")
		return
	}

	panorama, svcErr := h.panoramaService.GetPanorama(custID, entID)
	if svcErr != nil {
		response.Error(c, errors.ErrInternal.WithDetail("查询客户全景视图失败"))
		return
	}
	if panorama == nil {
		response.Error(c, errors.ErrNotFound.WithDetail("客户不存在"))
		return
	}
	response.Success(c, panorama)
}
