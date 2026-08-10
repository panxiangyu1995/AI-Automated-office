package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type financeRepo struct {
	db *gorm.DB
}

func NewFinanceRepository(db *gorm.DB) FinanceRepository {
	return &financeRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *financeRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *financeRepo) CreatePayment(rec *model.PaymentRecord) error {
	return r.fresh().Create(rec).Error
}

func (r *financeRepo) FindPaymentByID(id, enterpriseID uuid.UUID) (*model.PaymentRecord, error) {
	var rec model.PaymentRecord
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *financeRepo) ListPayments(enterpriseID uuid.UUID, page, pageSize int) ([]model.PaymentRecord, int64, error) {
	var items []model.PaymentRecord
	var total int64
	q := r.fresh().Model(&model.PaymentRecord{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *financeRepo) CreateExpense(rec *model.ExpenseRecord) error {
	return r.fresh().Create(rec).Error
}

func (r *financeRepo) FindExpenseByID(id, enterpriseID uuid.UUID) (*model.ExpenseRecord, error) {
	var rec model.ExpenseRecord
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *financeRepo) UpdateExpense(rec *model.ExpenseRecord) error {
	return r.fresh().Save(rec).Error
}

func (r *financeRepo) ListExpenses(enterpriseID uuid.UUID, page, pageSize int) ([]model.ExpenseRecord, int64, error) {
	var items []model.ExpenseRecord
	var total int64
	q := r.fresh().Model(&model.ExpenseRecord{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *financeRepo) CreateInvoice(inv *model.Invoice) error {
	return r.fresh().Create(inv).Error
}

func (r *financeRepo) ListInvoices(enterpriseID uuid.UUID, page, pageSize int) ([]model.Invoice, int64, error) {
	var items []model.Invoice
	var total int64
	q := r.fresh().Model(&model.Invoice{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *financeRepo) CreateReceivable(rec *model.Receivable) error {
	return r.fresh().Create(rec).Error
}

func (r *financeRepo) FindReceivableByID(id, enterpriseID uuid.UUID) (*model.Receivable, error) {
	var rec model.Receivable
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *financeRepo) ListReceivables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Receivable, int64, error) {
	var items []model.Receivable
	var total int64
	q := r.fresh().Model(&model.Receivable{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *financeRepo) CreatePayable(p *model.Payable) error {
	return r.fresh().Create(p).Error
}

func (r *financeRepo) FindPayableByID(id, enterpriseID uuid.UUID) (*model.Payable, error) {
	var p model.Payable
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&p).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *financeRepo) ListPayables(enterpriseID uuid.UUID, page, pageSize int) ([]model.Payable, int64, error) {
	var items []model.Payable
	var total int64
	q := r.fresh().Model(&model.Payable{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}
