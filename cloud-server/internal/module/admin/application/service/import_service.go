package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/domain/entity"
	"cloud-server/internal/module/admin/domain/repository"
	"cloud-server/internal/module/admin/infrastructure/parser"

	"github.com/google/uuid"
)

// ImportService 导入服务
type ImportService struct {
	batchRepo       repository.ImportBatchRepository
	userRepo        repository.UserRepository
	departmentRepo  repository.DepartmentRepository
	positionRepo    repository.PositionRepository
	parser          *parser.ExcelParser
	conflictChecker *ConflictChecker
}

// NewImportService 创建导入服务
func NewImportService(
	batchRepo repository.ImportBatchRepository,
	userRepo repository.UserRepository,
	departmentRepo repository.DepartmentRepository,
	positionRepo repository.PositionRepository,
) *ImportService {
	return &ImportService{
		batchRepo:       batchRepo,
		userRepo:        userRepo,
		departmentRepo:  departmentRepo,
		positionRepo:    positionRepo,
		parser:          parser.NewExcelParser(),
		conflictChecker: NewConflictChecker(userRepo, departmentRepo, positionRepo),
	}
}

// PreviewImport 预览导入
func (s *ImportService) PreviewImport(ctx context.Context, tenantID uuid.UUID, reader io.Reader, fileName string) (*dto.ImportPreviewResponse, error) {
	// 解析 Excel 文件
	result, err := s.parser.Parse(reader)
	if err != nil {
		return nil, fmt.Errorf("parse excel failed: %w", err)
	}

	// 生成批次 ID
	batchID := s.generateBatchID(result)

	// 检查是否已存在相同批次的预览
	existingBatch, err := s.batchRepo.FindByBatchID(ctx, tenantID, batchID)
	if err == nil && existingBatch != nil && !existingBatch.IsExpired() {
		return s.buildPreviewResponse(existingBatch), nil
	}

	// 解析数据行
	rows := make([]*entity.ImportRowData, 0, len(result.Rows))
	for _, row := range result.Rows {
		data := &entity.ImportRowData{
			Username:        row.Fields["username"],
			Password:        row.Fields["password"],
			Name:            row.Fields["name"],
			EmployeeCode:    row.Fields["employee_code"],
			DepartmentCode:  row.Fields["department_code"],
			DepartmentName:  row.Fields["department_name"],
			PositionCode:    row.Fields["position_code"],
			PositionName:    row.Fields["position_name"],
			ManagerUsername: row.Fields["manager_username"],
			Email:           row.Fields["email"],
			Phone:           row.Fields["phone"],
			Status:          row.Fields["status"],
		}
		rows = append(rows, data)
	}

	// 检测内部冲突
	internalConflicts := s.conflictChecker.CheckBatch(rows)

	// 检测数据库冲突
	validItems := make([]dto.ImportPreviewItem, 0)
	conflicts := make([]dto.ImportConflictItem, 0)
	errors := make([]dto.ImportErrorItem, 0)

	for i, row := range result.Rows {
		rowNumber := row.RowNumber
		data := rows[i]

		// 检查是否有解析错误
		parseErrors := s.parser.ValidateRow(row)
		if len(parseErrors) > 0 {
			for _, e := range parseErrors {
				errors = append(errors, dto.ImportErrorItem{
					RowNumber:    rowNumber,
					Data:         row.RawData,
					ErrorMessage: e.Message,
				})
			}
			continue
		}

		// 检查内部冲突
		if conflict, exists := internalConflicts[i]; exists {
			conflicts = append(conflicts, dto.ImportConflictItem{
				RowNumber:     rowNumber,
				Data:          row.RawData,
				ParsedData:    s.convertToDTO(data),
				ConflictType:  string(conflict.ConflictType),
				ConflictDesc:  conflict.ConflictDesc,
				ConflictDetail: conflict.ConflictDetail,
			})
			continue
		}

		// 检查数据库冲突
		conflict := s.conflictChecker.CheckRow(ctx, tenantID, data, rowNumber)
		if conflict.HasConflict {
			conflicts = append(conflicts, dto.ImportConflictItem{
				RowNumber:     rowNumber,
				Data:          row.RawData,
				ParsedData:    s.convertToDTO(data),
				ConflictType:  string(conflict.ConflictType),
				ConflictDesc:  conflict.ConflictDesc,
				ConflictDetail: conflict.ConflictDetail,
			})
			continue
		}

		// 有效行
		validItems = append(validItems, dto.ImportPreviewItem{
			RowNumber:  rowNumber,
			Data:       row.RawData,
			ParsedData: s.convertToDTO(data),
		})
	}

	// 创建批次记录
	expiresAt := time.Now().Add(30 * time.Minute)
	batch := &entity.ImportBatch{
		ID:           uuid.New(),
		TenantID:     tenantID,
		BatchID:      batchID,
		FileName:     fileName,
		TotalRows:    len(result.Rows),
		ValidRows:    len(validItems),
		ConflictRows: len(conflicts),
		ErrorRows:    len(errors),
		Status:       entity.ImportStatusPreview,
		ExpiresAt:    &expiresAt,
	}

	// 存储预览数据
	previewData := map[string]interface{}{
		"valid_items": validItems,
		"conflicts":   conflicts,
		"errors":      errors,
	}
	batch.PreviewData = previewData

	// 保存批次
	if err := s.batchRepo.Create(ctx, batch); err != nil {
		return nil, fmt.Errorf("save batch failed: %w", err)
	}

	return &dto.ImportPreviewResponse{
		BatchID:      batchID,
		FileName:     fileName,
		TotalRows:    batch.TotalRows,
		ValidRows:    batch.ValidRows,
		ConflictRows: batch.ConflictRows,
		ErrorRows:    batch.ErrorRows,
		ValidItems:   validItems,
		Conflicts:    conflicts,
		Errors:       errors,
		CreatedAt:    batch.CreatedAt,
		ExpiresAt:    batch.ExpiresAt,
	}, nil
}

// GetTemplate 获取导入模板
func (s *ImportService) GetTemplate() *dto.GetImportTemplateResponse {
	return &dto.GetImportTemplateResponse{
		Fields: []dto.ImportTemplateField{
			{Name: "username", Label: "用户名", Required: true, Example: "zhangsan", Description: "登录账号，3-50字符"},
			{Name: "name", Label: "姓名", Required: true, Example: "张三", Description: "员工真实姓名"},
			{Name: "password", Label: "初始密码", Required: false, Example: "Pass@123", Description: "初始密码，不填则系统生成"},
			{Name: "employee_code", Label: "工号", Required: false, Example: "EMP001", Description: "员工工号"},
			{Name: "department_code", Label: "部门编码", Required: false, Example: "DEPT001", Description: "所属部门编码"},
			{Name: "department_name", Label: "部门名称", Required: false, Example: "研发部", Description: "所属部门名称"},
			{Name: "position_code", Label: "岗位编码", Required: false, Example: "POS001", Description: "岗位编码"},
			{Name: "position_name", Label: "岗位名称", Required: false, Example: "高级工程师", Description: "岗位名称"},
			{Name: "manager_username", Label: "上级用户名", Required: false, Example: "lisi", Description: "直属上级的登录账号"},
			{Name: "email", Label: "邮箱", Required: false, Example: "zhangsan@example.com", Description: "员工邮箱"},
			{Name: "phone", Label: "手机号", Required: false, Example: "13800138000", Description: "员工手机号"},
			{Name: "status", Label: "状态", Required: false, Example: "active", Description: "状态：active/inactive"},
		},
	}
}

func (s *ImportService) generateBatchID(result *parser.ParseResult) string {
	data, _ := json.Marshal(result.Rows)
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:8])
}

func (s *ImportService) convertToDTO(data *entity.ImportRowData) *dto.ImportRowDataDTO {
	return &dto.ImportRowDataDTO{
		Username:        data.Username,
		Name:            data.Name,
		EmployeeCode:    data.EmployeeCode,
		DepartmentCode:  data.DepartmentCode,
		DepartmentName:  data.DepartmentName,
		PositionCode:    data.PositionCode,
		PositionName:    data.PositionName,
		ManagerUsername: data.ManagerUsername,
		Email:           data.Email,
		Phone:           data.Phone,
	}
}

func (s *ImportService) buildPreviewResponse(batch *entity.ImportBatch) *dto.ImportPreviewResponse {
	previewData, ok := batch.PreviewData["preview_data"].(map[string]interface{})
	if !ok {
		previewData = batch.PreviewData
	}

	var validItems []dto.ImportPreviewItem
	var conflicts []dto.ImportConflictItem
	var errors []dto.ImportErrorItem

	if v, ok := previewData["valid_items"].([]dto.ImportPreviewItem); ok {
		validItems = v
	} else if v, ok := previewData["valid_items"].([]interface{}); ok {
		data, _ := json.Marshal(v)
		json.Unmarshal(data, &validItems)
	}

	if v, ok := previewData["conflicts"].([]dto.ImportConflictItem); ok {
		conflicts = v
	} else if v, ok := previewData["conflicts"].([]interface{}); ok {
		data, _ := json.Marshal(v)
		json.Unmarshal(data, &conflicts)
	}

	if v, ok := previewData["errors"].([]dto.ImportErrorItem); ok {
		errors = v
	} else if v, ok := previewData["errors"].([]interface{}); ok {
		data, _ := json.Marshal(v)
		json.Unmarshal(data, &errors)
	}

	return &dto.ImportPreviewResponse{
		BatchID:      batch.BatchID,
		FileName:     batch.FileName,
		TotalRows:    batch.TotalRows,
		ValidRows:    batch.ValidRows,
		ConflictRows: batch.ConflictRows,
		ErrorRows:    batch.ErrorRows,
		ValidItems:   validItems,
		Conflicts:    conflicts,
		Errors:       errors,
		CreatedAt:    batch.CreatedAt,
		ExpiresAt:    batch.ExpiresAt,
	}
}
