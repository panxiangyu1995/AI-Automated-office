package handler

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type OpportunityHandler struct {
	oppService *service.OpportunityService
}

func NewOpportunityHandler(oppService *service.OpportunityService) *OpportunityHandler {
	return &OpportunityHandler{oppService: oppService}
}

// svcFor returns a OpportunityService bound to the request's tenant database.
func (h *OpportunityHandler) svcFor(c *gin.Context) *service.OpportunityService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewOpportunityService(repository.NewOpportunityRepository(db), repository.NewCustomerRepository(db))
	}
	return h.oppService
}

type createOppRequest struct {
	CustomerID      string  `json:"customer_id"`
	Name            string  `json:"name"`
	Amount          float64 `json:"amount"`
	ExpectedCloseAt string  `json:"expected_close_at"`
	Description     string  `json:"description"`
}

type updateOppRequest struct {
	Name            string  `json:"name"`
	Status          string  `json:"status"`
	Amount          float64 `json:"amount"`
	ExpectedCloseAt string  `json:"expected_close_at"`
	Description     string  `json:"description"`
}

func (h *OpportunityHandler) Get(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	opID := c.Param("id")
	if opID == "" {
		response.ValidationError(c, "id", "商机ID不能为空")
		return
	}
	op, appErr := h.svcFor(c).GetByID(enterpriseID, opID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, op)
}

func (h *OpportunityHandler) Create(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createOppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	var closeAt *time.Time
	if req.ExpectedCloseAt != "" {
		t, err := time.Parse("2006-01-02", req.ExpectedCloseAt)
		if err == nil {
			closeAt = &t
		}
	}

	op, appErr := h.svcFor(c).Create(enterpriseID, req.CustomerID, req.Name, req.Description, req.Amount, closeAt)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, op)
}

func (h *OpportunityHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	opID := c.Param("id")
	if opID == "" {
		response.ValidationError(c, "id", "商机ID不能为空")
		return
	}

	var req updateOppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	var closeAt *time.Time
	if req.ExpectedCloseAt != "" {
		t, err := time.Parse("2006-01-02", req.ExpectedCloseAt)
		if err == nil {
			closeAt = &t
		}
	}

	op, appErr := h.svcFor(c).Update(enterpriseID, opID, req.Name, req.Status, req.Description, req.Amount, closeAt)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, op)
}

func (h *OpportunityHandler) Delete(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	opID := c.Param("id")
	if opID == "" {
		response.ValidationError(c, "id", "商机ID不能为空")
		return
	}
	appErr := h.svcFor(c).Delete(enterpriseID, opID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.NoContent(c)
}

func (h *OpportunityHandler) ListByCustomer(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}
	ops, _, appErr := h.svcFor(c).ListByCustomer(customerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, ops)
}
