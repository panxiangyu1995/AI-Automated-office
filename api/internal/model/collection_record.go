package model

type CollectionRecord struct {
	TenantModel
	CollectionNo  string  `gorm:"type:varchar(100);not null" json:"collection_no"`
	CustomerID    string  `gorm:"type:uuid;not null;index" json:"customer_id"`
	ReceivableID  string  `gorm:"type:uuid;not null;index" json:"receivable_id"`
	ContractID    *string `gorm:"type:uuid;index" json:"contract_id,omitempty"`
	SalesOrderID  *string `gorm:"type:uuid;index" json:"sales_order_id,omitempty"`
	Amount        float64 `gorm:"type:numeric(15,2);not null" json:"amount"`
	Method        string  `gorm:"type:varchar(30);not null;default:'bank_transfer'" json:"method"`
	CollectedAt   string  `gorm:"type:varchar(30)" json:"collected_at"`
	Notes         string  `gorm:"type:text" json:"notes,omitempty"`
}

func (CollectionRecord) TableName() string { return "collection_records" }
