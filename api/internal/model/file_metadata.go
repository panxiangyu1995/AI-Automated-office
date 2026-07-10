package model

type FileMetadata struct {
	TenantModel
	OriginalName string `gorm:"type:varchar(255);not null" json:"original_name"`
	StorageKey   string `gorm:"type:varchar(500);not null;uniqueIndex" json:"storage_key"`
	FileSize     int64  `json:"file_size"`
	MimeType     string `gorm:"type:varchar(100)" json:"mime_type"`
	StorageType  string `gorm:"type:varchar(20);not null;default:'local'" json:"storage_type"`
	StoragePath  string `gorm:"type:text" json:"storage_path"`
	Checksum     string `gorm:"type:varchar(64)" json:"checksum,omitempty"`
	UploadedBy   *string `gorm:"type:uuid" json:"uploaded_by,omitempty"`
	RefType      string  `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
	RefID        *string `gorm:"type:uuid" json:"ref_id,omitempty"`
}

func (FileMetadata) TableName() string { return "file_metadata" }
