package model

import "time"

type PurchaseOrder struct {
	TenantModel
	OrderNo    string     `gorm:"type:varchar(100);not null" json:"order_no"`
	SupplierID string     `gorm:"type:uuid;not null" json:"supplier_id"`
	Status     string     `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	TotalAmount float64   `gorm:"type:numeric(15,2);default:0" json:"total_amount"`
	OrderDate  *time.Time `json:"order_date,omitempty"`
	Notes      string     `gorm:"type:text" json:"notes,omitempty"`
}

func (PurchaseOrder) TableName() string { return "purchase_orders" }

type PurchaseOrderItem struct {
	BaseModel
	OrderID    string  `gorm:"type:uuid;not null;index" json:"order_id"`
	MaterialID string  `gorm:"type:uuid;not null" json:"material_id"`
	Quantity   int     `gorm:"not null" json:"quantity"`
	UnitPrice  float64 `gorm:"type:numeric(15,2)" json:"unit_price"`
	ReceivedQty int    `gorm:"default:0" json:"received_qty"`
}

func (PurchaseOrderItem) TableName() string { return "purchase_order_items" }

type SalesOrder struct {
	TenantModel
	OrderNo     string     `gorm:"type:varchar(100);not null" json:"order_no"`
	CustomerID  string     `gorm:"type:uuid;not null" json:"customer_id"`
	Status      string     `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	TotalAmount float64    `gorm:"type:numeric(15,2);default:0" json:"total_amount"`
	PaidAmount  float64    `gorm:"type:numeric(15,2);default:0" json:"paid_amount"`
	OrderDate   *time.Time `json:"order_date,omitempty"`
	Notes       string     `gorm:"type:text" json:"notes,omitempty"`
}

func (SalesOrder) TableName() string { return "sales_orders" }

type SalesOrderItem struct {
	BaseModel
	OrderID    string  `gorm:"type:uuid;not null;index" json:"order_id"`
	MaterialID string  `gorm:"type:uuid;not null" json:"material_id"`
	Quantity   int     `gorm:"not null" json:"quantity"`
	UnitPrice  float64 `gorm:"type:numeric(15,2)" json:"unit_price"`
	ShippedQty int     `gorm:"default:0" json:"shipped_qty"`
}

func (SalesOrderItem) TableName() string { return "sales_order_items" }

type TransferOrder struct {
	TenantModel
	OrderNo        string `gorm:"type:varchar(100);not null" json:"order_no"`
	SourceWhID     string `gorm:"type:uuid;not null" json:"source_warehouse_id"`
	TargetWhID     string `gorm:"type:uuid;not null" json:"target_warehouse_id"`
	Status         string `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	MaterialID     string `gorm:"type:uuid;not null" json:"material_id"`
	Quantity       int    `gorm:"not null" json:"quantity"`
	ReceivedQty    int    `gorm:"default:0" json:"received_qty"`
	Notes          string `gorm:"type:text" json:"notes,omitempty"`
}

func (TransferOrder) TableName() string { return "transfer_orders" }

type Requisition struct {
	TenantModel
	RequisitionNo string `gorm:"type:varchar(100);not null" json:"requisition_no"`
	ApplicantID   string `gorm:"type:uuid;not null" json:"applicant_id"`
	WarehouseID   string `gorm:"type:uuid;not null" json:"warehouse_id"`
	Status        string `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	MaterialID    string `gorm:"type:uuid;not null" json:"material_id"`
	Quantity      int    `gorm:"not null" json:"quantity"`
	IssuedQty     int    `gorm:"default:0" json:"issued_qty"`
	Notes         string `gorm:"type:text" json:"notes,omitempty"`
}

func (Requisition) TableName() string { return "requisitions" }
