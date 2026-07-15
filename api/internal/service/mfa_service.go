package service

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type MFAService struct {
	mfaRepo  repository.MFARepository
	userRepo repository.UserRepository
}

func NewMFAService(mfaRepo repository.MFARepository, userRepo repository.UserRepository) *MFAService {
	return &MFAService{mfaRepo: mfaRepo, userRepo: userRepo}
}

type MFAEnableResult struct {
	Secret      string   `json:"secret"`
	QRURL       string   `json:"qr_url"`
	BackupCodes []string `json:"backup_codes"`
}

func (s *MFAService) EnableMFA(userID, method string) (*MFAEnableResult, *apperrors.AppError) {
	_, err := uuid.Parse(userID)
	if err != nil {
		return nil, apperrors.NewValidationError("user_id", "用户ID无效")
	}

	secret, genErr := generateTOTPSecret()
	if genErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成MFA密钥失败")
	}

	backupCodes, genErr := generateBackupCodes(10)
	if genErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成备用码失败")
	}

	backupCodesJSON, _ := json.Marshal(backupCodes)

	existing, findErr := s.mfaRepo.FindByUserID(userID)
	if findErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询MFA配置失败")
	}
	if existing != nil {
		existing.Method = method
		existing.Secret = secret
		existing.Verified = false
		existing.BackupCodes = string(backupCodesJSON)
		if saveErr := s.mfaRepo.Save(existing); saveErr != nil {
			return nil, apperrors.ErrInternal.WithDetail("更新MFA配置失败")
		}
		return &MFAEnableResult{
			Secret:      secret,
			QRURL:       buildQRURL(secret, existing.UserID),
			BackupCodes: backupCodes,
		}, nil
	}

	user, findErr := s.userRepo.FindByIDString(userID)
	if findErr != nil || user == nil {
		return nil, apperrors.ErrNotFound.WithDetail("用户不存在")
	}

	mfaConfig := &model.MFAConfig{
		UserID:      userID,
		Method:      method,
		Secret:      secret,
		Verified:    false,
		BackupCodes: string(backupCodesJSON),
	}
	eid, _ := uuid.Parse(user.EnterpriseID)
	mfaConfig.EnterpriseID = eid

	if createErr := s.mfaRepo.Create(mfaConfig); createErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建MFA配置失败")
	}

	return &MFAEnableResult{
		Secret:      secret,
		QRURL:       buildQRURL(secret, user.Email),
		BackupCodes: backupCodes,
	}, nil
}

func (s *MFAService) VerifyMFA(userID, code string) (bool, *apperrors.AppError) {
	if code == "" {
		return false, apperrors.NewValidationError("code", "验证码不能为空")
	}

	config, findErr := s.mfaRepo.FindByUserID(userID)
	if findErr != nil {
		return false, apperrors.ErrInternal.WithDetail("查询MFA配置失败")
	}
	if config == nil {
		return false, apperrors.ErrNotFound.WithDetail("MFA未启用")
	}

	if config.Method == "totp" {
		if validateTOTP(config.Secret, code) {
			if !config.Verified {
				s.mfaRepo.UpdateVerified(config.ID, true)
			}
			return true, nil
		}
	}

	var backupCodes []string
	if jsonErr := json.Unmarshal([]byte(config.BackupCodes), &backupCodes); jsonErr == nil {
		for i, bc := range backupCodes {
			if bc == code {
				backupCodes = append(backupCodes[:i], backupCodes[i+1:]...)
				updated, _ := json.Marshal(backupCodes)
				s.mfaRepo.UpdateBackupCodes(config.ID, string(updated))
				return true, nil
			}
		}
	}

	return false, nil
}

func (s *MFAService) DisableMFA(userID string) *apperrors.AppError {
	rowsAffected, err := s.mfaRepo.DeleteByUserID(userID)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("禁用MFA失败")
	}
	if rowsAffected == 0 {
		return apperrors.ErrNotFound.WithDetail("MFA未启用")
	}
	return nil
}

func (s *MFAService) IsMFAEnabled(userID string) (bool, *apperrors.AppError) {
	config, err := s.mfaRepo.FindByUserIDAndVerified(userID, true)
	if err != nil {
		return false, nil
	}
	if config == nil {
		return false, nil
	}
	return true, nil
}

func (s *MFAService) GetMFAStatus(userID string) (map[string]interface{}, *apperrors.AppError) {
	config, err := s.mfaRepo.FindByUserID(userID)
	if err != nil || config == nil {
		return map[string]interface{}{
			"enabled":  false,
			"method":   "",
			"verified": false,
		}, nil
	}
	return map[string]interface{}{
		"enabled":  true,
		"method":   config.Method,
		"verified": config.Verified,
	}, nil
}

func generateTOTPSecret() (string, error) {
	bytes := make([]byte, 20)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	encoder := base32.NewEncoding("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567").WithPadding(base32.NoPadding)
	return encoder.EncodeToString(bytes), nil
}

func buildQRURL(secret, account string) string {
	return fmt.Sprintf("otpauth://totp/AI-Office:%s?secret=%s&issuer=AI-Office", account, secret)
}

func validateTOTP(secret, code string) bool {
	now := time.Now().Unix()
	for offset := -1; offset <= 1; offset++ {
		if computeTOTP(secret, now+int64(offset*30)) == code {
			return true
		}
	}
	return false
}

func computeTOTP(secret string, timestamp int64) string {
	key, err := base32.NewEncoding("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567").WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secret))
	if err != nil {
		return ""
	}

	counter := timestamp / 30
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(counter))

	mac := hmac.New(sha1.New, key)
	mac.Write(buf)
	hash := mac.Sum(nil)

	offset := hash[len(hash)-1] & 0x0f
	truncated := binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff

	return fmt.Sprintf("%06d", truncated%1000000)
}

func generateBackupCodes(count int) ([]string, error) {
	codes := make([]string, count)
	for i := 0; i < count; i++ {
		b := make([]byte, 4)
		if _, err := rand.Read(b); err != nil {
			return nil, err
		}
		codes[i] = fmt.Sprintf("%08d", binary.BigEndian.Uint32(b)%100000000)
	}
	return codes, nil
}
