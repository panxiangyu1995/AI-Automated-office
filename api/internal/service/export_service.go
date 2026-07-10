package service

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

type ExportService struct {
	db        *gorm.DB
	repo      repository.ExportRepository
	exportDir string
}

func NewExportService(db *gorm.DB, repo repository.ExportRepository, exportDir string) *ExportService {
	return &ExportService{db: db, repo: repo, exportDir: exportDir}
}

type CreateExportRequest struct {
	ExportType string                 `json:"export_type"`
	EntityType string                 `json:"entity_type"`
	EntityID   string                 `json:"entity_id,omitempty"`
	Format     string                 `json:"format"`
	Fields     []string               `json:"fields,omitempty"`
	Filters    map[string]interface{} `json:"filters,omitempty"`
}

func (s *ExportService) CreateTask(enterpriseID, userID, userRole string, req CreateExportRequest) (*model.ExportTask, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, apperrors.NewValidationError("user_id", "无效")
	}

	entityDef, ok := getExportEntity(req.EntityType)
	if !ok {
		return nil, apperrors.NewValidationError("entity_type", fmt.Sprintf("不支持的实体类型: %s", req.EntityType))
	}

	if !validExportTypes[req.ExportType] {
		return nil, apperrors.NewValidationError("export_type", fmt.Sprintf("不支持的导出类型: %s", req.ExportType))
	}

	if req.Format == "" {
		req.Format = "xlsx"
	}
	if req.Format != "xlsx" && req.Format != "csv" {
		return nil, apperrors.NewValidationError("format", "仅支持 xlsx 和 csv 格式")
	}

	permStr, hasPerm := exportEntityPermissions[req.EntityType]
	if hasPerm {
		role, valid := rbac.ValidateRole(userRole)
		if !valid || !rbac.HasPermission(role, rbac.Permission(permStr)) {
			return nil, apperrors.ErrForbidden.WithDetail("无权导出该类型数据")
		}
	}

	safeFields := s.sanitizeFields(req.Fields, entityDef.Fields)
	safeFilters := s.sanitizeFilters(req.Filters, entityDef.Fields)

	task := &model.ExportTask{
		EnterpriseID: eid,
		RequestedBy:  uid,
		ExportType:   req.ExportType,
		EntityType:   req.EntityType,
		EntityID:     req.EntityID,
		Format:       req.Format,
		Status:       "pending",
		Fields:       safeFields,
		Filters:      safeFilters,
	}

	if err := s.repo.CreateTask(task); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建导出任务失败")
	}

	return task, nil
}

func (s *ExportService) GetTask(enterpriseID, taskID string) (*model.ExportTask, *apperrors.AppError) {
	tid, err := uuid.Parse(taskID)
	if err != nil {
		return nil, apperrors.NewValidationError("task_id", "无效UUID")
	}

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	task, err := s.repo.FindTaskByIDAndEnterprise(tid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询导出任务失败")
	}
	if task == nil {
		return nil, apperrors.ErrNotFound.WithDetail("导出任务不存在")
	}

	return task, nil
}

func (s *ExportService) ListTasks(enterpriseID string, page, pageSize int) ([]model.ExportTask, int64, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}

	tasks, total, err := s.repo.ListTasksByEnterprise(eid, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询导出任务列表失败")
	}

	return tasks, total, nil
}

func (s *ExportService) DownloadTask(enterpriseID, userID, taskID string) (*model.ExportTask, *apperrors.AppError) {
	task, appErr := s.GetTask(enterpriseID, taskID)
	if appErr != nil {
		return nil, appErr
	}

	if task.Status != "completed" {
		return nil, apperrors.ErrInvalidStatus.WithDetail("导出任务尚未完成")
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, apperrors.NewValidationError("user_id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	history := &model.ExportHistory{
		EnterpriseID: eid,
		TaskID:       task.ID,
		DownloadedBy: uid,
	}
	if err := s.repo.CreateHistory(history); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("记录下载历史失败")
	}

	return task, nil
}

func (s *ExportService) ExecuteTask(taskID string) error {
	tid, err := uuid.Parse(taskID)
	if err != nil {
		return err
	}

	task, err := s.repo.FindTaskByID(tid)
	if err != nil || task == nil {
		return fmt.Errorf("export task not found: %s", taskID)
	}

	if task.Status != "pending" && task.Status != "running" {
		return fmt.Errorf("export task %s already in status %s", taskID, task.Status)
	}

	now := time.Now()
	task.Status = "running"
	task.StartedAt = &now
	if err := s.repo.UpdateTask(task); err != nil {
		return fmt.Errorf("update task status to running: %w", err)
	}

	result, err := s.generateExport(task)
	if err != nil {
		task.Status = "failed"
		task.ErrorMsg = err.Error()
		completed := time.Now()
		task.CompletedAt = &completed
		if updateErr := s.repo.UpdateTask(task); updateErr != nil {
			return fmt.Errorf("export failed: %v, and update status failed: %w", err, updateErr)
		}
		return err
	}

	task.Status = "completed"
	task.FileKey = result.FileKey
	task.FileSize = result.FileSize
	completed := time.Now()
	task.CompletedAt = &completed
	if err := s.repo.UpdateTask(task); err != nil {
		return fmt.Errorf("update task status to completed: %w", err)
	}

	return nil
}

type exportResult struct {
	FileKey  string
	FileSize int64
}

func (s *ExportService) sanitizeFields(userFields []string, allowedFields []string) []string {
	if len(userFields) == 0 {
		return nil
	}
	allowed := make(map[string]bool, len(allowedFields))
	for _, f := range allowedFields {
		allowed[f] = true
	}
	safe := make([]string, 0, len(userFields))
	for _, f := range userFields {
		if allowed[f] {
			safe = append(safe, f)
		}
	}
	if len(safe) == 0 {
		return nil
	}
	return safe
}

func (s *ExportService) sanitizeFilters(filters map[string]interface{}, allowedFields []string) map[string]interface{} {
	if len(filters) == 0 {
		return nil
	}
	allowed := make(map[string]bool, len(allowedFields))
	for _, f := range allowedFields {
		allowed[f] = true
	}
	safe := make(map[string]interface{}, len(filters))
	for k, v := range filters {
		if allowed[k] {
			safe[k] = v
		}
	}
	if len(safe) == 0 {
		return nil
	}
	return safe
}

func (s *ExportService) generateExport(task *model.ExportTask) (*exportResult, error) {
	switch task.ExportType {
	case "cross_entity":
		return s.generateCrossEntityExport(task)
	case "employee_dimension":
		return s.generateEmployeeDimensionExport(task)
	case "employee_audit":
		return s.generateEmployeeAuditExport(task)
	default:
		return s.generateSingleExport(task)
	}
}

func (s *ExportService) generateSingleExport(task *model.ExportTask) (*exportResult, error) {
	entityDef, ok := getExportEntity(task.EntityType)
	if !ok {
		return nil, fmt.Errorf("unsupported entity type: %s", task.EntityType)
	}

	fields := entityDef.Fields
	if len(task.Fields) > 0 {
		fields = task.Fields
	}

	results, err := s.queryEntityData(entityDef.Table, fields, task)
	if err != nil {
		return nil, err
	}

	s.maskResults(results, entityDef.MaskFields)

	return s.writeFile(task, map[string][][]string{
		task.EntityType: s.toSheetData(fields, results),
	})
}

func (s *ExportService) generateCrossEntityExport(task *model.ExportTask) (*exportResult, error) {
	if task.EntityID == "" {
		return nil, fmt.Errorf("cross_entity export requires entity_id")
	}

	anchorDef, ok := getExportEntity(task.EntityType)
	if !ok {
		return nil, fmt.Errorf("unsupported anchor entity: %s", task.EntityType)
	}

	anchorResults, err := s.queryEntityData(anchorDef.Table, anchorDef.Fields, task)
	if err != nil {
		return nil, err
	}
	s.maskResults(anchorResults, anchorDef.MaskFields)

	relatedEntities := s.getRelatedEntities(task.EntityType)
	sheets := map[string][][]string{
		task.EntityType: s.toSheetData(anchorDef.Fields, anchorResults),
	}

	for _, relType := range relatedEntities {
		relDef, ok := getExportEntity(relType)
		if !ok {
			continue
		}
		relResults, err := s.queryRelatedData(relDef.Table, relDef.Fields, task.EnterpriseID, task.EntityType, task.EntityID)
		if err != nil {
			continue
		}
		s.maskResults(relResults, relDef.MaskFields)
		sheets[relType] = s.toSheetData(relDef.Fields, relResults)
	}

	return s.writeFile(task, sheets)
}

func (s *ExportService) generateEmployeeDimensionExport(task *model.ExportTask) (*exportResult, error) {
	if task.EntityID == "" {
		return nil, fmt.Errorf("employee_dimension export requires entity_id (employee_id)")
	}

	sheets := map[string][][]string{}

	dimensionEntities := []struct {
		entityType string
		filterCol  string
	}{
		{"contract", "party_b"},
		{"order", "customer_id"},
		{"service_order", "customer_id"},
	}

	for _, dim := range dimensionEntities {
		dimDef, ok := getExportEntity(dim.entityType)
		if !ok {
			continue
		}
		results, err := s.queryEmployeeDimensionData(dimDef.Table, dimDef.Fields, task.EnterpriseID, task.EntityID)
		if err != nil {
			continue
		}
		s.maskResults(results, dimDef.MaskFields)
		sheets[dim.entityType] = s.toSheetData(dimDef.Fields, results)
	}

	return s.writeFile(task, sheets)
}

func (s *ExportService) generateEmployeeAuditExport(task *model.ExportTask) (*exportResult, error) {
	if task.EntityID == "" {
		return nil, fmt.Errorf("employee_audit export requires entity_id (employee_id)")
	}

	fields := []string{"id", "action", "resource_type", "resource_id", "detail", "created_at"}
	var results []map[string]interface{}
	if err := s.db.Table("audit_logs").
		Where("enterprise_id = ? AND user_id = ? AND deleted_at IS NULL", task.EnterpriseID, task.EntityID).
		Select(strings.Join(fields, ", ")).
		Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query audit logs: %w", err)
	}

	sheets := map[string][][]string{
		"audit_logs": s.toSheetData(fields, results),
	}

	return s.writeFile(task, sheets)
}

func (s *ExportService) queryEntityData(table string, fields []string, task *model.ExportTask) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := s.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", task.EnterpriseID).
		Select(strings.Join(fields, ", "))

	if task.EntityID != "" {
		query = query.Where("id = ?", task.EntityID)
	}

	for k, v := range task.Filters {
		query = query.Where(k+" = ?", v)
	}

	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query %s: %w", table, err)
	}
	return results, nil
}

func (s *ExportService) queryRelatedData(table string, fields []string, enterpriseID uuid.UUID, anchorType, anchorID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := s.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(fields, ", "))

	switch anchorType {
	case "customer":
		query = query.Where("customer_id = ?", anchorID)
	default:
		query = query.Where("id = ?", anchorID)
	}

	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query related %s: %w", table, err)
	}
	return results, nil
}

func (s *ExportService) queryEmployeeDimensionData(table string, fields []string, enterpriseID uuid.UUID, employeeID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := s.db.Table(table).
		Where("enterprise_id = ? AND deleted_at IS NULL", enterpriseID).
		Select(strings.Join(fields, ", "))

	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("query employee dimension %s: %w", table, err)
	}
	return results, nil
}

func (s *ExportService) getRelatedEntities(anchorType string) []string {
	switch anchorType {
	case "customer":
		return []string{"contact", "opportunity", "contract", "order", "service_order"}
	default:
		return []string{}
	}
}

func (s *ExportService) maskResults(results []map[string]interface{}, maskFields []string) {
	if len(maskFields) == 0 {
		return
	}
	maskSet := make(map[string]bool, len(maskFields))
	for _, mf := range maskFields {
		maskSet[mf] = true
	}
	for _, row := range results {
		for mf := range maskSet {
			if val, ok := row[mf]; ok {
				if str, ok := val.(string); ok && len(str) > 4 {
					row[mf] = str[:2] + strings.Repeat("*", len(str)-4) + str[len(str)-2:]
				}
			}
		}
	}
}

func (s *ExportService) toSheetData(fields []string, results []map[string]interface{}) [][]string {
	data := make([][]string, 0, len(results)+1)
	data = append(data, fields)
	for _, row := range results {
		record := make([]string, len(fields))
		for i, f := range fields {
			if v, ok := row[f]; ok {
				record[i] = fmt.Sprintf("%v", v)
			}
		}
		data = append(data, record)
	}
	return data
}

func (s *ExportService) writeFile(task *model.ExportTask, sheets map[string][][]string) (*exportResult, error) {
	if err := os.MkdirAll(s.exportDir, 0700); err != nil {
		return nil, fmt.Errorf("create export directory: %w", err)
	}

	fileKey := fmt.Sprintf("exports/%s/%s.%s", task.EnterpriseID.String(), task.ID.String(), task.Format)
	fullPath := filepath.Join(s.exportDir, fileKey)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0700); err != nil {
		return nil, fmt.Errorf("create export subdirectory: %w", err)
	}

	var fileSize int64

	switch task.Format {
	case "xlsx":
		f := excelize.NewFile()
		defer f.Close()
		sheetIdx := 0
		for sheetName, data := range sheets {
			sheet := sheetName
			if sheetIdx > 0 {
				if _, err := f.NewSheet(sheet); err != nil {
					return nil, fmt.Errorf("create sheet %s: %w", sheet, err)
				}
			} else {
				f.SetSheetName(f.GetSheetName(0), sheet)
			}
			for rowIdx, row := range data {
				for colIdx, cell := range row {
					cellRef, _ := excelize.CoordinatesToCellName(colIdx+1, rowIdx+1)
					f.SetCellValue(sheet, cellRef, cell)
				}
			}
			sheetIdx++
		}
		if err := f.SaveAs(fullPath); err != nil {
			return nil, fmt.Errorf("save xlsx file: %w", err)
		}
	case "csv":
		firstSheet := ""
		for name := range sheets {
			firstSheet = name
			break
		}
		data, ok := sheets[firstSheet]
		if !ok {
			data = [][]string{}
		}
		f, err := os.Create(fullPath)
		if err != nil {
			return nil, fmt.Errorf("create csv file: %w", err)
		}
		defer f.Close()
		w := csv.NewWriter(f)
		if err := w.WriteAll(data); err != nil {
			return nil, fmt.Errorf("write csv: %w", err)
		}
		w.Flush()
	}

	fi, err := os.Stat(fullPath)
	if err != nil {
		return nil, fmt.Errorf("stat export file: %w", err)
	}
	fileSize = fi.Size()

	return &exportResult{
		FileKey:  fileKey,
		FileSize: fileSize,
	}, nil
}
