package model

type PaymentRequest struct {
	TenantModel
	RequestNo     string  `gorm:"type:varchar(100);not null" json:"request_no"`
	CustomerID    string  `gorm:"type:uuid;not null;index" json:"customer_id"`
	ContractID    *string `gorm:"type:uuid;index" json:"contract_id,omitempty"`
	SalesOrderID  *string `gorm:"type:uuid;index" json:"sales_order_id,omitempty"`
	Amount        float64 `gorm:"type:numeric(15,2);not null" json:"amount"`
	Status        string  `gorm:"type:varchar(30);not null;default:'draft'" json:"status"`
	Notes         string  `gorm:"type:text" json:"notes,omitempty"`
	ApprovedBy    *string `gorm:"type:uuid" json:"approved_by,omitempty"`
	RejectReason  string  `gorm:"type:text" json:"reject_reason,omitempty"`
}

func (PaymentRequest) TableName() string { return "payment_requests" }

var PaymentRequestStatusLabels = map[string]string{
	"draft":             "草稿",
	"pending_approval":  "审批中",
	"approved":          "已批准",
	"rejected":          "已驳回",
}
