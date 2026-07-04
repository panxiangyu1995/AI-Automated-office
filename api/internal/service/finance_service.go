package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type FinanceService struct{ db *gorm.DB }

func NewFinanceService(db *gorm.DB) *FinanceService { return &FinanceService{db} }

func (s *FinanceService) genNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}

func (s *FinanceService) CreatePayment(eid, customerID, contractID, method, notes string, amount float64) (*model.PaymentRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	r := &model.PaymentRecord{TransactionNo: s.genNo("PAY"), CustomerID: customerID, ContractID: contractID, Amount: amount, PaymentMethod: method, Status: "completed", Notes: notes}
	r.EnterpriseID = id
	if err := s.db.Create(r).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建付款记录失败") }
	return r, nil
}

func (s *FinanceService) GetPayment(id string) (*model.PaymentRecord, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil { return nil, apperrors.NewValidationError("payment_id", "无效") }
	var r model.PaymentRecord
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("付款记录不存在") }
	return &r, nil
}

func (s *FinanceService) ListPayments(eid string, p, ps int) ([]model.PaymentRecord, int64, *apperrors.AppError) {
	return listEntity[model.PaymentRecord](s.db, eid, p, ps)
}

func (s *FinanceService) CreateExpense(eid, category, desc, submittedBy string, amount float64) (*model.ExpenseRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	r := &model.ExpenseRecord{ExpenseNo: s.genNo("EXP"), Amount: amount, Category: category, Status: "pending", SubmittedBy: submittedBy, Description: desc}
	r.EnterpriseID = id
	if err := s.db.Create(r).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建费用记录失败") }
	return r, nil
}

func (s *FinanceService) ApproveExpense(id string) (*model.ExpenseRecord, *apperrors.AppError) {
	eid, err := uuid.Parse(id)
	if err != nil { return nil, apperrors.NewValidationError("expense_id", "无效") }
	var r model.ExpenseRecord
	if err := s.db.Where("id=?", eid).First(&r).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("费用记录不存在") }
	r.Status = "approved"
	s.db.Save(&r)
	return &r, nil
}

func (s *FinanceService) ListExpenses(eid string, p, ps int) ([]model.ExpenseRecord, int64, *apperrors.AppError) {
	return listEntity[model.ExpenseRecord](s.db, eid, p, ps)
}

func (s *FinanceService) CreateInvoice(eid, customerID, notes string, amount, tax float64) (*model.Invoice, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	r := &model.Invoice{InvoiceNo: s.genNo("INV"), CustomerID: customerID, Amount: amount, TaxAmount: tax, Status: "draft", Notes: notes}
	r.EnterpriseID = id
	if err := s.db.Create(r).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建发票失败") }
	return r, nil
}

func (s *FinanceService) ListInvoices(eid string, p, ps int) ([]model.Invoice, int64, *apperrors.AppError) {
	return listEntity[model.Invoice](s.db, eid, p, ps)
}

type genericModel interface {
	TableName() string
}

func listEntity[T genericModel](db *gorm.DB, eid string, p, ps int) ([]T, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	var items []T; var total int64
	var zero T
	q := db.Model(&zero).Where("enterprise_id=?", id)
	if err := q.Count(&total).Error; err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	if err := q.Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}
