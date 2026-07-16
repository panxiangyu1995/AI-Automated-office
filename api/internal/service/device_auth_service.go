package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"math/big"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type DeviceAuthService struct {
	repo       repository.DeviceAuthRepository
	userRepo   repository.UserRepository
	jwtManager *auth.JWTManager
}

func NewDeviceAuthService(repo repository.DeviceAuthRepository, userRepo repository.UserRepository, jwtManager *auth.JWTManager) *DeviceAuthService {
	return &DeviceAuthService{
		repo:       repo,
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

type DeviceCodeRequest struct {
	ClientID            string `json:"client_id"`
	Scope               string `json:"scope"`
	CodeChallenge       string `json:"code_challenge,omitempty"`
	CodeChallengeMethod string `json:"code_challenge_method,omitempty"`
}

type DeviceCodeResponse struct {
	DeviceCode      string `json:"device_code"`
	UserCode        string `json:"user_code"`
	VerificationURI string `json:"verification_uri"`
	ExpiresIn       int    `json:"expires_in"`
	Interval        int    `json:"interval"`
}

func (s *DeviceAuthService) GenerateDeviceCode(req DeviceCodeRequest) (*DeviceCodeResponse, *apperrors.AppError) {
	if req.ClientID == "" {
		return nil, apperrors.NewValidationError("client_id", "client_id 不能为空")
	}

	deviceCode, err := generateRandomString(40)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成设备码失败")
	}

	userCode, err := generateUserCode()
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成用户码失败")
	}

	expiresIn := 900
	interval := 5

	dc := &model.DeviceCode{
		ID:                  uuid.New().String(),
		DeviceCode:          deviceCode,
		UserCode:            userCode,
		ClientID:            req.ClientID,
		CodeChallenge:       req.CodeChallenge,
		CodeChallengeMethod: req.CodeChallengeMethod,
		ExpiresAt:           time.Now().Add(time.Duration(expiresIn) * time.Second),
		Interval:            interval,
		Scopes:              req.Scope,
	}

	if err := s.repo.Save(dc); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("保存设备码失败")
	}

	return &DeviceCodeResponse{
		DeviceCode:      deviceCode,
		UserCode:        userCode,
		VerificationURI: "/auth/device/verify",
		ExpiresIn:       expiresIn,
		Interval:        interval,
	}, nil
}

type DeviceTokenRequest struct {
	DeviceCode   string `json:"device_code"`
	ClientID     string `json:"client_id"`
	CodeVerifier string `json:"code_verifier,omitempty"`
}

func (s *DeviceAuthService) ExchangeToken(req DeviceTokenRequest) (*TokenResponse, *apperrors.AppError) {
	if req.DeviceCode == "" {
		return nil, apperrors.NewValidationError("device_code", "device_code 不能为空")
	}
	if req.ClientID == "" {
		return nil, apperrors.NewValidationError("client_id", "client_id 不能为空")
	}

	dc, err := s.repo.FindByDeviceCode(req.DeviceCode)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询设备码失败")
	}
	if dc == nil {
		return nil, apperrors.ErrTokenInvalid.WithDetail("无效的设备码")
	}

	if time.Now().After(dc.ExpiresAt) {
		return nil, apperrors.ErrTokenExpired.WithDetail("设备码已过期")
	}

	if dc.ClientID != req.ClientID {
		return nil, apperrors.ErrTokenInvalid.WithDetail("client_id 不匹配")
	}

	if !dc.Verified {
		return nil, apperrors.NewAppError("AUTH_DEVICE_PENDING", "授权待确认，请稍后重试", 428)
	}

	if dc.UserID == nil {
		return nil, apperrors.NewAppError("AUTH_DEVICE_PENDING", "授权待确认，请稍后重试", 428)
	}

	if dc.Exchanged {
		return nil, apperrors.ErrTokenInvalid.WithDetail("设备码已被使用")
	}

	if dc.CodeChallenge != "" {
		if req.CodeVerifier == "" {
			return nil, apperrors.NewValidationError("code_verifier", "PKCE code_verifier 不能为空")
		}
		if !verifyPKCE(req.CodeVerifier, dc.CodeChallenge, dc.CodeChallengeMethod) {
			return nil, apperrors.ErrTokenInvalid.WithDetail("PKCE 验证失败")
		}
	}

	if markErr := s.repo.MarkExchanged(req.DeviceCode); markErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新设备码状态失败")
	}

	userID, parseErr := uuid.Parse(*dc.UserID)
	if parseErr != nil {
		return nil, apperrors.ErrTokenInvalid.WithDetail("关联用户ID无效")
	}

	user, findErr := s.userRepo.FindByID(userID)
	if findErr != nil || user == nil {
		return nil, apperrors.ErrUnauthorized.WithDetail("关联用户不存在")
	}

	enterpriseID, _ := uuid.Parse(user.EnterpriseID)

	accessToken, genErr := s.jwtManager.GenerateAccessToken(user.ID, enterpriseID, user.Role, user.Email)
	if genErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("生成令牌失败")
	}

	refreshToken, _, genErr := s.jwtManager.GenerateRefreshToken(user.ID)
	if genErr != nil {
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

func (s *DeviceAuthService) FindByUserCode(userCode string) (*model.DeviceCode, *apperrors.AppError) {
	dc, err := s.repo.FindByUserCode(userCode)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询用户码失败")
	}
	return dc, nil
}

func (s *DeviceAuthService) VerifyDeviceCode(deviceCode string, userIDStr string) *apperrors.AppError {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return apperrors.ErrTokenInvalid.WithDetail("用户ID无效")
	}

	dc, findErr := s.repo.FindByDeviceCode(deviceCode)
	if findErr != nil {
		return apperrors.ErrInternal.WithDetail("查询设备码失败")
	}
	if dc == nil {
		return apperrors.ErrNotFound.WithDetail("设备码不存在")
	}

	if dc.Verified {
		return apperrors.ErrConflict.WithDetail("设备码已被使用")
	}

	if markErr := s.repo.MarkVerified(deviceCode, userID); markErr != nil {
		return apperrors.ErrInternal.WithDetail("更新设备码状态失败")
	}

	return nil
}

func generateUserCode() (string, error) {
	chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	result := make([]byte, 8)
	for i := range result {
		if i == 4 {
			result[i] = '-'
			continue
		}
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", err
		}
		result[i] = chars[n.Int64()]
	}
	return string(result), nil
}

func generateRandomString(length int) (string, error) {
	chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", err
		}
		result[i] = chars[n.Int64()]
	}
	return string(result), nil
}

func verifyPKCE(verifier, challenge, method string) bool {
	if method == "" || method == "S256" {
		h := sha256.Sum256([]byte(verifier))
		computed := base64.RawURLEncoding.EncodeToString(h[:])
		return computed == challenge
	}
	if method == "plain" {
		return verifier == challenge
	}
	return false
}

func GenerateCodeVerifier() (string, error) {
	return generateRandomString(43)
}

func ComputeCodeChallenge(verifier string) string {
	h := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(h[:])
}

func IsPKCERequiredForDeviceFlow() bool {
	return true
}
