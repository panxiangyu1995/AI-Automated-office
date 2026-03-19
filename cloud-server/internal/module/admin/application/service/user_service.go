package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"math/big"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/domain/repository"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const (
	passwordCost      = 12
	defaultPageSize   = 20
	maxPageSize       = 100
	tempPasswordLength = 12
)

var (
	ErrUserNotFound            = errors.New("USER_NOT_FOUND")
	ErrDuplicateUsername       = errors.New("DUPLICATE_USERNAME")
	ErrDuplicateEmployeeCode   = errors.New("DUPLICATE_EMPLOYEE_CODE")
	ErrValidation              = errors.New("VALIDATION_ERROR")
	ErrPermissionDenied        = errors.New("PERMISSION_DENIED")
)

// UserService 用户服务
type UserService struct {
	userRepo    repository.UserRepository
	db          *sql.DB
	logger      *zap.Logger
	auditLogger AuditLogger
}

// NewUserService 创建用户服务
func NewUserService(userRepo repository.UserRepository, db *sql.DB, logger *zap.Logger) *UserService {
	return &UserService{
		userRepo: userRepo,
		db:       db,
		logger:   logger,
	}
}

// SetAuditLogger 设置审计日志器
func (s *UserService) SetAuditLogger(logger AuditLogger) {
	s.auditLogger = logger
}

// ListUsersRequest 用户列表请求
type ListUsersRequest struct {
	Page         int
	PageSize     int
	Name         string
	EmployeeCode string
	DepartmentID string
	Status       string
}

// ListUsersResponse 用户列表响应
type ListUsersResponse struct {
	Items    []*repository.UserListItem `json:"items"`
	Total    int64                      `json:"total"`
	Page     int                        `json:"page"`
	PageSize int                        `json:"page_size"`
}

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username        string   `json:"username"`
	RealName        string   `json:"real_name"`
	EmployeeCode    string   `json:"employee_code"`
	Email           string   `json:"email"`
	Phone           string   `json:"phone"`
	DepartmentIDs   []string `json:"department_ids"`
	RoleIDs         []string `json:"role_ids"`
	SendNotification bool    `json:"send_notification"`
}

// CreateUserResponse 创建用户响应
type CreateUserResponse struct {
	ID           string `json:"id"`
	Username     string `json:"username"`
	RealName     string `json:"real_name"`
	TempPassword string `json:"temp_password"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	RealName      string   `json:"real_name"`
	Email         string   `json:"email"`
	Phone         string   `json:"phone"`
	DepartmentIDs []string `json:"department_ids"`
	RoleIDs       []string `json:"role_ids"`
}

// UpdateStatusRequest 更新状态请求
type UpdateStatusRequest struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

// AuditContext 审计上下文
type AuditContext struct {
	OperatorID   string
	OperatorName string
	IPAddress    string
	UserAgent    string
	TraceID      string
}

// ListUsers 用户列表
func (s *UserService) ListUsers(ctx context.Context, tenantID string, req *ListUsersRequest) (*ListUsersResponse, error) {
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

	filter := &repository.UserFilter{
		Name:         req.Name,
		EmployeeCode: req.EmployeeCode,
		DepartmentID: req.DepartmentID,
		Status:       req.Status,
	}

	result, err := s.userRepo.FindWithFilters(ctx, tenantID, filter, req.Page, req.PageSize)
	if err != nil {
		s.logger.Error("failed to list users", zap.Error(err))
		return nil, err
	}

	return &ListUsersResponse{
		Items:    result.Items,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

// GetUserDetail 获取用户详情
func (s *UserService) GetUserDetail(ctx context.Context, tenantID, userID string) (*repository.UserDetail, error) {
	detail, err := s.userRepo.FindDetailByID(ctx, tenantID, userID)
	if err != nil {
		s.logger.Error("failed to get user detail", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}
	if detail == nil {
		return nil, ErrUserNotFound
	}
	return detail, nil
}

// CreateUser 创建用户
func (s *UserService) CreateUser(ctx context.Context, tenantID string, req *CreateUserRequest) (*CreateUserResponse, error) {
	// 校验必填字段
	if req.Username == "" {
		return nil, fmt.Errorf("%w: username is required", ErrValidation)
	}
	if req.RealName == "" {
		return nil, fmt.Errorf("%w: real_name is required", ErrValidation)
	}
	if req.EmployeeCode == "" {
		return nil, fmt.Errorf("%w: employee_code is required", ErrValidation)
	}

	// 检查用户名唯一性
	exists, err := s.userRepo.ExistsByUsername(ctx, tenantID, req.Username)
	if err != nil {
		s.logger.Error("failed to check username", zap.Error(err))
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateUsername
	}

	// 检查工号唯一性
	exists, err = s.userRepo.ExistsByEmployeeCode(ctx, tenantID, req.EmployeeCode)
	if err != nil {
		s.logger.Error("failed to check employee code", zap.Error(err))
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateEmployeeCode
	}

	// 生成临时密码
	tempPassword, err := generateTempPassword(tempPasswordLength)
	if err != nil {
		s.logger.Error("failed to generate temp password", zap.Error(err))
		return nil, err
	}

	// 哈希密码
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), passwordCost)
	if err != nil {
		s.logger.Error("failed to hash password", zap.Error(err))
		return nil, err
	}

	// 创建用户模型
	user := &model.User{
		TenantID:     tenantID,
		Email:        req.Username,
		PasswordHash: string(passwordHash),
		Name:         req.RealName,
		EmployeeID:   req.EmployeeCode,
		Phone:        req.Phone,
		Status:       "active",
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return nil, err
	}
	defer tx.Rollback()

	// 创建用户
	if err := s.userRepo.Create(ctx, user); err != nil {
		s.logger.Error("failed to create user", zap.Error(err))
		return nil, err
	}

	// 绑定部门
	if len(req.DepartmentIDs) > 0 {
		primaryDeptID := ""
		if len(req.DepartmentIDs) > 0 {
			primaryDeptID = req.DepartmentIDs[0]
		}
		if err := s.userRepo.BindDepartments(ctx, user.ID, req.DepartmentIDs, primaryDeptID); err != nil {
			s.logger.Error("failed to bind departments", zap.Error(err))
			return nil, err
		}
	}

	// 绑定角色
	if len(req.RoleIDs) > 0 {
		if err := s.userRepo.BindRoles(ctx, user.ID, req.RoleIDs); err != nil {
			s.logger.Error("failed to bind roles", zap.Error(err))
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return nil, err
	}

	s.logger.Info("user created",
		zap.String("userID", user.ID),
		zap.String("username", req.Username),
		zap.String("tenantID", tenantID),
	)

	return &CreateUserResponse{
		ID:           user.ID,
		Username:     req.Username,
		RealName:     req.RealName,
		TempPassword: tempPassword,
	}, nil
}

// UpdateUser 更新用户
func (s *UserService) UpdateUser(ctx context.Context, tenantID, userID string, req *UpdateUserRequest) error {
	// 获取用户
	user, err := s.userRepo.FindByID(ctx, tenantID, userID)
	if err != nil {
		s.logger.Error("failed to find user", zap.Error(err), zap.String("userID", userID))
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	// 更新字段
	if req.RealName != "" {
		user.Name = req.RealName
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}

	// 开始事务
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return err
	}
	defer tx.Rollback()

	// 更新用户
	if err := s.userRepo.Update(ctx, user); err != nil {
		s.logger.Error("failed to update user", zap.Error(err))
		return err
	}

	// 更新部门绑定
	if req.DepartmentIDs != nil {
		primaryDeptID := ""
		if len(req.DepartmentIDs) > 0 {
			primaryDeptID = req.DepartmentIDs[0]
		}
		if err := s.userRepo.BindDepartments(ctx, userID, req.DepartmentIDs, primaryDeptID); err != nil {
			s.logger.Error("failed to bind departments", zap.Error(err))
			return err
		}
	}

	// 更新角色绑定
	if req.RoleIDs != nil {
		if err := s.userRepo.BindRoles(ctx, userID, req.RoleIDs); err != nil {
			s.logger.Error("failed to bind roles", zap.Error(err))
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return err
	}

	s.logger.Info("user updated",
		zap.String("userID", userID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// UpdateStatus 更新用户状态
func (s *UserService) UpdateStatus(ctx context.Context, tenantID, userID string, req *UpdateStatusRequest) error {
	// 校验状态值
	validStatuses := map[string]bool{
		"active":   true,
		"inactive": true,
		"locked":   true,
	}
	if !validStatuses[req.Status] {
		return fmt.Errorf("%w: invalid status value", ErrValidation)
	}

	// 检查用户是否存在
	user, err := s.userRepo.FindByID(ctx, tenantID, userID)
	if err != nil {
		s.logger.Error("failed to find user", zap.Error(err), zap.String("userID", userID))
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	// 更新状态
	if err := s.userRepo.UpdateStatus(ctx, tenantID, userID, req.Status); err != nil {
		s.logger.Error("failed to update user status", zap.Error(err))
		return err
	}

	s.logger.Info("user status updated",
		zap.String("userID", userID),
		zap.String("status", req.Status),
		zap.String("reason", req.Reason),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// generateTempPassword 生成临时密码
func generateTempPassword(length int) (string, error) {
	const (
		uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		lowercase = "abcdefghijklmnopqrstuvwxyz"
		digits    = "0123456789"
		special   = "!@#$%^&*"
		all       = uppercase + lowercase + digits + special
	)

	// 确保包含各类字符
	password := make([]byte, 0, length)
	password = append(password, mustRandomChar(uppercase))
	password = append(password, mustRandomChar(lowercase))
	password = append(password, mustRandomChar(digits))
	password = append(password, mustRandomChar(special))

	// 填充剩余字符
	for i := 4; i < length; i++ {
		c, err := randomChar(all)
		if err != nil {
			return "", err
		}
		password = append(password, c)
	}

	// 打乱顺序
	for i := len(password) - 1; i > 0; i-- {
		j, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			return "", err
		}
		password[i], password[j.Int64()] = password[j.Int64()], password[i]
	}

	return string(password), nil
}

func randomChar(chars string) (byte, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
	if err != nil {
		return 0, err
	}
	return chars[n.Int64()], nil
}

func mustRandomChar(chars string) byte {
	c, err := randomChar(chars)
	if err != nil {
		panic(err)
	}
	return c
}
