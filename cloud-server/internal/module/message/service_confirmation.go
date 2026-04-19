package message

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

// ConfirmationCode 确认码
type ConfirmationCode struct {
	Code      string
	MessageID string
	UserID    string
	CreatedAt time.Time
	ExpiresAt time.Time
	Confirmed bool
}

// SensitiveKeyword 敏感关键词
var sensitiveKeywords = []string{
	"密码", "密钥", "token", "secret",
	"工资", "薪酬", "银行卡", "身份证",
	"转账", "汇款", "支付宝", "微信支付",
	"删除账户", "注销", "解绑",
}

// IsSensitive 检查消息是否敏感
func IsSensitive(content string) bool {
	for _, kw := range sensitiveKeywords {
		if containsKeyword(content, kw) {
			return true
		}
	}
	return false
}

func containsKeyword(content, keyword string) bool {
	return len(content) > 0 && len(keyword) > 0 &&
		len(content) >= len(keyword) &&
		containsLower(content, toLower(keyword))
}

func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		result[i] = c
	}
	return string(result)
}

func containsLower(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// ConfirmationStore 确认码存储
type ConfirmationStore struct {
	codes map[string]*ConfirmationCode
	mu    sync.RWMutex
}

func NewConfirmationStore() *ConfirmationStore {
	return &ConfirmationStore{codes: make(map[string]*ConfirmationCode)}
}

func (s *ConfirmationStore) generateCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// Create 创建确认码
func (s *ConfirmationStore) Create(ctx context.Context, messageID, userID string) (*ConfirmationCode, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	code := s.generateCode()
	now := time.Now()
	conf := &ConfirmationCode{
		Code:      code,
		MessageID: messageID,
		UserID:    userID,
		CreatedAt: now,
		ExpiresAt: now.Add(5 * time.Minute),
		Confirmed: false,
	}
	s.codes[code] = conf
	return conf, nil
}

// Confirm 确认
func (s *ConfirmationStore) Confirm(ctx context.Context, code string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	conf, ok := s.codes[code]
	if !ok || conf.Confirmed || time.Now().After(conf.ExpiresAt) {
		return false
	}
	conf.Confirmed = true
	return true
}

// Validate 验证
func (s *ConfirmationStore) Validate(ctx context.Context, code string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	conf, ok := s.codes[code]
	if !ok || conf.Confirmed || time.Now().After(conf.ExpiresAt) {
		return false
	}
	return true
}

// GlobalConfirmationStore 全局确认码存储
var GlobalConfirmationStore = NewConfirmationStore()
