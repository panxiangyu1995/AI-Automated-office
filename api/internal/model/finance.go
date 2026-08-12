package model

import "time"

type PaymentRecord struct {
	TenantModel
	TransactionNo string     `gorm:"type:varchar(100);not null" json:"transaction_no"`
	CustomerID    *string    `gorm:"type:uuid;index" json:"customer_id,omitempty"`
	ContractID    *string    `gorm:"type:uuid;index" json:"contract_id,omitempty"`
	Amount        float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	PaymentMethod string     `gorm:"type:varchar(50)" json:"payment_method"`
	Status        string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	Notes         string     `gorm:"type:text" json:"notes,omitempty"`
}

func (PaymentRecord) TableName() string { return "payment_records" }

type ExpenseRecord struct {
	TenantModel
	ExpenseNo   string     `gorm:"type:varchar(100);not null" json:"expense_no"`
	Amount      float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	Category    string     `gorm:"type:varchar(50)" json:"category"`
	Status      string     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	SubmittedBy *string    `gorm:"type:uuid" json:"submitted_by"`
	ApprovedBy  *string    `gorm:"type:uuid" json:"approved_by,omitempty"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	ExpenseAt   *time.Time `json:"expense_at,omitempty"`
}

func (ExpenseRecord) TableName() string { return "expense_records" }

type Invoice struct {
	TenantModel
	InvoiceNo    string     `gorm:"type:varchar(100);not null" json:"invoice_no"`
	CustomerID   *string    `gorm:"type:uuid;index" json:"customer_id,omitempty"`
	Amount       float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	TaxAmount    float64    `gorm:"type:numeric(15,2);default:0" json:"tax_amount"`
	Status       string     `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	InvoiceDate  *time.Time `json:"invoice_date,omitempty"`
	DueDate      *time.Time `json:"due_date,omitempty"`
	Notes        string     `gorm:"type:text" json:"notes,omitempty"`
	BusinessType string     `gorm:"type:varchar(30)" json:"business_type,omitempty"`
	BusinessID   *string    `gorm:"type:uuid;index" json:"business_id,omitempty"`
}

func (Invoice) TableName() string { return "invoices" }

type Receivable struct {
	TenantModel
	ReceivableNo string     `gorm:"type:varchar(100);not null" json:"receivable_no"`
	CustomerID   string     `gorm:"type:uuid;not null;index" json:"customer_id"`
	SalesOrderID *string    `gorm:"type:uuid;index" json:"sales_order_id,omitempty"`
	ContractID   *string    `gorm:"type:uuid;index" json:"contract_id,omitempty"`
	Amount       float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	PaidAmount   float64    `gorm:"type:numeric(15,2);default:0" json:"paid_amount"`
	Status       string     `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	DueDate      *time.Time `json:"due_date,omitempty"`
}

func (Receivable) TableName() string { return "receivables" }

type Payable struct {
	TenantModel
	PayableNo       string     `gorm:"type:varchar(100);not null" json:"payable_no"`
	SupplierID      string     `gorm:"type:uuid;not null;index" json:"supplier_id"`
	PurchaseOrderID *string    `gorm:"type:uuid;index" json:"purchase_order_id,omitempty"`
	Amount          float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	PaidAmount      float64    `gorm:"type:numeric(15,2);default:0" json:"paid_amount"`
	Status          string     `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	DueDate         *time.Time `json:"due_date,omitempty"`
}

func (Payable) TableName() string { return "payables" }
