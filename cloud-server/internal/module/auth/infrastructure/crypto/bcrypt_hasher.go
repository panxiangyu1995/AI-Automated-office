package crypto

import (
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const (
	// DefaultCost 默认 bcrypt cost
	DefaultCost = 12
)

// BcryptHasher Bcrypt 密码哈希实现
type BcryptHasher struct {
	cost        int
	requirements PasswordStrengthRequirements
}

// NewBcryptHasher 创建 Bcrypt 哈希器
func NewBcryptHasher(cost int, requirements PasswordStrengthRequirements) *BcryptHasher {
	if cost <= 0 {
		cost = DefaultCost
	}
	return &BcryptHasher{
		cost:        cost,
		requirements: requirements,
	}
}

// NewDefaultBcryptHasher 创建默认 Bcrypt 哈希器
func NewDefaultBcryptHasher() *BcryptHasher {
	return NewBcryptHasher(DefaultCost, PasswordStrengthRequirements{
		MinLength:     8,
		RequireUpper:  true,
		RequireLower:  true,
		RequireDigit:  true,
		RequireSpecial: false,
	})
}

// Hash 对密码进行哈希
func (h *BcryptHasher) Hash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), h.cost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// Verify 验证密码
func (h *BcryptHasher) Verify(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

// ValidateStrength 验证密码强度
func (h *BcryptHasher) ValidateStrength(password string) error {
	req := h.requirements

	if len(password) < req.MinLength {
		return ErrPasswordTooShort
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if req.RequireUpper && !hasUpper {
		return ErrPasswordNoUpper
	}
	if req.RequireLower && !hasLower {
		return ErrPasswordNoLower
	}
	if req.RequireDigit && !hasDigit {
		return ErrPasswordNoDigit
	}
	if req.RequireSpecial && !hasSpecial {
		return ErrPasswordTooWeak
	}

	return nil
}
