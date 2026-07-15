package service

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockFinanceRepo struct {
	payments    map[string]*model.PaymentRecord
	expenses    map[string]*model.ExpenseRecord
	invoices    map[string]*model.Invoice
	receivables map[string]*model.Receivable
	payables    map[string]*model.Payable
}

func newMockFinanceRepo() *mockFinanceRepo {
	return &mockFinanceRepo{
		payments:    make(map[string]*model.PaymentRecord),
		expenses:    make(map[string]*model.ExpenseRecord),
		invoices:    make(map[string]*model.Invoice),
		receivables: make(map[string]*model.Receivable),
		payables:    make(map[string]*model.Payable),
	}
}

func (m *mockFinanceRepo) CreatePayment(r *model.PaymentRecord) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	m.payments[r.ID.String()] = r
	return nil
}

func (m *mockFinanceRepo) FindPaymentByID(id, enterpriseID uuid.UUID) (*model.PaymentRecord, error) {
	r, ok := m.payments[id.String()]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockFinanceRepo) ListPayments(enterpriseID uuid.UUID, page, pageSize int) ([]model.PaymentRecord, int64, error) {
	var result []model.PaymentRecord
	for _, r := range m.payments {
		if r.EnterpriseID == enterpriseID {
			result = append(result, *r)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockFinanceRepo) CreateExpense(r *model.ExpenseRecord) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	m.expenses[r.ID.String()] = r
	return nil
}

func (m *mockFinanceRepo) FindExpenseByID(id, enterpriseID uuid.UUID) (*model.ExpenseRecord, error) {
	r, ok := m.expenses[id.String()]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockFinanceRepo) UpdateExpense(r *model.ExpenseRecord) error {
	m.expenses[r.ID.String()] = r
	return nil
}

func (m *mockFinanceRepo) ListExpenses(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExpenseRecord, int64, error) {
	var result []model.ExpenseRecord
	for _, r := range m.expenses {
		if r.EnterpriseID == enterpriseID {
			result = append(result, *r)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockFinanceRepo) CreateInvoice(r *model.Invoice) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	m.invoices[r.ID.String()] = r
	return nil
}

func (m *mockFinanceRepo) ListInvoices(enterpriseID uuid.UUID, page, pageSize int) ([]model.Invoice, int64, error) {
	var result []model.Invoice
	for _, r := range m.invoices {
		if r.EnterpriseID == enterpriseID {
			result = append(result, *r)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockFinanceRepo) CreateReceivable(r *model.Receivable) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	m.receivables[r.ID.String()] = r
	return nil
}

func (m *mockFinanceRepo) FindReceivableByID(id, enterpriseID uuid.UUID) (*model.Receivable, error) {
	r, ok := m.receivables[id.String()]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockFinanceRepo) ListReceivables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Receivable, int64, error) {
	var result []model.Receivable
	for _, r := range m.receivables {
		if r.EnterpriseID == enterpriseID {
			result = append(result, *r)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockFinanceRepo) CreatePayable(p *model.Payable) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	m.payables[p.ID.String()] = p
	return nil
}

func (m *mockFinanceRepo) FindPayableByID(id, enterpriseID uuid.UUID) (*model.Payable, error) {
	p, ok := m.payables[id.String()]
	if !ok {
		return nil, nil
	}
	return p, nil
}

func (m *mockFinanceRepo) ListPayables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Payable, int64, error) {
	var result []model.Payable
	for _, p := range m.payables {
		if p.EnterpriseID == enterpriseID {
			result = append(result, *p)
		}
	}
	return result, int64(len(result)), nil
}

type mockFinanceRepoWithError struct{}

func (m *mockFinanceRepoWithError) CreatePayment(r *model.PaymentRecord) error        { return errors.New("db error") }
func (m *mockFinanceRepoWithError) FindPaymentByID(id, enterpriseID uuid.UUID) (*model.PaymentRecord, error) {
	return nil, nil
}
func (m *mockFinanceRepoWithError) ListPayments(enterpriseID uuid.UUID, page, pageSize int) ([]model.PaymentRecord, int64, error) {
	return nil, 0, errors.New("db error")
}
func (m *mockFinanceRepoWithError) CreateExpense(r *model.ExpenseRecord) error         { return errors.New("db error") }
func (m *mockFinanceRepoWithError) FindExpenseByID(id, enterpriseID uuid.UUID) (*model.ExpenseRecord, error) {
	return nil, nil
}
func (m *mockFinanceRepoWithError) UpdateExpense(r *model.ExpenseRecord) error         { return errors.New("db error") }
func (m *mockFinanceRepoWithError) ListExpenses(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExpenseRecord, int64, error) {
	return nil, 0, errors.New("db error")
}
func (m *mockFinanceRepoWithError) CreateInvoice(r *model.Invoice) error               { return errors.New("db error") }
func (m *mockFinanceRepoWithError) ListInvoices(enterpriseID uuid.UUID, page, pageSize int) ([]model.Invoice, int64, error) {
	return nil, 0, errors.New("db error")
}
func (m *mockFinanceRepoWithError) CreateReceivable(r *model.Receivable) error         { return errors.New("db error") }
func (m *mockFinanceRepoWithError) FindReceivableByID(id, enterpriseID uuid.UUID) (*model.Receivable, error) {
	return nil, nil
}
func (m *mockFinanceRepoWithError) ListReceivables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Receivable, int64, error) {
	return nil, 0, errors.New("db error")
}
func (m *mockFinanceRepoWithError) CreatePayable(p *model.Payable) error               { return errors.New("db error") }
func (m *mockFinanceRepoWithError) FindPayableByID(id, enterpriseID uuid.UUID) (*model.Payable, error) {
	return nil, nil
}
func (m *mockFinanceRepoWithError) ListPayables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Payable, int64, error) {
	return nil, 0, errors.New("db error")
}

func TestFinanceService_CreatePayment(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	payment, appErr := svc.CreatePayment(eid, uuid.New().String(), uuid.New().String(), "bank_transfer", "备注", 5000)
	assert.Nil(t, appErr)
	assert.NotNil(t, payment)
	assert.Contains(t, payment.TransactionNo, "PAY-")
	assert.Equal(t, "completed", payment.Status)
	assert.Equal(t, 5000.0, payment.Amount)
}

func TestFinanceService_GetPayment(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	created, _ := svc.CreatePayment(eid, uuid.New().String(), "", "cash", "", 1000)

	found, appErr := svc.GetPayment(created.ID.String(), eid)
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, 1000.0, found.Amount)
}

func TestFinanceService_GetPayment_NotFound(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)

	found, appErr := svc.GetPayment(uuid.New().String(), uuid.New().String())
	assert.Nil(t, found)
	assert.NotNil(t, appErr)
	assert.Equal(t, 404, appErr.Status)
}

func TestFinanceService_CreateExpense(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	expense, appErr := svc.CreateExpense(eid, "travel", "出差报销", uuid.New().String(), 3000)
	assert.Nil(t, appErr)
	assert.NotNil(t, expense)
	assert.Contains(t, expense.ExpenseNo, "EXP-")
	assert.Equal(t, "pending", expense.Status)
	assert.Equal(t, 3000.0, expense.Amount)
}

func TestFinanceService_ApproveExpense(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	created, _ := svc.CreateExpense(eid, "travel", "出差报销", uuid.New().String(), 3000)

	approved, appErr := svc.ApproveExpense(created.ID.String(), eid)
	assert.Nil(t, appErr)
	assert.NotNil(t, approved)
	assert.Equal(t, "approved", approved.Status)
}

func TestFinanceService_CreateInvoice(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	invoice, appErr := svc.CreateInvoice(eid, uuid.New().String(), "备注", 10000, 600)
	assert.Nil(t, appErr)
	assert.NotNil(t, invoice)
	assert.Contains(t, invoice.InvoiceNo, "INV-")
	assert.Equal(t, "draft", invoice.Status)
	assert.Equal(t, 10000.0, invoice.Amount)
	assert.Equal(t, 600.0, invoice.TaxAmount)
}

func TestFinanceService_CreateReceivable(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New()

	r := &model.Receivable{
		CustomerID: uuid.New().String(),
		Amount:     10000,
		Status:     "draft",
	}
	r.EnterpriseID = eid

	appErr := svc.CreateReceivable(r)
	assert.Nil(t, appErr)
	assert.Contains(t, r.ReceivableNo, "RCV-")
}

func TestFinanceService_GetReceivable(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New()

	r := &model.Receivable{CustomerID: uuid.New().String(), Amount: 5000, Status: "draft"}
	r.EnterpriseID = eid
	svc.CreateReceivable(r)

	found, appErr := svc.GetReceivable(r.ID, eid)
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, 5000.0, found.Amount)
}

func TestFinanceService_GetReceivable_NotFound(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)

	found, appErr := svc.GetReceivable(uuid.New(), uuid.New())
	assert.Nil(t, found)
	assert.NotNil(t, appErr)
	assert.Equal(t, 404, appErr.Status)
}

func TestFinanceService_CreatePayable(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New()

	p := &model.Payable{
		SupplierID: uuid.New().String(),
		Amount:     8000,
		Status:     "draft",
	}
	p.EnterpriseID = eid

	appErr := svc.CreatePayable(p)
	assert.Nil(t, appErr)
	assert.Contains(t, p.PayableNo, "PAY-AP-")
}

func TestFinanceService_GetPayable(t *testing.T) {
	repo := newMockFinanceRepo()
	svc := NewFinanceService(repo)
	eid := uuid.New()

	p := &model.Payable{SupplierID: uuid.New().String(), Amount: 7000, Status: "draft"}
	p.EnterpriseID = eid
	svc.CreatePayable(p)

	found, appErr := svc.GetPayable(p.ID, eid)
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, 7000.0, found.Amount)
}

func TestFinanceService_CreatePayment_DBError(t *testing.T) {
	repo := &mockFinanceRepoWithError{}
	svc := NewFinanceService(repo)
	eid := uuid.New().String()

	payment, appErr := svc.CreatePayment(eid, uuid.New().String(), "", "cash", "", 1000)
	assert.Nil(t, payment)
	assert.NotNil(t, appErr)
	assert.Equal(t, 500, appErr.Status)
}

func TestFinanceService_CreateReceivable_DBError(t *testing.T) {
	repo := &mockFinanceRepoWithError{}
	svc := NewFinanceService(repo)
	eid := uuid.New()

	r := &model.Receivable{CustomerID: uuid.New().String(), Amount: 1000, Status: "draft"}
	r.EnterpriseID = eid

	appErr := svc.CreateReceivable(r)
	assert.NotNil(t, appErr)
	assert.Equal(t, 500, appErr.Status)
}
