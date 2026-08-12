package model

import "github.com/google/uuid"

type CrossEnterprisePermission struct {
	BaseModel
	UserID             uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	SourceEnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"source_enterprise_id"`
	TargetEnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"target_enterprise_id"`
	GrantedBy          uuid.UUID `gorm:"type:uuid;not null" json:"granted_by"`
	Permissions        string    `gorm:"type:text" json:"permissions"`
}

func (CrossEnterprisePermission) TableName() string {
	return "cross_enterprise_permissions"
}
