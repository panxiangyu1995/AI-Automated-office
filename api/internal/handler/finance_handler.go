package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
	"github.com/ai-office/api/internal/model"
)

type FinanceHandler struct{ db *gorm.DB }
func NewFinanceHandler(db *gorm.DB) *FinanceHandler { return &FinanceHandler{db} }

func (h *FinanceHandler) CreatePayment(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var r model.PaymentRecord
	if err := c.ShouldBindJSON(&r); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	r.TransactionNo = "PAY-" + eid[:8]
	if err := h.db.Create(&r).Error; err != nil { response.Error(c, errors.ErrInternal); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListPayments(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var items []model.PaymentRecord; var total int64
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	h.db.Model(&model.PaymentRecord{}).Where("enterprise_id=?", eid).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items)
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var r model.ExpenseRecord
	if err := c.ShouldBindJSON(&r); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if err := h.db.Create(&r).Error; err != nil { response.Error(c, errors.ErrInternal); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListExpenses(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var items []model.ExpenseRecord; var total int64
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	h.db.Model(&model.ExpenseRecord{}).Where("enterprise_id=?", eid).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items)
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *FinanceHandler) CreateInvoice(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var r model.Invoice
	if err := c.ShouldBindJSON(&r); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if err := h.db.Create(&r).Error; err != nil { response.Error(c, errors.ErrInternal); return }
	response.Created(c, r)
}

func (h *FinanceHandler) ListInvoices(c *gin.Context) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var items []model.Invoice; var total int64
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	h.db.Model(&model.Invoice{}).Where("enterprise_id=?", eid).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items)
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
