package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type PaymentRequestHandler struct{ svc *service.PaymentRequestService }

func NewPaymentRequestHandler(svc *service.PaymentRequestService) *PaymentRequestHandler {
	return &PaymentRequestHandler{svc}
}

// svcFor returns a PaymentRequestService bound to the request's tenant database.
func (h *PaymentRequestHandler) svcFor(c *gin.Context) *service.PaymentRequestService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewPaymentRequestService(repository.NewPaymentRequestRepository(db))
	}
	return h.svc
}

type prCreateReq struct {
	Category     string  `json:"category"`
	Amount       float64 `json:"amount" binding:"required"`
	ApplicantID  *string `json:"applicant_id"`
	Description  string  `json:"description"`
}

type prUpdateReq struct {
	Category    *string  `json:"category"`
	Amount      *float64 `json:"amount"`
	ApplicantID *string  `json:"applicant_id"`
	Description *string  `json:"description"`
}

type prApproveReq struct {
	Comment string `json:"comment"`
}

type prRejectReq struct {
	Reason string `json:"reason" binding:"required"`
}

func (h *PaymentRequestHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req prCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	r, appErr := h.svcFor(c).Create(eid, req.Category, req.Amount, req.ApplicantID, req.Description)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, r)
}

func (h *PaymentRequestHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	items, total, appErr := h.svcFor(c).List(eid, p, ps, status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *PaymentRequestHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	r, appErr := h.svcFor(c).Get(c.Param("id"), eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}

func (h *PaymentRequestHandler) Update(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req prUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	input := make(map[string]interface{})
	if req.Category != nil {
		input["category"] = *req.Category
	}
	if req.Amount != nil {
		input["amount"] = *req.Amount
	}
	if req.ApplicantID != nil {
		input["applicant_id"] = *req.ApplicantID
	}
	if req.Description != nil {
		input["description"] = *req.Description
	}
	r, appErr := h.svcFor(c).Update(c.Param("id"), eid, input)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, r)
}

func (h *PaymentRequestHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	if appErr := h.svcFor(c).Delete(c.Param("id"), eid); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) SubmitForApproval(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	if appErr := h.svcFor(c).SubmitForApproval(c.Param("id"), eid); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) Approve(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	userID := c.GetString("user_id")
	if appErr := h.svcFor(c).Approve(c.Param("id"), eid, userID); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}

func (h *PaymentRequestHandler) Reject(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req prRejectReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	userID := c.GetString("user_id")
	if appErr := h.svcFor(c).Reject(c.Param("id"), eid, userID, req.Reason); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, nil)
}
