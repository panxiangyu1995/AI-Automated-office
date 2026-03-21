package entity

import (
	"time"

	"github.com/google/uuid"
)

// ImportBatchStatus 导入批次状态
type ImportBatchStatus string

const (
	ImportStatusPending    ImportBatchStatus = "pending"
	ImportStatusPreview    ImportBatchStatus = "preview"
	ImportStatusConfirmed  ImportBatchStatus = "confirmed"
	ImportStatusProcessing ImportBatchStatus = "processing"
	ImportStatusCompleted  ImportBatchStatus = "completed"
	ImportStatusFailed     ImportBatchStatus = "failed"
	ImportStatusCancelled  ImportBatchStatus = "cancelled"
)

// ImportRowStatus 导入行状态
type ImportRowStatus string

const (
	ImportRowPending  ImportRowStatus = "pending"
	ImportRowValid    ImportRowStatus = "valid"
	ImportRowConflict ImportRowStatus = "conflict"
	ImportRowError    ImportRowStatus = "error"
)

// ConflictType 冲突类型
type ConflictType string

const (
	ConflictDuplicateUsername    ConflictType = "duplicate_username"
	ConflictDuplicateEmployeeCode ConflictType = "duplicate_employee_code"
	ConflictDepartmentNotFound   ConflictType = "department_not_found"
	ConflictPositionNotFound     ConflictType = "position_not_found"
	ConflictManagerNotFound      ConflictType = "manager_not_found"
)

// ImportBatch 导入批次实体
type ImportBatch struct {
	ID           uuid.UUID
	TenantID     uuid.UUID
	BatchID      string
	FileName     string
	TotalRows    int
	ValidRows    int
	ConflictRows int
	ErrorRows    int
	Status       ImportBatchStatus
	PreviewData  map[string]interface{}
	CreatedBy    uuid.UUID
	CreatedAt    time.Time
	UpdatedAt    time.Time
	ExpiresAt    *time.Time
}

// ImportRow 导入行实体
type ImportRow struct {
	ID            uuid.UUID
	BatchID       uuid.UUID
	RowNumber     int
	RawData       map[string]interface{}
	ParsedData    *ImportRowData
	Status        ImportRowStatus
	ConflictType  ConflictType
	ConflictDetail map[string]interface{}
	ErrorMessage  string
	CreatedAt     time.Time
}

// ImportRowData 解析后的导入行数据
type ImportRowData struct {
	Username         string `json:"username"`
	Password         string `json:"password,omitempty"`
	Name             string `json:"name"`
	EmployeeCode     string `json:"employee_code"`
	DepartmentCode   string `json:"department_code"`
	DepartmentName   string `json:"department_name"`
	PositionCode     string `json:"position_code"`
	PositionName     string `json:"position_name"`
	ManagerUsername  string `json:"manager_username"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	Status           string `json:"status"`
}

// ConflictResult 冲突检测结果
type ConflictResult struct {
	HasConflict bool          `json:"has_conflict"`
	Types       []ConflictType `json:"types,omitempty"`
	Details     map[string]interface{} `json:"details,omitempty"`
}

// IsReadyForImport 检查是否可以导入
func (b *ImportBatch) IsReadyForImport() bool {
	return b.Status == ImportStatusPreview || b.Status == ImportStatusConfirmed
}

// CanBeCancelled 检查是否可以取消
func (b *ImportBatch) CanBeCancelled() bool {
	return b.Status == ImportStatusPending || b.Status == ImportStatusPreview
}

// IsExpired 检查是否已过期
func (b *ImportBatch) IsExpired() bool {
	if b.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*b.ExpiresAt)
}
