package model

import (
	"time"

	"gorm.io/gorm"
)

// Department 部门模型
type Department struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID  string         `gorm:"type:uuid;not null;index:idx_departments_tenant_parent" json:"tenant_id"`
	ParentID  *string        `gorm:"type:uuid;index:idx_departments_tenant_parent" json:"parent_id,omitempty"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Code      string         `gorm:"size:50;uniqueIndex:idx_departments_tenant_code" json:"code,omitempty"`
	LeaderID  *string        `gorm:"type:uuid;index" json:"leader_id,omitempty"`
	Level     int            `gorm:"default:1" json:"level"`
	Path      string         `gorm:"size:500" json:"path,omitempty"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	Status    string         `gorm:"size:20;default:active;index:idx_departments_tenant_status" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName 指定表名
func (Department) TableName() string {
	return "departments"
}

// Position 岗位模型
type Position struct {
	ID           string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID     string         `gorm:"type:uuid;not null;index:idx_positions_tenant_dept" json:"tenant_id"`
	DepartmentID *string        `gorm:"type:uuid;index:idx_positions_tenant_dept" json:"department_id,omitempty"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Code         string         `gorm:"size:50;uniqueIndex:idx_positions_tenant_code" json:"code,omitempty"`
	Description  string         `gorm:"type:text" json:"description,omitempty"`
	Level        *int           `json:"level,omitempty"`
	SortOrder    int            `gorm:"default:0" json:"sort_order"`
	Status       string         `gorm:"size:20;default:active" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName 指定表名
func (Position) TableName() string {
	return "positions"
}

// DepartmentClosure 闭包表（用于优化树查询）
type DepartmentClosure struct {
	AncestorID   string `gorm:"type:uuid;primaryKey" json:"ancestor_id"`
	DescendantID string `gorm:"type:uuid;primaryKey" json:"descendant_id"`
	Depth        int    `gorm:"not null" json:"depth"`
}

// TableName 指定表名
func (DepartmentClosure) TableName() string {
	return "department_closure"
}
