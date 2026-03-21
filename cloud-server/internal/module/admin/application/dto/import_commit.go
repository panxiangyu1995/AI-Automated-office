package dto

import "time"

// ConfirmImportRequest 确认导入请求
type ConfirmImportRequest struct {
	BatchID        string                  `json:"batch_id" binding:"required"`
	IdempotencyKey string                  `json:"idempotency_key" binding:"required"`
	ConflictPolicy ConflictPolicy          `json:"conflict_policy"`
	RowPolicies    map[int]ConflictPolicy  `json:"row_policies,omitempty"` // 行号 -> 冲突策略
}

// ConflictPolicy 冲突处理策略
type ConflictPolicy string

const (
	ConflictPolicySkip    ConflictPolicy = "skip"    // 跳过冲突行
	ConflictPolicyUpdate  ConflictPolicy = "update"  // 更新已有数据
	ConflictPolicyCreate  ConflictPolicy = "create"  // 创建新记录（带后缀）
	ConflictPolicyDefault ConflictPolicy = "skip"    // 默认跳过
)

// ConfirmImportResponse 确认导入响应
type ConfirmImportResponse struct {
	BatchID          string                `json:"batch_id"`
	Status           string                `json:"status"`
	TotalRows        int                   `json:"total_rows"`
	SuccessRows      int                   `json:"success_rows"`
	SkippedRows      int                   `json:"skipped_rows"`
	FailedRows       int                   `json:"failed_rows"`
	ReceiptAvailable bool                  `json:"receipt_available"`
	ReceiptURL       string                `json:"receipt_url,omitempty"`
	CompletedAt      time.Time             `json:"completed_at"`
	Duration         int64                 `json:"duration_ms"`
}

// ImportReceiptItem 导入回执项
type ImportReceiptItem struct {
	RowNumber   int    `json:"row_number"`
	Username    string `json:"username"`
	Name        string `json:"name"`
	EmployeeCode string `json:"employee_code"`
	Status      string `json:"status"` // success, skipped, failed
	Message     string `json:"message,omitempty"`
	NewUserID   string `json:"new_user_id,omitempty"`
}

// ImportReceipt 导入回执
type ImportReceipt struct {
	BatchID     string               `json:"batch_id"`
	FileName    string               `json:"file_name"`
	TotalRows   int                  `json:"total_rows"`
	SuccessRows int                  `json:"success_rows"`
	SkippedRows int                  `json:"skipped_rows"`
	FailedRows  int                  `json:"failed_rows"`
	StartTime   time.Time            `json:"start_time"`
	EndTime     time.Time            `json:"end_time"`
	Duration    int64                `json:"duration_ms"`
	Items       []ImportReceiptItem  `json:"items"`
	CreatedAt   time.Time            `json:"created_at"`
}

// ImportReceiptResponse 导入回执响应
type ImportReceiptResponse struct {
	*ImportReceipt
	DownloadURL string `json:"download_url,omitempty"`
}

// ImportProgressResponse 导入进度响应
type ImportProgressResponse struct {
	BatchID     string    `json:"batch_id"`
	Status      string    `json:"status"`
	TotalRows   int       `json:"total_rows"`
	ProcessedRows int     `json:"processed_rows"`
	SuccessRows int       `json:"success_rows"`
	FailedRows  int       `json:"failed_rows"`
	Progress    float64   `json:"progress"` // 0-100
	StartTime   time.Time `json:"start_time"`
	EstimatedEnd *time.Time `json:"estimated_end,omitempty"`
}
