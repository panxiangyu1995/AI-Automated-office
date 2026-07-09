package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

func (s *StringSlice) Scan(val interface{}) error {
	if val == nil {
		*s = nil
		return nil
	}
	return json.Unmarshal(val.([]byte), s)
}

type JSONMap map[string]interface{}

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

func (m *JSONMap) Scan(val interface{}) error {
	if val == nil {
		*m = nil
		return nil
	}
	return json.Unmarshal(val.([]byte), m)
}

type ExportTask struct {
	BaseModel
	EnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	RequestedBy  uuid.UUID `gorm:"type:uuid;not null" json:"requested_by"`
	ExportType   string    `gorm:"type:varchar(50);not null" json:"export_type"`
	EntityType   string    `gorm:"type:varchar(50);not null" json:"entity_type"`
	EntityID     string    `gorm:"type:varchar(100)" json:"entity_id,omitempty"`
	Format       string    `gorm:"type:varchar(10);not null;default:'xlsx'" json:"format"`
	Status       string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Fields       StringSlice `gorm:"type:jsonb" json:"fields,omitempty"`
	Filters      JSONMap     `gorm:"type:jsonb" json:"filters,omitempty"`
	FileKey      string    `gorm:"type:varchar(255)" json:"file_key,omitempty"`
	FileSize     int64     `json:"file_size,omitempty"`
	ErrorMsg     string    `gorm:"type:text" json:"error_msg,omitempty"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

func (ExportTask) TableName() string { return "export_tasks" }

type ExportHistory struct {
	BaseModel
	EnterpriseID uuid.UUID `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	TaskID       uuid.UUID `gorm:"type:uuid;not null;index" json:"task_id"`
	DownloadedBy uuid.UUID `gorm:"type:uuid;not null" json:"downloaded_by"`
}

func (ExportHistory) TableName() string { return "export_histories" }
