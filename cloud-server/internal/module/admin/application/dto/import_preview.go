package dto

import (
	"time"

	"github.com/google/uuid"
)

// ImportTemplateField 导入模板字段定义
type ImportTemplateField struct {
	Name        string `json:"name"`
	Label       string `json:"label"`
	Required    bool   `json:"required"`
	Example     string `json:"example"`
	Description string `json:"description"`
}

// GetImportTemplateResponse 导入模板响应
type GetImportTemplateResponse struct {
	Fields []ImportTemplateField `json:"fields"`
}

// UploadImportFileRequest 上传导入文件请求
type UploadImportFileRequest struct {
	FileName string `form:"file_name"`
}

// ImportPreviewResponse 导入预览响应
type ImportPreviewResponse struct {
	BatchID      string                    `json:"batch_id"`
	FileName     string                    `json:"file_name"`
	TotalRows    int                       `json:"total_rows"`
	ValidRows    int                       `json:"valid_rows"`
	ConflictRows int                       `json:"conflict_rows"`
	ErrorRows    int                       `json:"error_rows"`
	ValidItems   []ImportPreviewItem       `json:"valid_items"`
	Conflicts    []ImportConflictItem      `json:"conflicts"`
	Errors       []ImportErrorItem         `json:"errors"`
	CreatedAt    time.Time                 `json:"created_at"`
	ExpiresAt    *time.Time                `json:"expires_at,omitempty"`
}

// ImportPreviewItem 导入预览项
type ImportPreviewItem struct {
	RowNumber     int               `json:"row_number"`
	Data          map[string]string `json:"data"`
	ParsedData    *ImportRowDataDTO `json:"parsed_data"`
}

// ImportConflictItem 导入冲突项
type ImportConflictItem struct {
	RowNumber     int                    `json:"row_number"`
	Data          map[string]string      `json:"data"`
	ParsedData    *ImportRowDataDTO      `json:"parsed_data"`
	ConflictType  string                 `json:"conflict_type"`
	ConflictDesc  string                 `json:"conflict_desc"`
	ConflictDetail map[string]interface{} `json:"conflict_detail,omitempty"`
}

// ImportErrorItem 导入错误项
type ImportErrorItem struct {
	RowNumber    int               `json:"row_number"`
	Data         map[string]string `json:"data"`
	ErrorMessage string            `json:"error_message"`
}

// ImportRowDataDTO 导入行数据 DTO
type ImportRowDataDTO struct {
	Username       string `json:"username"`
	Name           string `json:"name"`
	EmployeeCode   string `json:"employee_code"`
	DepartmentCode string `json:"department_code"`
	DepartmentName string `json:"department_name"`
	PositionCode   string `json:"position_code"`
	PositionName   string `json:"position_name"`
	ManagerUsername string `json:"manager_username"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
}

// ImportBatchListItem 导入批次列表项
type ImportBatchListItem struct {
	ID           uuid.UUID `json:"id"`
	BatchID      string    `json:"batch_id"`
	FileName     string    `json:"file_name"`
	TotalRows    int       `json:"total_rows"`
	ValidRows    int       `json:"valid_rows"`
	ConflictRows int       `json:"conflict_rows"`
	ErrorRows    int       `json:"error_rows"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
}

// ImportBatchListResponse 导入批次列表响应
type ImportBatchListResponse struct {
	Items []ImportBatchListItem `json:"items"`
	Total int                   `json:"total"`
}

// ImportBatchDetailResponse 导入批次详情响应
type ImportBatchDetailResponse struct {
	ID           uuid.UUID            `json:"id"`
	BatchID      string               `json:"batch_id"`
	FileName     string               `json:"file_name"`
	TotalRows    int                  `json:"total_rows"`
	ValidRows    int                  `json:"valid_rows"`
	ConflictRows int                  `json:"conflict_rows"`
	ErrorRows    int                  `json:"error_rows"`
	Status       string               `json:"status"`
	CreatedAt    time.Time            `json:"created_at"`
	ExpiresAt    *time.Time           `json:"expires_at,omitempty"`
	Rows         []ImportRowDetailDTO `json:"rows,omitempty"`
}

// ImportRowDetailDTO 导入行详情 DTO
type ImportRowDetailDTO struct {
	RowNumber     int                    `json:"row_number"`
	RawData       map[string]interface{} `json:"raw_data"`
	ParsedData    *ImportRowDataDTO      `json:"parsed_data"`
	Status        string                 `json:"status"`
	ConflictType  string                 `json:"conflict_type,omitempty"`
	ConflictDesc  string                 `json:"conflict_desc,omitempty"`
	ConflictDetail map[string]interface{} `json:"conflict_detail,omitempty"`
	ErrorMessage  string                 `json:"error_message,omitempty"`
}

// ConflictCheckResult 冲突检测结果
type ConflictCheckResult struct {
	HasConflict  bool                   `json:"has_conflict"`
	ConflictType string                 `json:"conflict_type,omitempty"`
	Detail       map[string]interface{} `json:"detail,omitempty"`
}
