package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type FinanceService struct {
	repo repository.FinanceRepository
}

func NewFinanceService(repo repository.FinanceRepository) *FinanceService {
	return &FinanceService{repo}
}

func (s *FinanceService) genNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}

func (s *FinanceService) CreatePayment(eid, customerID, contractID, method, notes string, amount float64) (*model.PaymentRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r := &model.PaymentRecord{TransactionNo: s.genNo("PAY"), CustomerID: strPtr(customerID), ContractID: strPtr(contractID), Amount: amount, PaymentMethod: method, Status: "completed", Notes: notes}
	r.EnterpriseID = id
	if err := s.repo.CreatePayment(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建付款记录失败")
	}
	return r, nil
}

func (s *FinanceService) GetPayment(id, enterpriseID string) (*model.PaymentRecord, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("payment_id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindPaymentByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询付款记录失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("付款记录不存在")
	}
	return r, nil
}

func (s *FinanceService) ListPayments(eid string, p, ps int) ([]model.PaymentRecord, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	items, total, dbErr := s.repo.ListPayments(id, p, ps)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *FinanceService) CreateExpense(eid, category, desc, submittedBy string, amount float64) (*model.ExpenseRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	subBy := strPtr(submittedBy)
	if submittedBy == "" {
		subBy = nil
	}
	r := &model.ExpenseRecord{ExpenseNo: s.genNo("EXP"), Amount: amount, Category: category, Status: "pending", SubmittedBy: subBy, Description: desc}
	r.EnterpriseID = id
	if err := s.repo.CreateExpense(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建费用记录失败")
	}
	return r, nil
}

func (s *FinanceService) ApproveExpense(id, enterpriseID string) (*model.ExpenseRecord, *apperrors.AppError) {
	eid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("expense_id", "无效")
	}
	entID, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindExpenseByID(eid, entID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询费用记录失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("费用记录不存在")
	}
	r.Status = "approved"
	if err := s.repo.UpdateExpense(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("审批费用记录失败")
	}
	return r, nil
}

func (s *FinanceService) ListExpenses(eid string, p, ps int) ([]model.ExpenseRecord, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	items, total, dbErr := s.repo.ListExpenses(id, p, ps)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *FinanceService) CreateInvoice(eid, customerID, notes string, amount, tax float64) (*model.Invoice, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	var custIDPtr *string
	if customerID != "" {
		custIDPtr = &customerID
	}
	r := &model.Invoice{InvoiceNo: s.genNo("INV"), CustomerID: custIDPtr, Amount: amount, TaxAmount: tax, Status: "draft", Notes: notes}
	r.EnterpriseID = id
	if err := s.repo.CreateInvoice(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建发票失败")
	}
	return r, nil
}

func (s *FinanceService) ListInvoices(eid string, p, ps int) ([]model.Invoice, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	items, total, dbErr := s.repo.ListInvoices(id, p, ps)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *FinanceService) CreateReceivable(eid, customerID string, salesOrderID, contractID *string, amount float64, dueDate *string) (*model.Receivable, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r := &model.Receivable{ReceivableNo: s.genNo("RCV"), CustomerID: customerID, SalesOrderID: salesOrderID, ContractID: contractID, Amount: amount, Status: "draft"}
	r.EnterpriseID = id
	if dueDate != nil && *dueDate != "" {
		t, parseErr := parseTime(*dueDate)
		if parseErr == nil {
			r.DueDate = &t
		}
	}
	if err := s.repo.CreateReceivable(r); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建应收款失败")
	}
	return r, nil
}

func (s *FinanceService) GetReceivable(id, enterpriseID uuid.UUID) (*model.Receivable, *apperrors.AppError) {
	r, dbErr := s.repo.FindReceivableByID(id, enterpriseID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询应收款失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("应收款不存在")
	}
	return r, nil
}

func (s *FinanceService) ListReceivables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Receivable, int64, *apperrors.AppError) {
	items, total, dbErr := s.repo.ListReceivables(enterpriseID, page, pageSize)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func (s *FinanceService) CreatePayable(eid, supplierID string, purchaseOrderID *string, amount float64, dueDate *string) (*model.Payable, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	p := &model.Payable{PayableNo: s.genNo("PAY-AP"), SupplierID: supplierID, PurchaseOrderID: purchaseOrderID, Amount: amount, Status: "draft"}
	p.EnterpriseID = id
	if dueDate != nil && *dueDate != "" {
		t, parseErr := parseTime(*dueDate)
		if parseErr == nil {
			p.DueDate = &t
		}
	}
	if err := s.repo.CreatePayable(p); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建应付款失败")
	}
	return p, nil
}

func (s *FinanceService) GetPayable(id, enterpriseID uuid.UUID) (*model.Payable, *apperrors.AppError) {
	p, dbErr := s.repo.FindPayableByID(id, enterpriseID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询应付款失败")
	}
	if p == nil {
		return nil, apperrors.ErrNotFound.WithDetail("应付款不存在")
	}
	return p, nil
}

func (s *FinanceService) ListPayables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Payable, int64, *apperrors.AppError) {
	items, total, dbErr := s.repo.ListPayables(enterpriseID, page, pageSize)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func parseTime(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
