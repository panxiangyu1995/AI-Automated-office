package model

import "github.com/google/uuid"

type EmployeePermission struct {
	TenantModel
	EmployeeID uuid.UUID `gorm:"type:uuid;not null;index" json:"employee_id"`
	Permission string    `gorm:"type:varchar(100);not null" json:"permission"`
	GrantedBy  uuid.UUID `gorm:"type:uuid;not null" json:"granted_by"`
	Effect     string    `gorm:"type:varchar(10);not null;default:'allow'" json:"effect"`
}

func (EmployeePermission) TableName() string {
	return "employee_permissions"
}
