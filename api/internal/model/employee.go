package model

import (
	"time"

	"github.com/google/uuid"
)

type Employee struct {
	TenantModel
	DepartmentID uuid.UUID  `gorm:"type:uuid;not null;index" json:"department_id"`
	Name         string     `gorm:"type:varchar(100);not null" json:"name"`
	Email        string     `gorm:"type:varchar(255)" json:"email,omitempty"`
	Phone        string     `gorm:"type:varchar(50)" json:"phone,omitempty"`
	Position     string     `gorm:"type:varchar(100)" json:"position,omitempty"`
	EmployeeNo   string     `gorm:"type:varchar(100);index" json:"employee_no,omitempty"`
	Role         string     `gorm:"type:varchar(50);default:'employee'" json:"role"`
	Status       string     `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	HireDate     *time.Time `json:"hire_date,omitempty"`
	ResignDate   *time.Time `json:"resign_date,omitempty"`
}

func (Employee) TableName() string {
	return "employees"
}

type EmployeeQuery struct {
	EnterpriseID string
	DepartmentID string
	Role         string
	Status       string
	Search       string
	Page         int
	PageSize     int
}
