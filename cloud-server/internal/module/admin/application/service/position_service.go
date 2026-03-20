package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/domain/repository"

	"go.uber.org/zap"
)

var (
	ErrPositionNotFound    = errors.New("POSITION_NOT_FOUND")
	ErrPositionHasUsers    = errors.New("POSITION_HAS_USERS")
)

// PositionService 岗位服务
type PositionService struct {
	positionRepo repository.PositionRepository
	deptRepo     repository.DepartmentRepository
	db           *sql.DB
	logger       *zap.Logger
	auditLogger  AuditLogger
}

// NewPositionService 创建岗位服务
func NewPositionService(positionRepo repository.PositionRepository, deptRepo repository.DepartmentRepository, db *sql.DB, logger *zap.Logger) *PositionService {
	return &PositionService{
		positionRepo: positionRepo,
		deptRepo:     deptRepo,
		db:           db,
		logger:       logger,
	}
}

// SetAuditLogger 设置审计日志器
func (s *PositionService) SetAuditLogger(logger AuditLogger) {
	s.auditLogger = logger
}

// ListPositionsRequest 岗位列表请求
type ListPositionsRequest struct {
	Page         int
	PageSize     int
	Name         string
	Code         string
	DepartmentID string
	Status       string
}

// ListPositionsResponse 岗位列表响应
type ListPositionsResponse struct {
	Items    []*repository.PositionListItem `json:"items"`
	Total    int64                          `json:"total"`
	Page     int                            `json:"page"`
	PageSize int                            `json:"page_size"`
}

// CreatePositionRequest 创建岗位请求
type CreatePositionRequest struct {
	Name         string  `json:"name"`
	Code         string  `json:"code,omitempty"`
	DepartmentID *string `json:"department_id,omitempty"`
	Description  string  `json:"description,omitempty"`
	Level        *int    `json:"level,omitempty"`
	SortOrder    int     `json:"sort_order"`
}

// CreatePositionResponse 创建岗位响应
type CreatePositionResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code,omitempty"`
}

// UpdatePositionRequest 更新岗位请求
type UpdatePositionRequest struct {
	Name         string  `json:"name,omitempty"`
	Code         string  `json:"code,omitempty"`
	DepartmentID *string `json:"department_id,omitempty"`
	Description  string  `json:"description,omitempty"`
	Level        *int    `json:"level,omitempty"`
	SortOrder    *int    `json:"sort_order,omitempty"`
	Status       string  `json:"status,omitempty"`
}

// ListPositions 岗位列表
func (s *PositionService) ListPositions(ctx context.Context, tenantID string, req *ListPositionsRequest) (*ListPositionsResponse, error) {
	// 设置默认分页
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = defaultPageSize
	}
	if req.PageSize > maxPageSize {
		req.PageSize = maxPageSize
	}

	filter := &repository.PositionFilter{
		Name:         req.Name,
		Code:         req.Code,
		DepartmentID: req.DepartmentID,
		Status:       req.Status,
	}

	result, err := s.positionRepo.FindWithFilters(ctx, tenantID, filter, req.Page, req.PageSize)
	if err != nil {
		s.logger.Error("failed to list positions", zap.Error(err))
		return nil, err
	}

	return &ListPositionsResponse{
		Items:    result.Items,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

// GetPositionDetail 获取岗位详情
func (s *PositionService) GetPositionDetail(ctx context.Context, tenantID, positionID string) (*repository.PositionDetail, error) {
	detail, err := s.positionRepo.FindDetailByID(ctx, tenantID, positionID)
	if err != nil {
		s.logger.Error("failed to get position detail", zap.Error(err), zap.String("positionID", positionID))
		return nil, err
	}
	if detail == nil {
		return nil, ErrPositionNotFound
	}
	return detail, nil
}

// CreatePosition 创建岗位
func (s *PositionService) CreatePosition(ctx context.Context, tenantID string, req *CreatePositionRequest) (*CreatePositionResponse, error) {
	// 校验必填字段
	if req.Name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrValidation)
	}

	// 检查编码唯一性
	if req.Code != "" {
		exists, err := s.positionRepo.ExistsByCode(ctx, tenantID, req.Code, "")
		if err != nil {
			s.logger.Error("failed to check position code", zap.Error(err))
			return nil, err
		}
		if exists {
			return nil, ErrDuplicateCode
		}
	}

	// 检查部门是否存在
	if req.DepartmentID != nil {
		dept, err := s.deptRepo.FindByID(ctx, tenantID, *req.DepartmentID)
		if err != nil {
			s.logger.Error("failed to find department", zap.Error(err))
			return nil, err
		}
		if dept == nil {
			return nil, fmt.Errorf("%w: department not found", ErrValidation)
		}
	}

	// 创建岗位模型
	position := &model.Position{
		TenantID:     tenantID,
		Name:         req.Name,
		Code:         req.Code,
		DepartmentID: req.DepartmentID,
		Description:  req.Description,
		Level:        req.Level,
		SortOrder:    req.SortOrder,
		Status:       "active",
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return nil, err
	}
	defer tx.Rollback()

	// 创建岗位
	if err := s.positionRepo.Create(ctx, position); err != nil {
		s.logger.Error("failed to create position", zap.Error(err))
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return nil, err
	}

	s.logger.Info("position created",
		zap.String("positionID", position.ID),
		zap.String("name", req.Name),
		zap.String("tenantID", tenantID),
	)

	return &CreatePositionResponse{
		ID:   position.ID,
		Name: position.Name,
		Code: position.Code,
	}, nil
}

// UpdatePosition 更新岗位
func (s *PositionService) UpdatePosition(ctx context.Context, tenantID, positionID string, req *UpdatePositionRequest) error {
	// 获取岗位
	pos, err := s.positionRepo.FindByID(ctx, tenantID, positionID)
	if err != nil {
		s.logger.Error("failed to find position", zap.Error(err), zap.String("positionID", positionID))
		return err
	}
	if pos == nil {
		return ErrPositionNotFound
	}

	// 检查编码唯一性
	if req.Code != "" && req.Code != pos.Code {
		exists, err := s.positionRepo.ExistsByCode(ctx, tenantID, req.Code, positionID)
		if err != nil {
			s.logger.Error("failed to check position code", zap.Error(err))
			return err
		}
		if exists {
			return ErrDuplicateCode
		}
		pos.Code = req.Code
	}

	// 检查部门是否存在
	if req.DepartmentID != nil {
		if *req.DepartmentID != "" {
			dept, err := s.deptRepo.FindByID(ctx, tenantID, *req.DepartmentID)
			if err != nil {
				s.logger.Error("failed to find department", zap.Error(err))
				return err
			}
			if dept == nil {
				return fmt.Errorf("%w: department not found", ErrValidation)
			}
		}
		pos.DepartmentID = req.DepartmentID
	}

	// 更新字段
	if req.Name != "" {
		pos.Name = req.Name
	}
	if req.Description != "" {
		pos.Description = req.Description
	}
	if req.Level != nil {
		pos.Level = req.Level
	}
	if req.SortOrder != nil {
		pos.SortOrder = *req.SortOrder
	}
	if req.Status != "" {
		pos.Status = req.Status
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return err
	}
	defer tx.Rollback()

	// 更新岗位
	if err := s.positionRepo.Update(ctx, pos); err != nil {
		s.logger.Error("failed to update position", zap.Error(err))
		return err
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return err
	}

	s.logger.Info("position updated",
		zap.String("positionID", positionID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// DeletePosition 删除岗位
func (s *PositionService) DeletePosition(ctx context.Context, tenantID, positionID string) error {
	// 检查岗位是否存在
	pos, err := s.positionRepo.FindByID(ctx, tenantID, positionID)
	if err != nil {
		s.logger.Error("failed to find position", zap.Error(err), zap.String("positionID", positionID))
		return err
	}
	if pos == nil {
		return ErrPositionNotFound
	}

	// 检查是否有员工
	hasUsers, err := s.positionRepo.HasEmployees(ctx, positionID)
	if err != nil {
		s.logger.Error("failed to check employees", zap.Error(err))
		return err
	}
	if hasUsers {
		return ErrPositionHasUsers
	}

	// 删除岗位
	if err := s.positionRepo.Delete(ctx, tenantID, positionID); err != nil {
		s.logger.Error("failed to delete position", zap.Error(err))
		return err
	}

	s.logger.Info("position deleted",
		zap.String("positionID", positionID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// GetPositionsByDepartment 获取部门下的岗位
func (s *PositionService) GetPositionsByDepartment(ctx context.Context, tenantID, departmentID string) ([]*model.Position, error) {
	// 检查部门是否存在
	dept, err := s.deptRepo.FindByID(ctx, tenantID, departmentID)
	if err != nil {
		s.logger.Error("failed to find department", zap.Error(err))
		return nil, err
	}
	if dept == nil {
		return nil, fmt.Errorf("%w: department not found", ErrValidation)
	}

	positions, err := s.positionRepo.FindByDepartmentID(ctx, departmentID)
	if err != nil {
		s.logger.Error("failed to get positions by department", zap.Error(err))
		return nil, err
	}

	return positions, nil
}
