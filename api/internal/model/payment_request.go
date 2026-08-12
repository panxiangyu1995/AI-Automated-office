package model

type PaymentRequest struct {
	TenantModel
	RequestNo    string  `gorm:"type:varchar(100);not null" json:"request_no"`
	Category     string  `gorm:"type:varchar(50)" json:"category,omitempty"`
	Amount       float64 `gorm:"type:numeric(15,2);not null" json:"amount"`
	Status       string  `gorm:"type:varchar(30);not null;default:'pending'" json:"status"`
	ApplicantID  *string `gorm:"type:uuid" json:"applicant_id,omitempty"`
	ApprovedBy   *string `gorm:"type:uuid" json:"approved_by,omitempty"`
	Description  string  `gorm:"type:text" json:"description,omitempty"`
	RejectReason string  `gorm:"type:text" json:"reject_reason,omitempty"`
}

func (PaymentRequest) TableName() string { return "payment_requests" }

var PaymentRequestStatusLabels = map[string]string{
	"draft":            "草稿",
	"pending_approval": "审批中",
	"approved":         "已批准",
	"rejected":         "已驳回",
}
