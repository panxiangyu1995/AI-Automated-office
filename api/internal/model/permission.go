package model

import "github.com/google/uuid"

type Role struct {
	BaseModel
	EnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	Name         string    `gorm:"type:varchar(50);not null" json:"name"`
	Description  string    `gorm:"type:varchar(200)" json:"description"`
	IsSystem     bool      `gorm:"default:false" json:"is_system"`
}

func (Role) TableName() string { return "roles" }

type Permission struct {
	BaseModel
	Code        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Resource    string `gorm:"type:varchar(50);not null" json:"resource"`
	Action      string `gorm:"type:varchar(50);not null" json:"action"`
	Description string `gorm:"type:varchar(200)" json:"description"`
}

func (Permission) TableName() string { return "permissions" }

type RolePermission struct {
	RoleID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"role_id"`
	PermissionID uuid.UUID `gorm:"type:uuid;primaryKey" json:"permission_id"`
}

func (RolePermission) TableName() string { return "role_permissions" }

type EmployeePermissionABAC struct {
	BaseModel
	EmployeeID   uuid.UUID `gorm:"type:uuid;not null;index" json:"employee_id"`
	PermissionID uuid.UUID `gorm:"type:uuid;not null" json:"permission_id"`
	Conditions   JSONB     `gorm:"type:jsonb;default:'{}'" json:"conditions"`
	GrantedBy    uuid.UUID `gorm:"type:uuid;not null" json:"granted_by"`
}

func (EmployeePermissionABAC) TableName() string { return "employee_permission_abac" }

type PermissionAttr struct {
	BaseModel
	PermissionID uuid.UUID `gorm:"type:uuid;not null;index" json:"permission_id"`
	AttrKey      string    `gorm:"type:varchar(100);not null" json:"attr_key"`
	AttrType     string    `gorm:"type:varchar(50);not null" json:"attr_type"`
	AttrConfig   JSONB     `gorm:"type:jsonb;not null" json:"attr_config"`
}

func (PermissionAttr) TableName() string { return "permission_attrs" }

type CustomRule struct {
	BaseModel
	EnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	RuleType     string    `gorm:"type:varchar(50);not null" json:"rule_type"`
	CasbinRule   string    `gorm:"type:text;not null" json:"casbin_rule"`
	Priority     int       `gorm:"default:0" json:"priority"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
}

func (CustomRule) TableName() string { return "custom_rules" }

type JSONB map[string]interface{}
