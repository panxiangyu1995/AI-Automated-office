package crypto

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenClaims Token 声明
type TokenClaims struct {
	UserID      string   `json:"user_id"`
	TenantID    string   `json:"tenant_id"`
	Roles       []string `json:"roles,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
	jwt.RegisteredClaims
}

// TokenPair Token 对
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"` // 秒
}

// TokenManager Token 管理接口
type TokenManager interface {
	// GenerateAccessToken 生成访问令牌
	GenerateAccessToken(userID, tenantID string, roles, permissions []string) (string, error)

	// GenerateRefreshToken 生成刷新令牌
	GenerateRefreshToken(userID, tenantID string) (string, error)

	// GenerateTokenPair 生成 Token 对
	GenerateTokenPair(userID, tenantID string, roles, permissions []string) (*TokenPair, error)

	// ValidateToken 验证 Token
	ValidateToken(token string) (*TokenClaims, error)

	// RefreshToken 刷新 Token
	RefreshToken(refreshToken string) (*TokenPair, error)
}

// Token 相关错误
var (
	ErrTokenExpired     = errors.New("token has expired")
	ErrTokenInvalid     = errors.New("token is invalid")
	ErrTokenMalformed   = errors.New("token is malformed")
	ErrTokenNotValidYet = errors.New("token is not valid yet")
)

// JWTConfig JWT 配置
type JWTConfig struct {
	Secret          string        // 签名密钥
	Issuer          string        // 签发者
	Audience        string        // 受众
	AccessTokenExp  time.Duration // Access Token 过期时间
	RefreshTokenExp time.Duration // Refresh Token 过期时间
}
