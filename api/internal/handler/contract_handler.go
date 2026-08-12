package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
	"strconv"
)

type ContractHandler struct {
	svc            *service.ContractService
	autoArchiveSvc *service.AutoArchiveService
}

func NewContractHandler(svc *service.ContractService, autoArchiveSvc *service.AutoArchiveService) *ContractHandler {
	return &ContractHandler{svc: svc, autoArchiveSvc: autoArchiveSvc}
}

// svcFor returns a ContractService bound to the request's tenant database.
func (h *ContractHandler) svcFor(c *gin.Context) *service.ContractService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewContractService(repository.NewContractRepository(db))
	}
	return h.svc
}

type createContractReq struct {
	CustomerID   string  `json:"customer_id"`
	Name         string  `json:"name"`
	Title        string  `json:"title"`
	Amount       float64 `json:"amount"`
	Content      string  `json:"content"`
	Notes        string  `json:"notes"`
	ContractType string  `json:"contract_type"`
	TotalAmount  float64 `json:"total_amount"`
	StartDate    string  `json:"start_date"`
	EndDate      string  `json:"end_date"`
}

type updateContractReq struct {
	Name    string  `json:"name"`
	Amount  float64 `json:"amount"`
	Content string  `json:"content"`
	Notes   string  `json:"notes"`
}

type statusChangeReq struct {
	Status string `json:"status"`
}

func (h *ContractHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req createContractReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	if req.Name == "" {
		req.Name = req.Title
	}
	if req.Amount == 0 {
		req.Amount = req.TotalAmount
	}
	contract, appErr := h.svcFor(c).Create(eid, req.CustomerID, req.Name, req.Content, req.Notes, req.Amount)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, contract)
}

func (h *ContractHandler) PatchFields(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var fields map[string]interface{}
	if err := c.ShouldBindJSON(&fields); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	contract, appErr := h.svcFor(c).PatchFields(eid, c.Param("id"), fields)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contract)
}

func (h *ContractHandler) Update(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req updateContractReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	contract, appErr := h.svcFor(c).Update(eid, c.Param("id"), req.Name, req.Content, req.Notes, req.Amount)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contract)
}

func (h *ContractHandler) Delete(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	if appErr := h.svcFor(c).Delete(eid, c.Param("id")); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.NoContent(c)
}

func (h *ContractHandler) ChangeStatus(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req statusChangeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	contract, appErr := h.svcFor(c).ChangeStatus(eid, c.Param("id"), req.Status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contract)
}

func (h *ContractHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	contract, appErr := h.svcFor(c).Get(eid, c.Param("id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contract)
}

type linkDocReq struct {
	RefType string `json:"ref_type"`
	RefID   string `json:"ref_id"`
	RefNo   string `json:"ref_no"`
}

func (h *ContractHandler) SubmitApproval(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	contract, appErr := h.svcFor(c).SubmitApproval(eid, c.Param("id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contract)
}

func (h *ContractHandler) Approve(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	contract, appErr := h.svcFor(c).Approve(eid, c.Param("id"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	if h.autoArchiveSvc != nil {
		eid := middleware.GetEnterpriseID(c)
		go h.autoArchiveSvc.OnBusinessEvent("contract_signed", c.Param("id"), eid)
	}
	response.Success(c, contract)
}

func (h *ContractHandler) UploadAttachment(c *gin.Context) {
	contractID := c.Param("id")
	if contractID == "" {
		response.ValidationError(c, "id", "合同ID不能为空")
		return
	}
	enterpriseID := middleware.GetEnterpriseID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.ValidationError(c, "file", "请选择文件")
		return
	}
	defer file.Close()

	att, appErr := h.svcFor(c).SaveAttachment(enterpriseID, contractID, header.Filename, header.Header.Get("Content-Type"), header.Size, file)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, att)
}

func (h *ContractHandler) LinkDocument(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	contractID := c.Param("id")
	if contractID == "" {
		response.ValidationError(c, "id", "合同ID不能为空")
		return
	}
	var req linkDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	ref, appErr := h.svcFor(c).LinkDocument(eid, contractID, req.RefType, req.RefID, req.RefNo)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, ref)
}

func (h *ContractHandler) ListDocuments(c *gin.Context) {
	contractID := c.Param("id")
	if contractID == "" {
		response.ValidationError(c, "id", "合同ID不能为空")
		return
	}
	refs, appErr := h.svcFor(c).ListDocuments(contractID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, refs)
}

func (h *ContractHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	contracts, total, appErr := h.svcFor(c).List(eid, p, ps, c.Query("status"))
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, contracts, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
