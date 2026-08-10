package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type platformRepo struct {
	db *gorm.DB
}

func NewPlatformRepository(db *gorm.DB) PlatformRepository {
	return &platformRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *platformRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *platformRepo) CreateServiceTicket(t *model.ServiceTicket) error {
	return r.fresh().Create(t).Error
}

func (r *platformRepo) ListServiceTickets(enterpriseID uuid.UUID) ([]model.ServiceTicket, error) {
	var tickets []model.ServiceTicket
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Order("created_at DESC").Find(&tickets).Error
	return tickets, err
}

func (r *platformRepo) CreateAnnouncement(a *model.Announcement) error {
	return r.fresh().Create(a).Error
}

func (r *platformRepo) ListAnnouncements(enterpriseID uuid.UUID) ([]model.Announcement, error) {
	var anns []model.Announcement
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Order("created_at DESC").Find(&anns).Error
	return anns, err
}

func (r *platformRepo) CreateUsageBill(b *model.UsageBill) error {
	return r.fresh().Create(b).Error
}

func (r *platformRepo) ListBills(enterpriseID uuid.UUID) ([]model.UsageBill, error) {
	var bills []model.UsageBill
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Order("created_at DESC").Find(&bills).Error
	return bills, err
}

func (r *platformRepo) CreateServiceConfig(sc *model.ServiceConfig) error {
	return r.fresh().Create(sc).Error
}

func (r *platformRepo) FindServiceConfig(enterpriseID uuid.UUID, configKey string) (*model.ServiceConfig, error) {
	var sc model.ServiceConfig
	if err := r.fresh().Where("enterprise_id=? AND config_key=?", enterpriseID, configKey).First(&sc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &sc, nil
}

func (r *platformRepo) ListEmployees(enterpriseID uuid.UUID) ([]model.Employee, error) {
	var employees []model.Employee
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Find(&employees).Error
	return employees, err
}

func (r *platformRepo) CountEmployees(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *platformRepo) CountCustomers(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Customer{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *platformRepo) CountContracts(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Contract{}).Where("enterprise_id=?", enterpriseID).Count(&count).Error
	return count, err
}
