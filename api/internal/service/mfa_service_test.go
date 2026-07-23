package service

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"

	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type mockMFARepo struct {
	configs map[string]*model.MFAConfig
}

func newMockMFARepo() *mockMFARepo {
	return &mockMFARepo{configs: make(map[string]*model.MFAConfig)}
}

func (m *mockMFARepo) FindByUserID(userID string, enterpriseID uuid.UUID) (*model.MFAConfig, error) {
	c, ok := m.configs[userID]
	if !ok {
		return nil, nil
	}
	return c, nil
}

func (m *mockMFARepo) FindByUserIDAndVerified(userID string, enterpriseID uuid.UUID, verified bool) (*model.MFAConfig, error) {
	c, ok := m.configs[userID]
	if !ok {
		return nil, nil
	}
	if c.Verified != verified {
		return nil, nil
	}
	return c, nil
}

func (m *mockMFARepo) Create(config *model.MFAConfig) error {
	if config.ID == uuid.Nil {
		config.ID = uuid.New()
	}
	m.configs[config.UserID] = config
	return nil
}

func (m *mockMFARepo) Save(config *model.MFAConfig) error {
	m.configs[config.UserID] = config
	return nil
}

func (m *mockMFARepo) UpdateVerified(id, enterpriseID uuid.UUID, verified bool) error {
	for _, c := range m.configs {
		if c.ID == id {
			c.Verified = verified
			return nil
		}
	}
	return nil
}

func (m *mockMFARepo) UpdateBackupCodes(id, enterpriseID uuid.UUID, backupCodes string) error {
	for _, c := range m.configs {
		if c.ID == id {
			c.BackupCodes = backupCodes
			return nil
		}
	}
	return nil
}

func (m *mockMFARepo) DeleteByUserID(userID string, enterpriseID uuid.UUID) (int64, error) {
	_, ok := m.configs[userID]
	if !ok {
		return 0, nil
	}
	delete(m.configs, userID)
	return 1, nil
}

var _ repository.MFARepository = (*mockMFARepo)(nil)

func setupMFAService() (*MFAService, *mockMFARepo, *mockUserRepo) {
	mfaRepo := newMockMFARepo()
	userRepo := newMockUserRepo()
	svc := NewMFAService(mfaRepo, userRepo)
	return svc, mfaRepo, userRepo
}

func TestMFAService_EnableMFA_NewConfig(t *testing.T) {
	svc, _, userRepo := setupMFAService()
	eid := uuid.New().String()
	userID := uuid.New()
	userRepo.Create(&model.User{
		EnterpriseID: eid,
		Email:        "mfa@test.com",
		PasswordHash: "hash",
		Name:         "MFA User",
		Role:         "employee",
		Status:       "active",
	})
	// Set ID after create to match what tests expect
	for _, u := range userRepo.users {
		if u.Email == "mfa@test.com" {
			u.ID = userID
		}
	}

	result, err := svc.EnableMFA(userID.String(), "totp")
	assert.Nil(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.Secret)
	assert.Contains(t, result.QRURL, "otpauth://totp/")
	assert.Len(t, result.BackupCodes, 10)
}

func TestMFAService_EnableMFA_InvalidUserID(t *testing.T) {
	svc, _, _ := setupMFAService()

	_, err := svc.EnableMFA("not-a-uuid", "totp")
	assert.Error(t, err)
	assert.Equal(t, "VAL_INVALID_PARAMS", err.Code)
}

func TestMFAService_EnableMFA_UserNotFound(t *testing.T) {
	svc, _, _ := setupMFAService()

	_, err := svc.EnableMFA(uuid.New().String(), "totp")
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestMFAService_EnableMFA_UpdateExisting(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	eid := uuid.New()
	userID := uuid.New()

	existing := &model.MFAConfig{
		UserID:   userID.String(),
		Method:   "totp",
		Secret:   "OLDSECRET",
		Verified: true,
	}
	existing.EnterpriseID = eid
	existing.ID = uuid.New()
	mfaRepo.configs[userID.String()] = existing

	userRepo.Create(&model.User{
		EnterpriseID: eid.String(),
		Email:        "existing@test.com",
		PasswordHash: "hash",
		Name:         "Existing",
		Role:         "employee",
		Status:       "active",
	})
	for _, u := range userRepo.users {
		if u.Email == "existing@test.com" {
			u.ID = userID
		}
	}

	result, err := svc.EnableMFA(userID.String(), "totp")
	assert.Nil(t, err)
	assert.NotNil(t, result)
	assert.NotEqual(t, "OLDSECRET", result.Secret)
	assert.False(t, mfaRepo.configs[userID.String()].Verified)
}

func TestMFAService_VerifyMFA_EmptyCode(t *testing.T) {
	svc, _, _ := setupMFAService()

	_, err := svc.VerifyMFA(uuid.New().String(), "")
	assert.Error(t, err)
	assert.Equal(t, "VAL_INVALID_PARAMS", err.Code)
}

func TestMFAService_VerifyMFA_NotEnabled(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	userID := uuid.New()
	eid := uuid.New()

	userRepo.Create(&model.User{EnterpriseID: eid.String(), Email: "verify@test.com", Name: "V", Role: "employee", Status: "active"})
	for _, u := range userRepo.users {
		if u.Email == "verify@test.com" {
			u.ID = userID
		}
	}
	_ = mfaRepo

	_, err := svc.VerifyMFA(userID.String(), "123456")
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestMFAService_DisableMFA_Success(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	userID := uuid.New()
	eid := uuid.New()

	mfaRepo.configs[userID.String()] = &model.MFAConfig{
		UserID:   userID.String(),
		Method:   "totp",
		Secret:   "SECRET",
		Verified: true,
	}
	mfaRepo.configs[userID.String()].EnterpriseID = eid
	mfaRepo.configs[userID.String()].ID = uuid.New()

	userRepo.Create(&model.User{EnterpriseID: eid.String(), Email: "disable@test.com", Name: "D", Role: "employee", Status: "active"})
	for _, u := range userRepo.users {
		if u.Email == "disable@test.com" {
			u.ID = userID
		}
	}

	err := svc.DisableMFA(userID.String())
	assert.Nil(t, err)
	_, exists := mfaRepo.configs[userID.String()]
	assert.False(t, exists)
}

func TestMFAService_DisableMFA_NotEnabled(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	userID := uuid.New()
	eid := uuid.New()

	userRepo.Create(&model.User{EnterpriseID: eid.String(), Email: "disable2@test.com", Name: "D2", Role: "employee", Status: "active"})
	for _, u := range userRepo.users {
		if u.Email == "disable2@test.com" {
			u.ID = userID
		}
	}
	_ = mfaRepo

	err := svc.DisableMFA(userID.String())
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestMFAService_IsMFAEnabled(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	userID := uuid.New()
	eid := uuid.New()

	userRepo.Create(&model.User{EnterpriseID: eid.String(), Email: "isen@test.com", Name: "I", Role: "employee", Status: "active"})
	for _, u := range userRepo.users {
		if u.Email == "isen@test.com" {
			u.ID = userID
		}
	}

	enabled, err := svc.IsMFAEnabled(userID.String())
	assert.Nil(t, err)
	assert.False(t, enabled)

	mfaRepo.configs[userID.String()] = &model.MFAConfig{
		UserID:   userID.String(),
		Method:   "totp",
		Secret:   "SECRET",
		Verified: true,
	}
	mfaRepo.configs[userID.String()].EnterpriseID = eid
	mfaRepo.configs[userID.String()].ID = uuid.New()

	enabled, err = svc.IsMFAEnabled(userID.String())
	assert.Nil(t, err)
	assert.True(t, enabled)
}

func TestMFAService_GetMFAStatus(t *testing.T) {
	svc, mfaRepo, userRepo := setupMFAService()
	userID := uuid.New()
	eid := uuid.New()

	userRepo.Create(&model.User{EnterpriseID: eid.String(), Email: "status@test.com", Name: "S", Role: "employee", Status: "active"})
	for _, u := range userRepo.users {
		if u.Email == "status@test.com" {
			u.ID = userID
		}
	}

	status, err := svc.GetMFAStatus(userID.String())
	assert.Nil(t, err)
	assert.False(t, status["enabled"].(bool))

	mfaRepo.configs[userID.String()] = &model.MFAConfig{
		UserID:   userID.String(),
		Method:   "totp",
		Secret:   "SECRET",
		Verified: true,
	}
	mfaRepo.configs[userID.String()].EnterpriseID = eid
	mfaRepo.configs[userID.String()].ID = uuid.New()

	status, err = svc.GetMFAStatus(userID.String())
	assert.Nil(t, err)
	assert.True(t, status["enabled"].(bool))
	assert.Equal(t, "totp", status["method"])
	assert.True(t, status["verified"].(bool))
}

func TestGenerateTOTPSecret(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret failed: %v", err)
	}
	if len(secret) != 32 {
		t.Errorf("secret length = %d, want 32", len(secret))
	}
	encoder := base32.NewEncoding("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567").WithPadding(base32.NoPadding)
	_, err = encoder.DecodeString(secret)
	if err != nil {
		t.Errorf("secret is not valid base32: %v", err)
	}
}

func TestComputeTOTP(t *testing.T) {
	secret, _ := generateTOTPSecret()
	now := time.Now().Unix()
	code := computeTOTP(secret, now)
	if len(code) != 6 {
		t.Errorf("TOTP code length = %d, want 6", len(code))
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			t.Errorf("TOTP code contains non-digit: %c", c)
			break
		}
	}
}

func TestValidateTOTP(t *testing.T) {
	secret, _ := generateTOTPSecret()
	now := time.Now().Unix()
	counter := now / 30
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(counter))

	key, _ := base32.NewEncoding("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567").WithPadding(base32.NoPadding).DecodeString(secret)
	mac := hmac.New(sha1.New, key)
	mac.Write(buf)
	hash := mac.Sum(nil)
	offset := hash[len(hash)-1] & 0x0f
	truncated := binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff
	expectedCode := fmt.Sprintf("%06d", truncated%1000000)

	if !validateTOTP(secret, expectedCode) {
		t.Errorf("validateTOTP should accept current code")
	}
}

func TestValidateTOTPInvalidCode(t *testing.T) {
	secret, _ := generateTOTPSecret()
	if validateTOTP(secret, "000000") {
		t.Log("validateTOTP accepted 000000 (unlikely but possible)")
	}
}

func TestGenerateBackupCodes(t *testing.T) {
	codes, err := generateBackupCodes(10)
	if err != nil {
		t.Fatalf("generateBackupCodes failed: %v", err)
	}
	if len(codes) != 10 {
		t.Errorf("got %d codes, want 10", len(codes))
	}
	seen := make(map[string]bool)
	for _, code := range codes {
		if len(code) != 8 {
			t.Errorf("backup code length = %d, want 8", len(code))
		}
		if seen[code] {
			t.Errorf("duplicate backup code: %s", code)
		}
		seen[code] = true
	}
}

func TestBuildQRURL(t *testing.T) {
	url := buildQRURL("JBSWY3DPEHPK3PXP", "user@example.com")
	expected := "otpauth://totp/AI-Office:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AI-Office"
	if url != expected {
		t.Errorf("QR URL = %q, want %q", url, expected)
	}
}
