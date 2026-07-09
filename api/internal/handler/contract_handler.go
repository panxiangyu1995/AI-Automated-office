package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type ContractHandler struct{ svc *service.ContractService }
func NewContractHandler(svc *service.ContractService) *ContractHandler { return &ContractHandler{svc} }

type createContractReq struct {
	CustomerID  string  `json:"customer_id"`
	Name        string  `json:"name"`
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Content     string  `json:"content"`
	Notes       string  `json:"notes"`
	ContractType string `json:"contract_type"`
	TotalAmount float64 `json:"total_amount"`
	StartDate   string  `json:"start_date"`
	EndDate     string  `json:"end_date"`
}

type updateContractReq struct {
	Name    string  `json:"name"`
	Amount  float64 `json:"amount"`
	Content string  `json:"content"`
	Notes   string  `json:"notes"`
}

type statusChangeReq struct{ Status string `json:"status"` }

func (h *ContractHandler) Create(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req createContractReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if req.Name == "" { req.Name = req.Title }
	if req.Amount == 0 { req.Amount = req.TotalAmount }
	contract, appErr := h.svc.Create(eid, req.CustomerID, req.Name, req.Content, req.Notes, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, contract)
}

func (h *ContractHandler) PatchFields(c *gin.Context) {
	var fields map[string]interface{}
	if err := c.ShouldBindJSON(&fields); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	contract, appErr := h.svc.PatchFields(c.Param("id"), fields)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

func (h *ContractHandler) Update(c *gin.Context) {
	var req updateContractReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	contract, appErr := h.svc.Update(c.Param("id"), req.Name, req.Content, req.Notes, req.Amount)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

func (h *ContractHandler) Delete(c *gin.Context) {
	if appErr := h.svc.Delete(c.Param("id")); appErr != nil { response.Error(c, appErr); return }
	response.NoContent(c)
}

func (h *ContractHandler) ChangeStatus(c *gin.Context) {
	var req statusChangeReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	contract, appErr := h.svc.ChangeStatus(c.Param("id"), req.Status)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

func (h *ContractHandler) Get(c *gin.Context) {
	contract, appErr := h.svc.Get(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

type linkDocReq struct {
	RefType string `json:"ref_type"`
	RefID   string `json:"ref_id"`
	RefNo   string `json:"ref_no"`
}

func (h *ContractHandler) SubmitApproval(c *gin.Context) {
	contract, appErr := h.svc.SubmitApproval(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

func (h *ContractHandler) Approve(c *gin.Context) {
	contract, appErr := h.svc.Approve(c.Param("id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, contract)
}

func (h *ContractHandler) UploadAttachment(c *gin.Context) {
	contractID := c.Param("id")
	if contractID == "" { response.ValidationError(c, "id", "合同ID不能为空"); return }
	enterpriseID := c.GetString("enterprise_id")

	file, header, err := c.Request.FormFile("file")
	if err != nil { response.ValidationError(c, "file", "请选择文件"); return }
	defer file.Close()

	att, appErr := h.svc.SaveAttachment(enterpriseID, contractID, header.Filename, header.Header.Get("Content-Type"), header.Size, file)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, att)
}

func (h *ContractHandler) LinkDocument(c *gin.Context) {
	contractID := c.Param("id")
	if contractID == "" { response.ValidationError(c, "id", "合同ID不能为空"); return }
	var req linkDocReq
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	ref, appErr := h.svc.LinkDocument(contractID, req.RefType, req.RefID, req.RefNo)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, ref)
}

func (h *ContractHandler) ListDocuments(c *gin.Context) {
	contractID := c.Param("id")
	if contractID == "" { response.ValidationError(c, "id", "合同ID不能为空"); return }
	refs, appErr := h.svc.ListDocuments(contractID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, refs)
}

func (h *ContractHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	contracts, total, appErr := h.svc.List(eid, p, ps, c.Query("status"))
	if appErr != nil { response.Error(c, appErr); return }
	response.SuccessWithMeta(c, contracts, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
