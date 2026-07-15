package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type FinanceRepository interface {
	CreatePayment(r *model.PaymentRecord) error
	FindPaymentByID(id, enterpriseID uuid.UUID) (*model.PaymentRecord, error)
	ListPayments(enterpriseID uuid.UUID, page, pageSize int) ([]model.PaymentRecord, int64, error)
	CreateExpense(r *model.ExpenseRecord) error
	FindExpenseByID(id, enterpriseID uuid.UUID) (*model.ExpenseRecord, error)
	UpdateExpense(r *model.ExpenseRecord) error
	ListExpenses(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExpenseRecord, int64, error)
	CreateInvoice(r *model.Invoice) error
	ListInvoices(enterpriseID uuid.UUID, page, pageSize int) ([]model.Invoice, int64, error)
	CreateReceivable(r *model.Receivable) error
	FindReceivableByID(id, enterpriseID uuid.UUID) (*model.Receivable, error)
	ListReceivables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Receivable, int64, error)
	CreatePayable(p *model.Payable) error
	FindPayableByID(id, enterpriseID uuid.UUID) (*model.Payable, error)
	ListPayables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Payable, int64, error)
}
