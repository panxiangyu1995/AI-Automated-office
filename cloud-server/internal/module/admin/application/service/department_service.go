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
	ErrDepartmentNotFound      = errors.New("DEPARTMENT_NOT_FOUND")
	ErrDepartmentHasChildren   = errors.New("DEPARTMENT_HAS_CHILDREN")
	ErrDepartmentHasUsers      = errors.New("DEPARTMENT_HAS_USERS")
	ErrCircularReference       = errors.New("CIRCULAR_REFERENCE")
	ErrDuplicateCode           = errors.New("DUPLICATE_CODE")
)

// DepartmentService 部门服务
type DepartmentService struct {
	deptRepo    repository.DepartmentRepository
	db          *sql.DB
	logger      *zap.Logger
	auditLogger AuditLogger
}

// NewDepartmentService 创建部门服务
func NewDepartmentService(deptRepo repository.DepartmentRepository, db *sql.DB, logger *zap.Logger) *DepartmentService {
	return &DepartmentService{
		deptRepo: deptRepo,
		db:       db,
		logger:   logger,
	}
}

// SetAuditLogger 设置审计日志器
func (s *DepartmentService) SetAuditLogger(logger AuditLogger) {
	s.auditLogger = logger
}

// ListDepartmentsRequest 部门列表请求
type ListDepartmentsRequest struct {
	Page     int
	PageSize int
	Name     string
	Code     string
	Status   string
}

// ListDepartmentsResponse 部门列表响应
type ListDepartmentsResponse struct {
	Items    []*repository.DepartmentListItem `json:"items"`
	Total    int64                            `json:"total"`
	Page     int                              `json:"page"`
	PageSize int                              `json:"page_size"`
}

// CreateDepartmentRequest 创建部门请求
type CreateDepartmentRequest struct {
	Name      string  `json:"name"`
	Code      string  `json:"code,omitempty"`
	ParentID  *string `json:"parent_id,omitempty"`
	LeaderID  *string `json:"leader_id,omitempty"`
	SortOrder int     `json:"sort_order"`
}

// CreateDepartmentResponse 创建部门响应
type CreateDepartmentResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code,omitempty"`
}

// UpdateDepartmentRequest 更新部门请求
type UpdateDepartmentRequest struct {
	Name      string  `json:"name,omitempty"`
	Code      string  `json:"code,omitempty"`
	LeaderID  *string `json:"leader_id,omitempty"`
	SortOrder *int    `json:"sort_order,omitempty"`
	Status    string  `json:"status,omitempty"`
}

// MoveDepartmentRequest 移动部门请求
type MoveDepartmentRequest struct {
	NewParentID *string `json:"new_parent_id"`
}

// GetDepartmentTree 获取部门树
func (s *DepartmentService) GetDepartmentTree(ctx context.Context, tenantID string) ([]*repository.DepartmentTreeItem, error) {
	tree, err := s.deptRepo.FindTree(ctx, tenantID)
	if err != nil {
		s.logger.Error("failed to get department tree", zap.Error(err))
		return nil, err
	}
	return tree, nil
}

// ListDepartments 部门列表
func (s *DepartmentService) ListDepartments(ctx context.Context, tenantID string, req *ListDepartmentsRequest) (*ListDepartmentsResponse, error) {
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

	filter := &repository.DepartmentFilter{
		Name:   req.Name,
		Code:   req.Code,
		Status: req.Status,
	}

	result, err := s.deptRepo.FindWithFilters(ctx, tenantID, filter, req.Page, req.PageSize)
	if err != nil {
		s.logger.Error("failed to list departments", zap.Error(err))
		return nil, err
	}

	return &ListDepartmentsResponse{
		Items:    result.Items,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

// GetDepartmentDetail 获取部门详情
func (s *DepartmentService) GetDepartmentDetail(ctx context.Context, tenantID, departmentID string) (*repository.DepartmentDetail, error) {
	detail, err := s.deptRepo.FindDetailByID(ctx, tenantID, departmentID)
	if err != nil {
		s.logger.Error("failed to get department detail", zap.Error(err), zap.String("departmentID", departmentID))
		return nil, err
	}
	if detail == nil {
		return nil, ErrDepartmentNotFound
	}
	return detail, nil
}

// CreateDepartment 创建部门
func (s *DepartmentService) CreateDepartment(ctx context.Context, tenantID string, req *CreateDepartmentRequest) (*CreateDepartmentResponse, error) {
	// 校验必填字段
	if req.Name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrValidation)
	}

	// 检查编码唯一性
	if req.Code != "" {
		exists, err := s.deptRepo.ExistsByCode(ctx, tenantID, req.Code, "")
		if err != nil {
			s.logger.Error("failed to check department code", zap.Error(err))
			return nil, err
		}
		if exists {
			return nil, ErrDuplicateCode
		}
	}

	// 检查父部门是否存在
	if req.ParentID != nil {
		parent, err := s.deptRepo.FindByID(ctx, tenantID, *req.ParentID)
		if err != nil {
			s.logger.Error("failed to find parent department", zap.Error(err))
			return nil, err
		}
		if parent == nil {
			return nil, fmt.Errorf("%w: parent department not found", ErrValidation)
		}
	}

	// 创建部门模型
	department := &model.Department{
		TenantID:  tenantID,
		Name:      req.Name,
		Code:      req.Code,
		ParentID:  req.ParentID,
		LeaderID:  req.LeaderID,
		SortOrder: req.SortOrder,
		Status:    "active",
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return nil, err
	}
	defer tx.Rollback()

	// 创建部门
	if err := s.deptRepo.Create(ctx, department); err != nil {
		s.logger.Error("failed to create department", zap.Error(err))
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return nil, err
	}

	s.logger.Info("department created",
		zap.String("departmentID", department.ID),
		zap.String("name", req.Name),
		zap.String("tenantID", tenantID),
	)

	return &CreateDepartmentResponse{
		ID:   department.ID,
		Name: department.Name,
		Code: department.Code,
	}, nil
}

// UpdateDepartment 更新部门
func (s *DepartmentService) UpdateDepartment(ctx context.Context, tenantID, departmentID string, req *UpdateDepartmentRequest) error {
	// 获取部门
	dept, err := s.deptRepo.FindByID(ctx, tenantID, departmentID)
	if err != nil {
		s.logger.Error("failed to find department", zap.Error(err), zap.String("departmentID", departmentID))
		return err
	}
	if dept == nil {
		return ErrDepartmentNotFound
	}

	// 检查编码唯一性
	if req.Code != "" && req.Code != dept.Code {
		exists, err := s.deptRepo.ExistsByCode(ctx, tenantID, req.Code, departmentID)
		if err != nil {
			s.logger.Error("failed to check department code", zap.Error(err))
			return err
		}
		if exists {
			return ErrDuplicateCode
		}
		dept.Code = req.Code
	}

	// 更新字段
	if req.Name != "" {
		dept.Name = req.Name
	}
	if req.LeaderID != nil {
		dept.LeaderID = req.LeaderID
	}
	if req.SortOrder != nil {
		dept.SortOrder = *req.SortOrder
	}
	if req.Status != "" {
		dept.Status = req.Status
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return err
	}
	defer tx.Rollback()

	// 更新部门
	if err := s.deptRepo.Update(ctx, dept); err != nil {
		s.logger.Error("failed to update department", zap.Error(err))
		return err
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return err
	}

	s.logger.Info("department updated",
		zap.String("departmentID", departmentID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// MoveDepartment 移动部门
func (s *DepartmentService) MoveDepartment(ctx context.Context, tenantID, departmentID string, req *MoveDepartmentRequest) error {
	// 获取部门
	dept, err := s.deptRepo.FindByID(ctx, tenantID, departmentID)
	if err != nil {
		s.logger.Error("failed to find department", zap.Error(err), zap.String("departmentID", departmentID))
		return err
	}
	if dept == nil {
		return ErrDepartmentNotFound
	}

	// 如果新父部门不为空
	if req.NewParentID != nil {
		// 不能移动到自己
		if *req.NewParentID == departmentID {
			return fmt.Errorf("%w: cannot move department to itself", ErrValidation)
		}

		// 检查循环引用
		isCircular, err := s.deptRepo.CheckCircularReference(ctx, departmentID, *req.NewParentID)
		if err != nil {
			s.logger.Error("failed to check circular reference", zap.Error(err))
			return err
		}
		if isCircular {
			return ErrCircularReference
		}

		// 检查新父部门是否存在
		newParent, err := s.deptRepo.FindByID(ctx, tenantID, *req.NewParentID)
		if err != nil {
			s.logger.Error("failed to find new parent department", zap.Error(err))
			return err
		}
		if newParent == nil {
			return fmt.Errorf("%w: new parent department not found", ErrValidation)
		}

		dept.ParentID = req.NewParentID
	} else {
		// 移动到根级别
		dept.ParentID = nil
	}

	// 更新部门
	if err := s.deptRepo.Update(ctx, dept); err != nil {
		s.logger.Error("failed to move department", zap.Error(err))
		return err
	}

	s.logger.Info("department moved",
		zap.String("departmentID", departmentID),
		zap.Stringp("newParentID", req.NewParentID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// DeleteDepartment 删除部门
func (s *DepartmentService) DeleteDepartment(ctx context.Context, tenantID, departmentID string) error {
	// 检查部门是否存在
	dept, err := s.deptRepo.FindByID(ctx, tenantID, departmentID)
	if err != nil {
		s.logger.Error("failed to find department", zap.Error(err), zap.String("departmentID", departmentID))
		return err
	}
	if dept == nil {
		return ErrDepartmentNotFound
	}

	// 检查是否有子部门
	hasChildren, err := s.deptRepo.HasChildren(ctx, departmentID)
	if err != nil {
		s.logger.Error("failed to check children", zap.Error(err))
		return err
	}
	if hasChildren {
		return ErrDepartmentHasChildren
	}

	// 检查是否有员工
	hasUsers, err := s.deptRepo.HasEmployees(ctx, departmentID)
	if err != nil {
		s.logger.Error("failed to check employees", zap.Error(err))
		return err
	}
	if hasUsers {
		return ErrDepartmentHasUsers
	}

	// 删除部门
	if err := s.deptRepo.Delete(ctx, tenantID, departmentID); err != nil {
		s.logger.Error("failed to delete department", zap.Error(err))
		return err
	}

	s.logger.Info("department deleted",
		zap.String("departmentID", departmentID),
		zap.String("tenantID", tenantID),
	)

	return nil
}
