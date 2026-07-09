package model

type RepairOrder struct {
	TenantModel
	ServiceOrderID string  `gorm:"type:uuid;not null;index" json:"service_order_id"`
	FaultPoint     string  `gorm:"type:text" json:"fault_point"`
	RepairContent  string  `gorm:"type:text" json:"repair_content"`
	TechnicianID   *string `gorm:"type:uuid" json:"technician_id,omitempty"`
	Status         string  `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Notes          string  `gorm:"type:text" json:"notes,omitempty"`
}

func (RepairOrder) TableName() string { return "repair_orders" }
