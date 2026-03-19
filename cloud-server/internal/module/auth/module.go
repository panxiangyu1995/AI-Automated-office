package module

import (
	"database/sql"
	"time"

	"cloud-server/internal/module/auth/application/service"
	domainService "cloud-server/internal/module/auth/domain/service"
	"cloud-server/internal/module/auth/domain/repository"
	"cloud-server/internal/module/auth/infrastructure/crypto"
	"cloud-server/internal/module/auth/infrastructure/persistence"

	"go.uber.org/zap"
)

// Config 认证模块配置
type Config struct {
	// JWT 配置
	JWTSecret          string
	JWTIssuer          string
	JWTAudience        string
	AccessTokenExpSec  int64
	RefreshTokenExpSec int64

	// 密码配置
	BcryptCost int

	// 登录安全配置
	MaxLoginAttempts      int
	LockoutDuration       int64 // 秒
	AttemptWindowMinutes  int   // 尝试窗口（分钟）
}

// AuthModule 认证模块
type AuthModule struct {
	Config       *Config
	AuthService  *service.AuthService
	UserRepo     repository.UserRepository
	SessionRepo  repository.SessionRepository
	PasswordHash crypto.PasswordPolicy
	TokenManager crypto.TokenManager
}

// NewAuthModule 创建认证模块
func NewAuthModule(db *sql.DB, cfg *Config, logger *zap.Logger) *AuthModule {
	// 创建仓储
	userRepo := persistence.NewUserRepository(db)
	sessionRepo := persistence.NewSessionRepository(db)
	loginAttemptRepo := persistence.NewLoginAttemptRepository(db)

	// 创建密码哈希器
	bcryptHasher := crypto.NewBcryptHasher(cfg.BcryptCost, crypto.PasswordStrengthRequirements{
		MinLength:      8,
		RequireUpper:   true,
		RequireLower:   true,
		RequireDigit:   true,
		RequireSpecial: false,
	})

	// 创建 Token 管理器
	jwtManager := crypto.NewJWTManager(crypto.JWTConfig{
		Secret:          cfg.JWTSecret,
		Issuer:          cfg.JWTIssuer,
		Audience:        cfg.JWTAudience,
		AccessTokenExp:  time.Duration(cfg.AccessTokenExpSec) * time.Second,
		RefreshTokenExp: time.Duration(cfg.RefreshTokenExpSec) * time.Second,
	})

	// 创建锁定策略配置
	attemptWindowMinutes := cfg.AttemptWindowMinutes
	if attemptWindowMinutes <= 0 {
		attemptWindowMinutes = 15
	}

	lockPolicyConfig := domainService.LockPolicyConfig{
		MaxFailedAttempts:    cfg.MaxLoginAttempts,
		LockoutDuration:      time.Duration(cfg.LockoutDuration) * time.Second,
		AttemptWindowMinutes: attemptWindowMinutes,
	}

	// 创建锁定策略服务
	lockPolicySvc := domainService.NewLockPolicyService(userRepo, loginAttemptRepo, db, lockPolicyConfig)

	// 创建权限服务
	permissionSvc := domainService.NewPermissionService(db)

	// 创建认证配置
	authConfig := service.AuthConfig{
		AccessTokenExpire:  time.Duration(cfg.AccessTokenExpSec) * time.Second,
		RefreshTokenExpire: time.Duration(cfg.RefreshTokenExpSec) * time.Second,
		MaxLoginAttempts:   cfg.MaxLoginAttempts,
		LockoutDuration:    time.Duration(cfg.LockoutDuration) * time.Second,
		PasswordMinLength:  8,
	}

	// 创建认证服务
	authService := service.NewAuthService(
		userRepo,
		sessionRepo,
		loginAttemptRepo,
		lockPolicySvc,
		permissionSvc,
		bcryptHasher,
		jwtManager,
		db,
		logger,
		authConfig,
	)

	return &AuthModule{
		Config:       cfg,
		AuthService:  authService,
		UserRepo:     userRepo,
		SessionRepo:  sessionRepo,
		PasswordHash: bcryptHasher,
		TokenManager: jwtManager,
	}
}
