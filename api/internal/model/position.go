package model

type Position struct {
	TenantModel
	DepartmentID *string `gorm:"type:uuid;index" json:"department_id,omitempty"`
	Name         string  `gorm:"type:varchar(100);not null" json:"name"`
	Description  string  `gorm:"type:text" json:"description,omitempty"`
}

func (Position) TableName() string {
	return "positions"
}
