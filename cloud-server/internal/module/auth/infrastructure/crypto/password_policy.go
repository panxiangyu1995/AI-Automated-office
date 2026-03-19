package crypto

import "errors"

// PasswordPolicy 密码策略接口
type PasswordPolicy interface {
	// Hash 对密码进行哈希
	Hash(password string) (string, error)

	// Verify 验证密码
	Verify(hashedPassword, password string) bool

	// ValidateStrength 验证密码强度
	ValidateStrength(password string) error
}

// 密码相关错误
var (
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters")
	ErrPasswordNoUpper    = errors.New("password must contain at least one uppercase letter")
	ErrPasswordNoLower    = errors.New("password must contain at least one lowercase letter")
	ErrPasswordNoDigit    = errors.New("password must contain at least one digit")
	ErrPasswordTooWeak    = errors.New("password is too weak")
)

// PasswordStrengthRequirements 密码强度要求
type PasswordStrengthRequirements struct {
	MinLength   int  // 最小长度
	RequireUpper bool // 需要大写字母
	RequireLower bool // 需要小写字母
	RequireDigit bool // 需要数字
	RequireSpecial bool // 需要特殊字符
}
