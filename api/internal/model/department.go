package model

import "github.com/google/uuid"

type Department struct {
	TenantModel
	Name      string     `gorm:"type:varchar(255);not null" json:"name"`
	ParentID  *uuid.UUID `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	ManagerID *uuid.UUID `gorm:"type:uuid" json:"manager_id,omitempty"`
}

func (Department) TableName() string {
	return "departments"
}

type DepartmentTreeNode struct {
	Department
	Children []*DepartmentTreeNode `json:"children,omitempty"`
}
