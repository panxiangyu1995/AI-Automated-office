package model

import "time"

type StockFlow struct {
	TenantModel
	WarehouseID   string    `gorm:"type:uuid;not null;index" json:"warehouse_id"`
	MaterialID    string    `gorm:"type:uuid;not null;index" json:"material_id"`
	FlowType      string    `gorm:"type:varchar(30);not null" json:"flow_type"`
	Quantity      int       `gorm:"not null" json:"quantity"`
	BatchNo       string    `gorm:"type:varchar(100)" json:"batch_no,omitempty"`
	BeforeQty     int       `json:"before_qty"`
	AfterQty      int       `json:"after_qty"`
	ReferenceID   string    `gorm:"type:uuid" json:"reference_id,omitempty"`
	ReferenceType string    `gorm:"type:varchar(50)" json:"reference_type,omitempty"`
	FlowTime      time.Time `gorm:"autoCreateTime" json:"flow_time"`
}

func (StockFlow) TableName() string { return "stock_flows" }

type MaterialPrice struct {
	TenantModel
	MaterialID string  `gorm:"type:uuid;not null;index" json:"material_id"`
	Level      string  `gorm:"type:varchar(30);not null" json:"level"`
	UnitPrice  float64 `gorm:"type:numeric(15,2);not null" json:"unit_price"`
}

func (MaterialPrice) TableName() string { return "material_prices" }

type InventoryCheck struct {
	TenantModel
	WarehouseID string `gorm:"type:uuid;not null;index" json:"warehouse_id"`
	CheckNo     string `gorm:"type:varchar(100);not null" json:"check_no"`
	Status      string `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	CheckedBy   string `gorm:"type:uuid" json:"checked_by,omitempty"`
	CheckedAt   *time.Time `json:"checked_at,omitempty"`
	Notes       string `gorm:"type:text" json:"notes,omitempty"`
}

func (InventoryCheck) TableName() string { return "inventory_checks" }

type InventoryCheckItem struct {
	BaseModel
	CheckID      string `gorm:"type:uuid;not null;index" json:"check_id"`
	MaterialID   string `gorm:"type:uuid;not null" json:"material_id"`
	ExpectedQty  int    `json:"expected_qty"`
	ActualQty    int    `json:"actual_qty"`
	Difference   int    `json:"difference"`
}

func (InventoryCheckItem) TableName() string { return "inventory_check_items" }
