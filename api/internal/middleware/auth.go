package middleware

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

const (
	ContextKeyUserID = "user_id"
	ContextKeyRole   = "role"
	ContextKeyEmail  = "email"

	mfaVerifiedKeyPrefix = "mfa:verified:"
	mfaVerifiedTTL       = 5 * time.Minute
)

var mfaCache *redis.Cache

func SetMFACache(cache *redis.Cache) {
	mfaCache = cache
}

func MarkMFAVerified(ctx context.Context, userID string) error {
	if mfaCache == nil {
		return fmt.Errorf("MFA cache not initialized")
	}
	return mfaCache.Set(ctx, mfaVerifiedKeyPrefix+userID, "1", mfaVerifiedTTL)
}

func IsMFAVerified(ctx context.Context, userID string) (bool, error) {
	if mfaCache == nil {
		return false, fmt.Errorf("MFA cache not initialized")
	}
	return mfaCache.Exists(ctx, mfaVerifiedKeyPrefix+userID)
}

func ClearMFAVerified(ctx context.Context, userID string) error {
	if mfaCache == nil {
		return fmt.Errorf("MFA cache not initialized")
	}
	return mfaCache.Delete(ctx, mfaVerifiedKeyPrefix+userID)
}

func GetUserID(c *gin.Context) string {
	id, ok := c.Get(ContextKeyUserID)
	if !ok || id == nil {
		return ""
	}
	s, ok := id.(string)
	if !ok {
		return ""
	}
	return s
}

func GetRole(c *gin.Context) string {
	r, ok := c.Get(ContextKeyRole)
	if !ok || r == nil {
		return ""
	}
	s, ok := r.(string)
	if !ok {
		return ""
	}
	return s
}

func AuthRequired(jwtManager *auth.JWTManager, tokenBlacklist *redis.TokenBlacklist) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, errors.ErrUnauthorized.WithDetail("缺少 Authorization 请求头"))
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(c, errors.ErrUnauthorized.WithDetail("Authorization 格式应为 Bearer <token>"))
			c.Abort()
			return
		}

		claims, err := jwtManager.ValidateToken(parts[1])
		if err != nil {
			response.Error(c, errors.ErrTokenInvalid.WithDetail(err.Error()))
			c.Abort()
			return
		}

		if tokenBlacklist != nil && claims.ID != "" {
			blacklisted, err := tokenBlacklist.IsBlacklisted(context.Background(), claims.ID)
			if err != nil {
				response.Error(c, errors.ErrInternal.WithDetail("token 验证服务不可用，请稍后重试"))
				c.Abort()
				return
			}
			if blacklisted {
				response.Error(c, errors.ErrTokenInvalid.WithDetail("token has been revoked"))
				c.Abort()
				return
			}
		}

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, claims.Role)
		c.Set(ContextKeyEmail, claims.Email)
		c.Set(ContextKeyEnterpriseIDFromToken, claims.EnterpriseID)

		mfaRequired := checkMFARequired(claims.UserID)
		if mfaRequired {
			verified, err := IsMFAVerified(c.Request.Context(), claims.UserID)
			if err != nil {
				response.Error(c, errors.ErrInternal.WithDetail("MFA验证服务不可用，请稍后重试"))
				c.Abort()
				return
			}
			if !verified {
				response.Error(c, &errors.AppError{
					Code:           "AUTH_MFA_REQUIRED",
					Message:        "需要MFA验证",
					Status:         403,
					Level:          errors.LevelUserAction,
					Recoverable:    true,
					RecoveryAction: "verify_mfa",
					RecoveryActionInfo: &errors.RecoveryActionInfo{
						Type:        "verify_mfa",
						API:         "POST /api/v1/mfa/verify",
						Description: "请先完成MFA验证",
					},
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

func checkMFARequired(userID string) bool {
	if tenantDB := getGlobalDB(); tenantDB != nil {
		var config model.MFAConfig
		err := tenantDB.Where("user_id = ? AND verified = ?", userID, true).First(&config).Error
		return err == nil
	}
	return false
}

func getGlobalDB() *gorm.DB {
	if GlobalAuthDB != nil {
		return GlobalAuthDB
	}
	return nil
}

var GlobalAuthDB *gorm.DB
