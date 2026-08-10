package repository

import (
	"time"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type employeeRepo struct {
	db *gorm.DB
}

func NewEmployeeRepository(db *gorm.DB) EmployeeRepository {
	return &employeeRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *employeeRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *employeeRepo) Create(employee *model.Employee) error {
	return r.fresh().Create(employee).Error
}

func (r *employeeRepo) Update(employee *model.Employee) error {
	return r.fresh().Save(employee).Error
}

func (r *employeeRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.Employee{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *employeeRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Employee, error) {
	var emp model.Employee
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&emp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepo) FindByEmail(email string, enterpriseID uuid.UUID) (*model.Employee, error) {
	var emp model.Employee
	err := r.fresh().Where("email = ? AND enterprise_id = ?", email, enterpriseID).First(&emp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepo) List(query model.EmployeeQuery) ([]model.Employee, int64, error) {
	var employees []model.Employee
	var total int64

	q := r.fresh().Model(&model.Employee{})

	if query.EnterpriseID != "" {
		eid, err := uuid.Parse(query.EnterpriseID)
		if err == nil {
			q = q.Where("enterprise_id = ?", eid)
		}
	}
	if query.DepartmentID != "" {
		did, err := uuid.Parse(query.DepartmentID)
		if err == nil {
			q = q.Where("department_id = ?", did)
		}
	}
	if query.Role != "" {
		q = q.Where("role = ?", query.Role)
	}
	if query.Status != "" {
		q = q.Where("status = ?", query.Status)
	}
	if query.Search != "" {
		search := "%" + strings.ToLower(query.Search) + "%"
		q = q.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ?", search, search, search)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count employees: %w", err)
	}

	page, pageSize := query.Page, query.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&employees).Error; err != nil {
		return nil, 0, fmt.Errorf("list employees: %w", err)
	}
	return employees, total, nil
}

func (r *employeeRepo) CountByEnterprise(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("enterprise_id = ?", enterpriseID).Count(&count).Error
	return count, err
}

func (r *employeeRepo) CountActiveByEnterprise(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("enterprise_id = ? AND status = 'active'", enterpriseID).Count(&count).Error
	return count, err
}

func (r *employeeRepo) CountByDepartment(deptID uuid.UUID) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Employee{}).Where("department_id = ? AND status = 'active'", deptID).Count(&count).Error
	return count, err
}

func (r *employeeRepo) FindByIDNoEnterprise(id string) (*model.Employee, error) {
	var emp model.Employee
	err := r.fresh().Where("id = ?", id).First(&emp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepo) UpdateFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Employee{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Updates(fields).Error
}

func (r *employeeRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return r.UpdateFields(id, enterpriseID, fields)
}
