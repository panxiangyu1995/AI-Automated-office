package model

type ContractAttachment struct {
	TenantModel
	ContractID string `gorm:"type:uuid;not null;index" json:"contract_id"`
	FileName   string `gorm:"type:varchar(255);not null" json:"file_name"`
	FileType   string `gorm:"type:varchar(100)" json:"file_type"`
	FileSize   int64  `json:"file_size"`
	FileURL    string `gorm:"type:text" json:"file_url"`
}

func (ContractAttachment) TableName() string { return "contract_attachments" }
