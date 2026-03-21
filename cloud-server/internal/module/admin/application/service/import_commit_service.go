package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/domain/entity"
	"cloud-server/internal/module/admin/domain/repository"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	ErrBatchNotFound       = errors.New("BATCH_NOT_FOUND")
	ErrBatchAlreadyProcessed = errors.New("BATCH_ALREADY_PROCESSED")
	ErrBatchExpired        = errors.New("BATCH_EXPIRED")
	ErrInvalidIdempotencyKey = errors.New("INVALID_IDEMPOTENCY_KEY")
)

// ImportCommitService 导入提交服务
type ImportCommitService struct {
	batchRepo       repository.ImportBatchRepository
	userRepo        repository.UserRepository
	departmentRepo  repository.DepartmentRepository
	positionRepo    repository.PositionRepository
	conflictChecker *ConflictChecker
	conflictResolver *ConflictResolver
	logger          *zap.Logger
	
	// 用于幂等性检查的处理记录
	processingMap sync.Map // idempotency_key -> *ProcessingStatus
}

// ProcessingStatus 处理状态
type ProcessingStatus struct {
	BatchID    string
	Status     string // processing, completed, failed
	StartTime  time.Time
	EndTime    *time.Time
	Result     *dto.ConfirmImportResponse
}

// NewImportCommitService 创建导入提交服务
func NewImportCommitService(
	batchRepo repository.ImportBatchRepository,
	userRepo repository.UserRepository,
	departmentRepo repository.DepartmentRepository,
	positionRepo repository.PositionRepository,
	logger *zap.Logger,
) *ImportCommitService {
	return &ImportCommitService{
		batchRepo:       batchRepo,
		userRepo:        userRepo,
		departmentRepo:  departmentRepo,
		positionRepo:    positionRepo,
		conflictChecker: NewConflictChecker(userRepo, departmentRepo, positionRepo),
		conflictResolver: NewConflictResolver(userRepo, departmentRepo, positionRepo),
		logger:          logger,
	}
}

// ConfirmImport 确认导入
func (s *ImportCommitService) ConfirmImport(
	ctx context.Context,
	tenantID uuid.UUID,
	req *dto.ConfirmImportRequest,
) (*dto.ConfirmImportResponse, error) {
	startTime := time.Now()
	
	// 1. 幂等性检查
	if status, exists := s.checkIdempotency(req.IdempotencyKey); exists {
		if status.Status == "completed" {
			return status.Result, nil
		}
		if status.Status == "processing" {
			return nil, errors.New("IMPORT_IN_PROGRESS")
		}
	}

	// 2. 获取批次信息
	batch, err := s.batchRepo.FindByBatchID(ctx, tenantID, req.BatchID)
	if err != nil {
		return nil, ErrBatchNotFound
	}

	// 3. 检查批次状态
	if batch.Status != entity.ImportStatusPreview && batch.Status != entity.ImportStatusConfirmed {
		return nil, ErrBatchAlreadyProcessed
	}

	// 4. 检查批次是否过期
	if batch.IsExpired() {
		return nil, ErrBatchExpired
	}

	// 5. 标记为处理中
	s.markProcessing(req.IdempotencyKey, req.BatchID)

	// 6. 获取批次行数据
	rows, err := s.batchRepo.GetBatchRows(ctx, batch.ID)
	if err != nil {
		s.markFailed(req.IdempotencyKey)
		return nil, fmt.Errorf("failed to get batch rows: %w", err)
	}

	// 7. 检测冲突
	conflicts := s.detectConflicts(ctx, tenantID, rows)

	// 8. 解决冲突并准备数据
	defaultPolicy := req.ConflictPolicy
	if defaultPolicy == "" {
		defaultPolicy = dto.ConflictPolicyDefault
	}
	resolvedRows, receiptItems := s.conflictResolver.BatchResolve(
		ctx, tenantID, rows, conflicts, defaultPolicy, req.RowPolicies,
	)

	// 9. 批量写入用户数据
	successCount, failedCount, err := s.batchCreateUsers(ctx, tenantID, resolvedRows)
	if err != nil {
		s.markFailed(req.IdempotencyKey)
		return nil, fmt.Errorf("failed to create users: %w", err)
	}

	// 10. 更新批次状态
	batch.Status = entity.ImportStatusCompleted
	now := time.Now()
	batch.UpdatedAt = now
	if err := s.batchRepo.Update(ctx, batch); err != nil {
		s.logger.Error("failed to update batch status", zap.Error(err))
	}

	// 11. 生成回执
	items := make([]dto.ImportReceiptItem, 0, len(receiptItems))
	for _, item := range receiptItems {
		if item != nil {
			items = append(items, *item)
		}
	}
	receipt := &dto.ImportReceipt{
		BatchID:     req.BatchID,
		FileName:    batch.FileName,
		TotalRows:   batch.TotalRows,
		SuccessRows: successCount,
		SkippedRows: batch.TotalRows - len(resolvedRows),
		FailedRows:  failedCount,
		StartTime:   startTime,
		EndTime:     time.Now(),
		Duration:    time.Since(startTime).Milliseconds(),
		Items:       items,
		CreatedAt:   time.Now(),
	}

	// 12. 保存回执
	if err := s.batchRepo.SaveReceipt(ctx, batch.ID, receipt); err != nil {
		s.logger.Error("failed to save receipt", zap.Error(err))
	}

	// 13. 写入审计日志
	s.writeAuditLog(ctx, tenantID, batch, successCount, failedCount)

	// 14. 构建响应
	response := &dto.ConfirmImportResponse{
		BatchID:          req.BatchID,
		Status:           string(entity.ImportStatusCompleted),
		TotalRows:        batch.TotalRows,
		SuccessRows:      successCount,
		SkippedRows:      batch.TotalRows - len(resolvedRows),
		FailedRows:       failedCount,
		ReceiptAvailable: true,
		ReceiptURL:       fmt.Sprintf("/api/admin/users/import/%s/receipt", req.BatchID),
		CompletedAt:      time.Now(),
		Duration:         time.Since(startTime).Milliseconds(),
	}

	// 15. 标记处理完成
	s.markCompleted(req.IdempotencyKey, response)

	return response, nil
}

// GetReceipt 获取导入回执
func (s *ImportCommitService) GetReceipt(
	ctx context.Context,
	tenantID uuid.UUID,
	batchID string,
) (*dto.ImportReceipt, error) {
	batch, err := s.batchRepo.FindByBatchID(ctx, tenantID, batchID)
	if err != nil {
		return nil, ErrBatchNotFound
	}

	receipt, err := s.batchRepo.GetReceipt(ctx, batch.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get receipt: %w", err)
	}

	return receipt, nil
}

// checkIdempotency 检查幂等性
func (s *ImportCommitService) checkIdempotency(key string) (*ProcessingStatus, bool) {
	if v, ok := s.processingMap.Load(key); ok {
		return v.(*ProcessingStatus), true
	}
	return nil, false
}

// markProcessing 标记为处理中
func (s *ImportCommitService) markProcessing(key, batchID string) {
	s.processingMap.Store(key, &ProcessingStatus{
		BatchID:   batchID,
		Status:    "processing",
		StartTime: time.Now(),
	})
}

// markCompleted 标记为完成
func (s *ImportCommitService) markCompleted(key string, result *dto.ConfirmImportResponse) {
	if v, ok := s.processingMap.Load(key); ok {
		status := v.(*ProcessingStatus)
		status.Status = "completed"
		now := time.Now()
		status.EndTime = &now
		status.Result = result
	}
}

// markFailed 标记为失败
func (s *ImportCommitService) markFailed(key string) {
	if v, ok := s.processingMap.Load(key); ok {
		status := v.(*ProcessingStatus)
		status.Status = "failed"
		now := time.Now()
		status.EndTime = &now
	}
}

// detectConflicts 检测冲突
func (s *ImportCommitService) detectConflicts(
	ctx context.Context,
	tenantID uuid.UUID,
	rows []*entity.ImportRowData,
) map[int]*ConflictResult {
	conflicts := make(map[int]*ConflictResult)
	
	for i, row := range rows {
		if conflict := s.conflictChecker.CheckRow(ctx, tenantID, row, i+1); conflict.HasConflict {
			conflicts[i] = conflict
		}
	}
	
	// 也检查批次内部的冲突
	batchConflicts := s.conflictChecker.CheckBatch(rows)
	for i, conflict := range batchConflicts {
		conflicts[i] = conflict
	}
	
	return conflicts
}

// batchCreateUsers 批量创建用户
func (s *ImportCommitService) batchCreateUsers(
	ctx context.Context,
	tenantID uuid.UUID,
	rows []*entity.ImportRowData,
) (successCount, failedCount int, err error) {
	for _, row := range rows {
		// 创建用户模型
		user := &model.User{
			ID:         uuid.New().String(),
			TenantID:   tenantID.String(),
			Email:      row.Email,
			Name:       row.Name,
			EmployeeID: row.EmployeeCode,
			Phone:      row.Phone,
			Status:     "active",
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		// 设置密码（如果有）
		if row.Password != "" {
			user.PasswordHash = s.hashPasswordSimple(row.Password)
		} else {
			// 生成临时密码
			tempPassword := s.generateTempPassword()
			user.PasswordHash = s.hashPasswordSimple(tempPassword)
		}

		// 创建用户
		if createErr := s.userRepo.Create(ctx, user); createErr != nil {
			s.logger.Error("failed to create user",
				zap.String("username", row.Username),
				zap.Error(createErr),
			)
			failedCount++
			continue
		}

		// 绑定部门（如果有）
		if row.DepartmentCode != "" || row.DepartmentName != "" {
			if bindErr := s.bindDepartment(ctx, user.ID, row); bindErr != nil {
				s.logger.Warn("failed to bind department",
					zap.String("user_id", user.ID),
					zap.Error(bindErr),
				)
			}
		}

		// 设置上级（如果有）
		if row.ManagerUsername != "" {
			if setMgrErr := s.setManager(ctx, tenantID.String(), user.ID, row.ManagerUsername); setMgrErr != nil {
				s.logger.Warn("failed to set manager",
					zap.String("user_id", user.ID),
					zap.Error(setMgrErr),
				)
			}
		}

		successCount++
	}

	return successCount, failedCount, nil
}

// bindDepartment 绑定部门
func (s *ImportCommitService) bindDepartment(ctx context.Context, userID string, row *entity.ImportRowData) error {
	var dept *model.Department

	if row.DepartmentCode != "" {
		var err error
		dept, err = s.departmentRepo.FindByCode(ctx, "", row.DepartmentCode)
		if err != nil {
			return err
		}
	} else if row.DepartmentName != "" {
		// 需要通过名称查找部门
		depts, _ := s.departmentRepo.FindChildren(ctx, "") // 临时方案，实际需要 FindByName
		for _, d := range depts {
			if d.Name == row.DepartmentName {
				dept = d
				break
			}
		}
	}

	if dept == nil {
		return errors.New("department not found")
	}

	return s.userRepo.BindDepartments(ctx, userID, []string{dept.ID}, dept.ID)
}

// setManager 设置上级
func (s *ImportCommitService) setManager(ctx context.Context, tenantID, userID, managerUsername string) error {
	manager, err := s.userRepo.FindByUsername(ctx, tenantID, managerUsername)
	if err != nil || manager == nil {
		return errors.New("manager not found")
	}

	return s.userRepo.UpdateManagerID(ctx, tenantID, userID, &manager.ID)
}

// writeAuditLog 写入审计日志
func (s *ImportCommitService) writeAuditLog(
	ctx context.Context,
	tenantID uuid.UUID,
	batch *entity.ImportBatch,
	successCount, failedCount int,
) {
	detail := map[string]interface{}{
		"batch_id":     batch.BatchID,
		"file_name":    batch.FileName,
		"total_rows":   batch.TotalRows,
		"success_rows": successCount,
		"failed_rows":  failedCount,
	}
	detailJSON, _ := json.Marshal(detail)
	
	s.logger.Info("user_import_completed",
		zap.String("tenant_id", tenantID.String()),
		zap.String("batch_id", batch.BatchID),
		zap.Int("success_count", successCount),
		zap.Int("failed_count", failedCount),
		zap.String("detail", string(detailJSON)),
	)
}

// hashPasswordSimple 哈希密码
func (s *ImportCommitService) hashPasswordSimple(password string) string {
	// 使用 SHA256
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// generateTempPassword 生成临时密码
func (s *ImportCommitService) generateTempPassword() string {
	return uuid.New().String()[:12]
}
