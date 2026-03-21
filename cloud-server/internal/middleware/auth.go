package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
	"time"

	"cloud-server/internal/config"
	"cloud-server/internal/model"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// TokenClaims Token 解析后的声明
type TokenClaims struct {
	UserID    string
	SessionID string
	IssuedAt  int64
	ExpiresAt int64
	Issuer    string
}

// AuthMiddleware 认证中间件
func AuthMiddleware(db *sql.DB, jwtConfig config.JWTConfig, log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Authorization 头获取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.AuthError(c, response.ErrAuthRequired, "缺少认证信息")
			c.Abort()
			return
		}

		// 解析 Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.AuthError(c, response.ErrInvalidAuthFormat, "认证格式错误")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 验证 token
		claims, err := validateToken(tokenString, jwtConfig)
		if err != nil {
			if log != nil {
				log.Debug("token validation failed", zap.Error(err))
			}
			response.AuthError(c, response.ErrTokenInvalid, "令牌无效或已过期")
			c.Abort()
			return
		}

		// 检查 token 是否过期
		if time.Now().Unix() > claims.ExpiresAt {
			response.AuthError(c, response.ErrTokenExpired, "令牌已过期")
			c.Abort()
			return
		}

		// 检查会话是否被撤销
		revoked, err := isTokenRevoked(c.Request.Context(), db, claims.SessionID)
		if err != nil && log != nil {
			log.Warn("failed to check token revoked status", zap.Error(err))
		}
		if revoked {
			response.AuthError(c, response.ErrTokenRevoked, "令牌已被撤销")
			c.Abort()
			return
		}

		// 获取租户ID（从上下文或 token）
		tenantID := c.GetString("tenant_id")
		if tenantID == "" {
			// 尝试从用户信息获取
			tenantID = getUserTenantID(c.Request.Context(), db, claims.UserID)
		}

		// 加载用户信息
		user, err := getUserByID(c.Request.Context(), db, claims.UserID, tenantID)
		if err != nil {
			if err == sql.ErrNoRows {
				response.AuthError(c, response.ErrUserNotFound, "用户不存在")
				c.Abort()
				return
			}
			if log != nil {
				log.Error("failed to get user", zap.Error(err), zap.String("userID", claims.UserID))
			}
			response.Error(c, 500, "ERR_DB", "数据库错误", nil)
			c.Abort()
			return
		}

		// 检查用户状态
		if user.Status != "active" {
			response.Forbidden(c, response.ForbiddenResponse{
				Code:    response.ErrUserInactive,
				Message: "用户已被禁用",
			})
			c.Abort()
			return
		}

		// 设置用户上下文
		c.Set("user_id", claims.UserID)
		c.Set("user", user)
		c.Set("session_id", claims.SessionID)
		if tenantID != "" {
			c.Set("tenant_id", tenantID)
		}

		c.Next()
	}
}

// validateToken 验证 token 并返回声明
func validateToken(tokenString string, jwtConfig config.JWTConfig) (*TokenClaims, error) {
	// 解码 token
	decoded, err := base64.RawURLEncoding.DecodeString(tokenString)
	if err != nil {
		return nil, fmt.Errorf("failed to decode token: %w", err)
	}

	parts := strings.Split(string(decoded), "|")
	if len(parts) < 4 {
		return nil, fmt.Errorf("invalid token format")
	}

	userID := parts[0]
	issuer := parts[1]
	issuedAtStr := parts[2]
	expiresAtStr := parts[3]
	signature := ""
	if len(parts) > 4 {
		signature = parts[4]
	}

	// 验证签名
	expectedPayload := strings.Join(parts[:4], "|")
	mac := hmac.New(sha256.New, []byte(jwtConfig.Secret))
	_, _ = mac.Write([]byte(expectedPayload))
	expectedSignature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	if signature != expectedSignature {
		return nil, fmt.Errorf("invalid signature")
	}

	// 解析时间
	issuedAt, err := strconv.ParseInt(issuedAtStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid issued at: %w", err)
	}

	expiresAt, err := strconv.ParseInt(expiresAtStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid expires at: %w", err)
	}

	// 生成 session ID（使用 token hash 的前 8 位）
	sessionID := fmt.Sprintf("%x", sha256.Sum256([]byte(tokenString)))[:16]

	return &TokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		IssuedAt:  issuedAt,
		ExpiresAt: expiresAt,
		Issuer:    issuer,
	}, nil
}

// isTokenRevoked 检查 token 是否被撤销
func isTokenRevoked(ctx context.Context, db *sql.DB, sessionID string) (bool, error) {
	// 检查 sessions 表中是否有被删除的记录
	query := `
		SELECT COUNT(*) FROM sessions
		WHERE id = $1 AND deleted_at IS NOT NULL
	`
	var count int
	err := db.QueryRowContext(ctx, query, sessionID).Scan(&count)
	if err != nil {
		// 如果查询失败，假设 token 有效（宽松处理）
		return false, err
	}
	return count > 0, nil
}

// getUserByID 从数据库获取用户信息
func getUserByID(ctx context.Context, db *sql.DB, userID, tenantID string) (*model.User, error) {
	query := `
		SELECT id, tenant_id, email, name, avatar_url, employee_id, phone, manager_id, status, 
		       email_verified, last_login_at, failed_login_count, locked_until, preferences, created_at, updated_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	user := &model.User{}
	var lastLoginAt, lockedUntil sql.NullTime
	var managerID sql.NullString
	var phone, employeeID, avatarURL sql.NullString

	err := db.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.TenantID,
		&user.Email,
		&user.Name,
		&avatarURL,
		&employeeID,
		&phone,
		&managerID,
		&user.Status,
		&user.EmailVerified,
		&lastLoginAt,
		&user.FailedLoginCount,
		&lockedUntil,
		&user.Preferences,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if avatarURL.Valid {
		user.AvatarURL = avatarURL.String
	}
	if employeeID.Valid {
		user.EmployeeID = employeeID.String
	}
	if phone.Valid {
		user.Phone = phone.String
	}
	if managerID.Valid {
		user.ManagerID = &managerID.String
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	if lockedUntil.Valid {
		user.LockedUntil = &lockedUntil.Time
	}

	return user, nil
}

// getUserTenantID 从用户信息获取租户ID
func getUserTenantID(ctx context.Context, db *sql.DB, userID string) string {
	var tenantID string
	err := db.QueryRowContext(ctx, 
		"SELECT tenant_id FROM users WHERE id = $1", 
		userID,
	).Scan(&tenantID)
	if err != nil {
		return ""
	}
	return tenantID
}
