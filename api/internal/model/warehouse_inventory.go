package model

import "github.com/google/uuid"

type WarehouseInventory struct {
	TenantModel
	WarehouseID uuid.UUID `gorm:"type:uuid;not null;index" json:"warehouse_id"`
	MaterialID  uuid.UUID `gorm:"type:uuid;not null;index" json:"material_id"`
	Quantity    int       `gorm:"not null;default:0" json:"quantity"`
	SafetyStock int       `gorm:"not null;default:0" json:"safety_stock"`
	InTransit   int       `gorm:"not null;default:0" json:"in_transit"`
}

func (WarehouseInventory) TableName() string { return "warehouse_inventories" }
