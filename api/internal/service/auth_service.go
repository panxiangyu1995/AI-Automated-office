package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
)

type AuthService struct {
	userRepo             repository.UserRepository
	enterpriseRepo       repository.EnterpriseRepository
	crossEnterpriseRepo  repository.CrossEnterpriseRepository
	jwtManager           *auth.JWTManager
	tokenBlacklist       *redis.TokenBlacklist
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func NewAuthService(userRepo repository.UserRepository, jwtManager *auth.JWTManager) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

func NewAuthServiceWithEnterprise(userRepo repository.UserRepository, enterpriseRepo repository.EnterpriseRepository, jwtManager *auth.JWTManager) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		enterpriseRepo: enterpriseRepo,
		jwtManager:     jwtManager,
	}
}

func NewAuthServiceFull(userRepo repository.UserRepository, enterpriseRepo repository.EnterpriseRepository, crossEnterpriseRepo repository.CrossEnterpriseRepository, jwtManager *auth.JWTManager, tokenBlacklist *redis.TokenBlacklist) *AuthService {
	return &AuthService{
		userRepo:            userRepo,
		enterpriseRepo:      enterpriseRepo,
		crossEnterpriseRepo: crossEnterpriseRepo,
		jwtManager:          jwtManager,
		tokenBlacklist:      tokenBlacklist,
	}
}

func (s *AuthService) Login(req LoginRequest) (*TokenResponse, *apperrors.AppError) {
	if req.Email == "" {
		return nil, apperrors.NewValidationError("email", "邮箱不能为空")
	}
	if req.Password == "" {
		return nil, apperrors.NewValidationError("password", "密码不能为空")
	}

	user, err := s.userRepo.FindByEmail(req.Email, "")
	if err != nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("邮箱或密码错误")
	}
	if user == nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("邮箱或密码错误")
	}

	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		return nil, apperrors.ErrUnauthorized.WithDetail("邮箱或密码错误")
	}

	if user.Status != "active" {
		return nil, apperrors.ErrForbidden.WithDetail("账号已被禁用")
	}

	enterpriseID, _ := uuid.Parse(user.EnterpriseID)

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, enterpriseID, user.Role, user.Email)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成令牌失败")
	}

	refreshToken, _, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成刷新令牌失败")
	}

	s.userRepo.UpdateLastLogin(user.ID)

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtManager.AccessTTL().Seconds()),
		UserID:       user.ID.String(),
		Role:         user.Role,
	}, nil
}

func (s *AuthService) Refresh(req RefreshRequest) (*TokenResponse, *apperrors.AppError) {
	if req.RefreshToken == "" {
		return nil, apperrors.NewValidationError("refresh_token", "刷新令牌不能为空")
	}

	claims, err := s.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, apperrors.ErrTokenExpired.WithDetail("刷新令牌无效或已过期")
	}

	if s.tokenBlacklist != nil && claims.ID != "" {
		blacklisted, blErr := s.tokenBlacklist.IsBlacklisted(context.Background(), claims.ID)
		if blErr == nil && blacklisted {
			return nil, apperrors.ErrTokenInvalid.WithDetail("刷新令牌已被撤销")
		}
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, apperrors.ErrTokenInvalid.WithDetail("令牌中的用户ID无效")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("用户不存在")
	}
	if user == nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("用户不存在")
	}
	if user.Status != "active" {
		return nil, apperrors.ErrForbidden.WithDetail("账号已被禁用")
	}

	if s.tokenBlacklist != nil && claims.ID != "" {
		remaining := time.Until(claims.ExpiresAt.Time)
		if remaining < 0 {
			remaining = 0
		}
		s.tokenBlacklist.Add(context.Background(), claims.ID, remaining)
	}

	enterpriseID, _ := uuid.Parse(user.EnterpriseID)

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, enterpriseID, user.Role, user.Email)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成令牌失败")
	}

	refreshToken, _, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成刷新令牌失败")
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtManager.AccessTTL().Seconds()),
		UserID:       user.ID.String(),
		Role:         user.Role,
	}, nil
}

func (s *AuthService) CanAccessEnterprise(userID uuid.UUID, currentEnterpriseID, targetEnterpriseID uuid.UUID) (bool, *apperrors.AppError) {
	if s.enterpriseRepo == nil {
		return false, apperrors.ErrInternal.WithDetail("企业仓库未初始化")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return false, apperrors.ErrInternal.WithDetail("查询用户失败")
	}
	if user == nil {
		return false, apperrors.ErrUnauthorized.WithDetail("用户不存在")
	}

	if user.Role == "operator" {
		return true, nil
	}

	if user.Role == "owner" {
		currentEnt, err := s.enterpriseRepo.FindByID(currentEnterpriseID)
		if err != nil {
			return false, apperrors.ErrInternal.WithDetail("查询当前企业失败")
		}
		if currentEnt == nil {
			return false, apperrors.ErrNotFound.WithDetail("当前企业不存在")
		}

		targetEnt, err := s.enterpriseRepo.FindByID(targetEnterpriseID)
		if err != nil {
			return false, apperrors.ErrInternal.WithDetail("查询目标企业失败")
		}
		if targetEnt == nil {
			return false, apperrors.ErrNotFound.WithDetail("目标企业不存在")
		}

		if currentEnt.GroupID != targetEnt.GroupID {
			return false, apperrors.ErrPermissionDenied.WithDetail("无权访问该企业的数据")
		}
		return true, nil
	}

	if s.crossEnterpriseRepo != nil {
		perm, err := s.crossEnterpriseRepo.FindByUserAndTarget(userID, targetEnterpriseID)
		if err != nil {
			return false, apperrors.ErrInternal.WithDetail("查询跨企业权限失败")
		}
		if perm != nil {
			return true, nil
		}
	}

	return false, apperrors.ErrPermissionDenied.WithDetail("无权切换至目标企业")
}

func (s *AuthService) SwitchEnterprise(userID, currentEnterpriseID, targetEnterpriseID uuid.UUID) (*TokenResponse, *apperrors.AppError) {
	allowed, appErr := s.CanAccessEnterprise(userID, currentEnterpriseID, targetEnterpriseID)
	if appErr != nil {
		return nil, appErr
	}
	if !allowed {
		return nil, apperrors.ErrPermissionDenied.WithDetail("无权切换至目标企业")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询用户失败")
	}
	if user == nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("用户不存在")
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, targetEnterpriseID, user.Role, user.Email)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成令牌失败")
	}

	refreshToken, _, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成刷新令牌失败")
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtManager.AccessTTL().Seconds()),
		UserID:       user.ID.String(),
		Role:         user.Role,
	}, nil
}

func (s *AuthService) ValidateToken(tokenStr string) (*auth.Claims, *apperrors.AppError) {
	claims, err := s.jwtManager.ValidateToken(tokenStr)
	if err != nil {
		return nil, apperrors.ErrTokenInvalid.WithDetail(err.Error())
	}
	return claims, nil
}

func (s *AuthService) Register(email, password, name, enterpriseID string) (*model.User, *apperrors.AppError) {
	if email == "" {
		return nil, apperrors.NewValidationError("email", "邮箱不能为空")
	}
	if password == "" {
		return nil, apperrors.NewValidationError("password", "密码不能为空")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "姓名不能为空")
	}

	if len(password) < 6 {
		return nil, apperrors.NewValidationError("password", "密码长度不能少于6位")
	}

	existing, _ := s.userRepo.FindByEmail(email, enterpriseID)
	if existing != nil {
		return nil, apperrors.ErrDuplicateEntry.WithDetail("该邮箱已被注册")
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("密码加密失败")
	}

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	user := &model.User{
		Email:        email,
		PasswordHash: passwordHash,
		Name:         name,
		Role:         "employee",
		Status:       "active",
		EnterpriseID: eid.String(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, apperrors.ErrInternal.WithDetail(fmt.Sprintf("创建用户失败: %v", err))
	}

	return user, nil
}

func (s *AuthService) GetUser(userID uuid.UUID) (*model.User, *apperrors.AppError) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("用户不存在")
	}
	if user == nil {
		return nil, apperrors.ErrNotFound.WithDetail("用户不存在")
	}
	return user, nil
}
