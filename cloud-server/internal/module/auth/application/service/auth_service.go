package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/application/dto"
	"cloud-server/internal/module/auth/domain/entity"
	domainService "cloud-server/internal/module/auth/domain/service"
	"cloud-server/internal/module/auth/domain/repository"
	"cloud-server/internal/module/auth/infrastructure/crypto"

	"go.uber.org/zap"
)

// AuthConfig 认证配置
type AuthConfig struct {
	AccessTokenExpire  time.Duration // Access Token 过期时间
	RefreshTokenExpire time.Duration // Refresh Token 过期时间
	MaxLoginAttempts   int           // 最大登录尝试次数
	LockoutDuration    time.Duration // 锁定时长
	PasswordMinLength  int           // 密码最小长度
}

// DefaultAuthConfig 默认认证配置
func DefaultAuthConfig() AuthConfig {
	return AuthConfig{
		AccessTokenExpire:  1 * time.Hour,
		RefreshTokenExpire: 24 * time.Hour * 7,
		MaxLoginAttempts:   5,
		LockoutDuration:    15 * time.Minute,
		PasswordMinLength:  8,
	}
}

// AuthService 认证服务
type AuthService struct {
	userRepo         repository.UserRepository
	sessionRepo      repository.SessionRepository
	loginAttemptRepo repository.LoginAttemptRepository
	lockPolicySvc    *domainService.LockPolicyService
	permissionSvc    *domainService.PermissionService
	passwordHasher   crypto.PasswordPolicy
	tokenManager     crypto.TokenManager
	db               *sql.DB
	logger           *zap.Logger
	config           AuthConfig
}

// NewAuthService 创建认证服务
func NewAuthService(
	userRepo repository.UserRepository,
	sessionRepo repository.SessionRepository,
	loginAttemptRepo repository.LoginAttemptRepository,
	lockPolicySvc *domainService.LockPolicyService,
	permissionSvc *domainService.PermissionService,
	passwordHasher crypto.PasswordPolicy,
	tokenManager crypto.TokenManager,
	db *sql.DB,
	logger *zap.Logger,
	config AuthConfig,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		sessionRepo:      sessionRepo,
		loginAttemptRepo: loginAttemptRepo,
		lockPolicySvc:    lockPolicySvc,
		permissionSvc:    permissionSvc,
		passwordHasher:   passwordHasher,
		tokenManager:     tokenManager,
		db:               db,
		logger:           logger,
		config:           config,
	}
}

// Login 登录
func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	tenantID := req.TenantID
	if tenantID == "" {
		var err error
		tenantID, err = s.getDefaultTenantID(ctx)
		if err != nil {
			s.logger.Error("failed to get default tenant", zap.Error(err))
			return nil, ErrTenantNotFound
		}
	}

	// Extract client info for audit logging
	ipAddress := extractIPAddress(ctx)
	userAgent := extractUserAgent(ctx)

	// Find user
	userWithRole, err := s.userRepo.GetUserWithRole(ctx, tenantID, req.Username)
	if err != nil {
		s.logger.Warn("error finding user",
			zap.String("email", req.Username),
			zap.String("tenant_id", tenantID),
			zap.Error(err),
		)
		return nil, ErrInvalidCredentials
	}

	// User not found - record failed attempt (without user ID)
	if userWithRole == nil || userWithRole.User == nil {
		s.recordFailedLogin(ctx, nil, tenantID, req.Username, ipAddress, userAgent, entity.FailureReasonUserNotFound)
		s.logger.Warn("user not found",
			zap.String("email", req.Username),
			zap.String("tenant_id", tenantID),
		)
		return nil, ErrInvalidCredentials
	}

	user := userWithRole.User

	// Check if account is disabled
	if user.Status != "active" {
		s.recordFailedLogin(ctx, &user.ID, tenantID, req.Username, ipAddress, userAgent, entity.FailureReasonAccountDisabled)
		s.logger.Warn("account is disabled",
			zap.String("user_id", user.ID),
			zap.String("email", user.Email),
		)
		return nil, ErrAccountDisabled
	}

	// Check and clear expired lock if any
	_, err = s.lockPolicySvc.CheckAndClearExpiredLock(ctx, user)
	if err != nil {
		s.logger.Error("failed to check expired lock", zap.Error(err))
	}

	// Check if account is locked
	if s.lockPolicySvc.IsLocked(user) {
		remainingTime := s.lockPolicySvc.GetRemainingLockTime(user)
		s.recordFailedLogin(ctx, &user.ID, tenantID, req.Username, ipAddress, userAgent, entity.FailureReasonAccountLocked)
		s.logger.Warn("account is locked",
			zap.String("user_id", user.ID),
			zap.Duration("remaining_time", remainingTime),
		)
		return nil, ErrAccountLocked
	}

	// Verify password
	if !s.passwordHasher.Verify(user.PasswordHash, req.Password) {
		// Record failed attempt and potentially lock account
		failedCount, isLocked, err := s.lockPolicySvc.RecordFailedAttempt(ctx, user)
		if err != nil {
			s.logger.Error("failed to record failed attempt", zap.Error(err))
		}

		failureReason := entity.FailureReasonInvalidPassword
		if isLocked {
			failureReason = entity.FailureReasonTooManyAttempts
		}

		s.recordFailedLogin(ctx, &user.ID, tenantID, req.Username, ipAddress, userAgent, failureReason)

		s.logger.Warn("invalid password",
			zap.String("user_id", user.ID),
			zap.Int("failed_attempts", failedCount),
			zap.Bool("locked", isLocked),
		)

		if isLocked {
			return nil, ErrAccountLocked
		}
		return nil, ErrInvalidCredentials
	}

	// Reset failed attempts on successful login
	err = s.lockPolicySvc.ResetFailedAttempts(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to reset failed attempts", zap.Error(err))
		// Continue with login anyway
	}

	// Get user permissions
	permissionCodes, err := s.permissionSvc.GetUserPermissionCodes(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to get user permissions", zap.Error(err))
		permissionCodes = []string{}
	}

	// Prepare roles
	roles := []string{}
	if userWithRole.RoleCode != "" {
		roles = append(roles, userWithRole.RoleCode)
	}

	// Generate tokens
	tokenPair, err := s.tokenManager.GenerateTokenPair(user.ID, tenantID, roles, permissionCodes)
	if err != nil {
		s.logger.Error("failed to generate tokens", zap.Error(err))
		return nil, ErrTokenGeneration
	}

	// Create session
	session := &model.Session{
		UserID:           user.ID,
		TenantID:         tenantID,
		TokenHash:        crypto.HashToken(tokenPair.AccessToken),
		RefreshTokenHash: crypto.HashToken(tokenPair.RefreshToken),
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		ExpiresAt:        time.Now().Add(s.config.RefreshTokenExpire),
		LastActivityAt:   time.Now(),
	}

	err = s.sessionRepo.Create(ctx, session)
	if err != nil {
		s.logger.Error("failed to create session", zap.Error(err))
		// Continue anyway, session is not critical for login
	}

	// Record successful login attempt
	s.recordSuccessfulLogin(ctx, user.ID, tenantID, req.Username, ipAddress, userAgent)

	s.logger.Info("user logged in successfully",
		zap.String("user_id", user.ID),
		zap.String("email", user.Email),
		zap.String("tenant_id", tenantID),
	)

	// Build response
	return &dto.LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		TokenType:    "Bearer",
		User: &dto.UserProfile{
			ID:           user.ID,
			Username:     user.Email,
			Email:        user.Email,
			RealName:     user.Name,
			Phone:        user.Phone,
			AvatarURL:    user.AvatarURL,
			EmployeeID:   user.EmployeeID,
			DepartmentID: userWithRole.DepartmentID,
			Status:       user.Status,
		},
		Tenant: &dto.TenantInfo{
			ID: tenantID,
		},
		Permissions: &dto.PermissionSummary{
			Roles:       roles,
			Permissions: permissionCodes,
		},
	}, nil
}

// Logout 登出
func (s *AuthService) Logout(ctx context.Context, userID, sessionID string, allSessions bool) error {
	if allSessions {
		return s.sessionRepo.RevokeAllByUserID(ctx, userID, "user_logout")
	}
	return s.sessionRepo.Revoke(ctx, sessionID, "user_logout")
}

// RefreshToken 刷新 Token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*dto.RefreshTokenResponse, error) {
	// Validate the refresh token
	claims, err := s.tokenManager.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Check if session exists and is valid
	session, err := s.sessionRepo.FindByTokenHash(ctx, crypto.HashToken(refreshToken))
	if err != nil || session == nil {
		return nil, ErrTokenInvalid
	}

	// Get updated permissions
	permissionCodes, err := s.permissionSvc.GetUserPermissionCodes(ctx, claims.UserID)
	if err != nil {
		s.logger.Error("failed to get user permissions during refresh", zap.Error(err))
		permissionCodes = claims.Permissions
	}

	// Generate new token pair
	tokenPair, err := s.tokenManager.GenerateTokenPair(claims.UserID, claims.TenantID, claims.Roles, permissionCodes)
	if err != nil {
		return nil, err
	}

	// Update session with new tokens
	session.TokenHash = crypto.HashToken(tokenPair.AccessToken)
	session.RefreshTokenHash = crypto.HashToken(tokenPair.RefreshToken)
	session.LastActivityAt = time.Now()

	return &dto.RefreshTokenResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		TokenType:    "Bearer",
	}, nil
}

// Register 注册
func (s *AuthService) Register(ctx context.Context, req *dto.RegisterRequest) (*dto.UserProfile, error) {
	// TODO: 实现注册逻辑
	return nil, errors.New("not implemented")
}

// ValidateToken 验证 Token
func (s *AuthService) ValidateToken(ctx context.Context, token string) (*model.User, error) {
	claims, err := s.tokenManager.ValidateToken(token)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.FindByID(ctx, claims.TenantID, claims.UserID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, ErrInvalidCredentials
	}

	if user.Status != "active" {
		return nil, ErrAccountDisabled
	}

	return user, nil
}

// recordFailedLogin records a failed login attempt
func (s *AuthService) recordFailedLogin(ctx context.Context, userID *string, tenantID, email, ipAddress, userAgent, reason string) {
	attempt := entity.NewFailedAttempt(tenantID, email, ipAddress, userAgent, reason)
	if userID != nil {
		attempt = entity.NewFailedAttemptWithUser(*userID, tenantID, email, ipAddress, userAgent, reason)
	}

	err := s.loginAttemptRepo.Create(ctx, attempt)
	if err != nil {
		s.logger.Error("failed to record failed login attempt", zap.Error(err))
	}
}

// recordSuccessfulLogin records a successful login attempt
func (s *AuthService) recordSuccessfulLogin(ctx context.Context, userID, tenantID, email, ipAddress, userAgent string) {
	attempt := entity.NewSuccessfulAttempt(userID, tenantID, email, ipAddress, userAgent)
	err := s.loginAttemptRepo.Create(ctx, attempt)
	if err != nil {
		s.logger.Error("failed to record successful login attempt", zap.Error(err))
	}
}

// GetDefaultTenantID 获取默认租户 ID
func (s *AuthService) getDefaultTenantID(ctx context.Context) (string, error) {
	// TODO: 从租户服务获取
	return "default", nil
}

// extractIPAddress extracts IP address from context
func extractIPAddress(ctx context.Context) string {
	// TODO: Extract from context if set by middleware
	return ""
}

// extractUserAgent extracts user agent from context
func extractUserAgent(ctx context.Context) string {
	// TODO: Extract from context if set by middleware
	return ""
}

// 认证相关错误
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountDisabled    = errors.New("account is disabled")
	ErrAccountLocked      = errors.New("account is locked")
	ErrTokenExpired       = errors.New("token has expired")
	ErrTokenInvalid       = errors.New("token is invalid")
	ErrTokenGeneration    = errors.New("failed to generate token")
	ErrTenantNotFound     = errors.New("tenant not found")
)