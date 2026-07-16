package acceptance

import (
	"crypto/sha256"
	"encoding/base64"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
)

func connectPKCEDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := "host=localhost user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	return db
}

func setupPKCETables(t *testing.T, db *gorm.DB) {
	t.Helper()
	db.Exec(`CREATE TABLE IF NOT EXISTS device_codes (
		id VARCHAR(100) PRIMARY KEY,
		device_code VARCHAR(100) NOT NULL UNIQUE,
		user_code VARCHAR(20) NOT NULL UNIQUE,
		client_id VARCHAR(100) NOT NULL,
		code_challenge VARCHAR(128),
		code_challenge_method VARCHAR(10),
		expires_at TIMESTAMP NOT NULL,
		interval INTEGER DEFAULT 5,
		verified BOOLEAN DEFAULT FALSE,
		exchanged BOOLEAN DEFAULT FALSE,
		user_id UUID,
		scopes TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	)`)
	db.Exec(`ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS code_challenge VARCHAR(128)`)
	db.Exec(`ALTER TABLE device_codes ADD COLUMN IF NOT EXISTS code_challenge_method VARCHAR(10)`)
	db.Exec(`DELETE FROM device_codes`)

	db.Exec(`CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		name VARCHAR(255),
		role VARCHAR(50) DEFAULT 'employee',
		enterprise_id VARCHAR(100),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
}

func TestAcceptance_PKCE_FullDeviceFlow(t *testing.T) {
	db := connectPKCEDB(t)
	setupPKCETables(t, db)

	userRepo := repository.NewUserRepository(db)
	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	jwtManager := auth.NewJWTManager("test-secret-key-for-acceptance", 30, 10080, "ai-office-test")
	svc := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)

	codeVerifier := "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
	h := sha256.Sum256([]byte(codeVerifier))
	codeChallenge := base64.RawURLEncoding.EncodeToString(h[:])

	t.Logf("PKCE flow: verifier=%s challenge=%s", codeVerifier, codeChallenge)

	codeResp, appErr := svc.GenerateDeviceCode(service.DeviceCodeRequest{
		ClientID:            "ao-cli-test",
		Scope:               "read write",
		CodeChallenge:       codeChallenge,
		CodeChallengeMethod: "S256",
	})
	require.Nil(t, appErr, "GenerateDeviceCode should succeed")
	require.NotEmpty(t, codeResp.DeviceCode)
	require.NotEmpty(t, codeResp.UserCode)
	t.Logf("Step 1: Device code generated: device_code=%s user_code=%s", codeResp.DeviceCode, codeResp.UserCode)

	dc, _ := deviceAuthRepo.FindByDeviceCode(codeResp.DeviceCode)
	require.NotNil(t, dc)
	assert.Equal(t, codeChallenge, dc.CodeChallenge, "code_challenge should be stored")
	assert.Equal(t, "S256", dc.CodeChallengeMethod, "code_challenge_method should be stored")

	_, appErr = svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode: codeResp.DeviceCode,
		ClientID:   "ao-cli-test",
	})
	assert.NotNil(t, appErr, "exchange before verification should fail with pending")
	assert.Equal(t, "AUTH_DEVICE_PENDING", appErr.Code)

	testUserID := uuid.New()
	testEID := uuid.New()
	emailSuffix := testUserID.String()[:8]
	db.Exec(`INSERT INTO users (id, email, password_hash, name, role, enterprise_id) VALUES (?, ?, 'hashed', 'PKCE Test User', 'employee', ?)
		ON CONFLICT DO NOTHING`, testUserID, "pkce-test-"+emailSuffix+"@test.com", testEID)
	appErr = svc.VerifyDeviceCode(codeResp.DeviceCode, testUserID.String())
	require.Nil(t, appErr, "VerifyDeviceCode should succeed")
	t.Log("Step 2: Device code verified by user")

	tokenResp, appErr := svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode:   codeResp.DeviceCode,
		ClientID:     "ao-cli-test",
		CodeVerifier: codeVerifier,
	})
	require.Nil(t, appErr, "ExchangeToken with correct PKCE verifier should succeed")
	require.NotEmpty(t, tokenResp.AccessToken)
	require.NotEmpty(t, tokenResp.RefreshToken)
	t.Logf("Step 3: Token exchanged successfully with PKCE")
}

func TestAcceptance_PKCE_WrongVerifierRejected(t *testing.T) {
	db := connectPKCEDB(t)
	setupPKCETables(t, db)

	userRepo := repository.NewUserRepository(db)
	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	jwtManager := auth.NewJWTManager("test-secret-key-for-acceptance", 30, 10080, "ai-office-test")
	svc := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)

	codeVerifier := "correct-verifier-value-that-is-long-enough"
	h := sha256.Sum256([]byte(codeVerifier))
	codeChallenge := base64.RawURLEncoding.EncodeToString(h[:])

	codeResp, _ := svc.GenerateDeviceCode(service.DeviceCodeRequest{
		ClientID:            "ao-cli-wrong-test",
		Scope:               "read",
		CodeChallenge:       codeChallenge,
		CodeChallengeMethod: "S256",
	})

	testUserID := uuid.New()
	testEID := uuid.New()
	emailSuffix := testUserID.String()[:8]
	db.Exec(`INSERT INTO users (id, email, password_hash, name, role, enterprise_id) VALUES (?, ?, 'hashed', 'Wrong PKCE', 'employee', ?)
		ON CONFLICT DO NOTHING`, testUserID, "pkce-wrong-"+emailSuffix+"@test.com", testEID)
	svc.VerifyDeviceCode(codeResp.DeviceCode, testUserID.String())

	_, appErr := svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode:   codeResp.DeviceCode,
		ClientID:     "ao-cli-wrong-test",
		CodeVerifier: "wrong-verifier-completely-different",
	})
	assert.NotNil(t, appErr, "ExchangeToken with wrong PKCE verifier should fail")
	assert.Equal(t, "AUTH_TOKEN_INVALID", appErr.Code)
	t.Log("Step 4: Wrong verifier correctly rejected")
}

func TestAcceptance_PKCE_MissingVerifierRejected(t *testing.T) {
	db := connectPKCEDB(t)
	setupPKCETables(t, db)

	userRepo := repository.NewUserRepository(db)
	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	jwtManager := auth.NewJWTManager("test-secret-key-for-acceptance", 30, 10080, "ai-office-test")
	svc := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)

	h := sha256.Sum256([]byte("some-verifier"))
	codeChallenge := base64.RawURLEncoding.EncodeToString(h[:])

	codeResp, _ := svc.GenerateDeviceCode(service.DeviceCodeRequest{
		ClientID:            "ao-cli-no-verifier",
		CodeChallenge:       codeChallenge,
		CodeChallengeMethod: "S256",
	})

	testUserID := uuid.New()
	testEID := uuid.New()
	emailSuffix := testUserID.String()[:8]
	db.Exec(`INSERT INTO users (id, email, password_hash, name, role, enterprise_id) VALUES (?, ?, 'hashed', 'No Verifier', 'employee', ?)
		ON CONFLICT DO NOTHING`, testUserID, "pkce-no-v-"+emailSuffix+"@test.com", testEID)
	svc.VerifyDeviceCode(codeResp.DeviceCode, testUserID.String())

	_, appErr := svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode: codeResp.DeviceCode,
		ClientID:   "ao-cli-no-verifier",
	})
	assert.NotNil(t, appErr, "ExchangeToken without code_verifier should fail when challenge was set")
	t.Log("Step 5: Missing verifier correctly rejected")
}

func TestAcceptance_PKCE_PlainMethod(t *testing.T) {
	db := connectPKCEDB(t)
	setupPKCETables(t, db)

	userRepo := repository.NewUserRepository(db)
	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	jwtManager := auth.NewJWTManager("test-secret-key-for-acceptance", 30, 10080, "ai-office-test")
	svc := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)

	codeVerifier := "plain-text-verifier-value-here"

	codeResp, _ := svc.GenerateDeviceCode(service.DeviceCodeRequest{
		ClientID:            "ao-cli-plain-test",
		CodeChallenge:       codeVerifier,
		CodeChallengeMethod: "plain",
	})

	testUserID := uuid.New()
	testEID := uuid.New()
	emailSuffix := testUserID.String()[:8]
	db.Exec(`INSERT INTO users (id, email, password_hash, name, role, enterprise_id) VALUES (?, ?, 'hashed', 'Plain PKCE', 'employee', ?)
		ON CONFLICT DO NOTHING`, testUserID, "pkce-plain-"+emailSuffix+"@test.com", testEID)
	svc.VerifyDeviceCode(codeResp.DeviceCode, testUserID.String())

	tokenResp, appErr := svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode:   codeResp.DeviceCode,
		ClientID:     "ao-cli-plain-test",
		CodeVerifier: codeVerifier,
	})
	require.Nil(t, appErr, "ExchangeToken with plain method should succeed")
	require.NotEmpty(t, tokenResp.AccessToken)
	t.Log("Step 6: Plain method PKCE works correctly")
}

func TestAcceptance_PKCE_NoChallengeSkipsVerification(t *testing.T) {
	db := connectPKCEDB(t)
	setupPKCETables(t, db)

	userRepo := repository.NewUserRepository(db)
	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	jwtManager := auth.NewJWTManager("test-secret-key-for-acceptance", 30, 10080, "ai-office-test")
	svc := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)

	codeResp, _ := svc.GenerateDeviceCode(service.DeviceCodeRequest{
		ClientID: "ao-cli-no-pkce",
		Scope:    "read",
	})

	testUserID := uuid.New()
	testEID := uuid.New()
	emailSuffix := testUserID.String()[:8]
	db.Exec(`INSERT INTO users (id, email, password_hash, name, role, enterprise_id) VALUES (?, ?, 'hashed', 'No PKCE', 'employee', ?)
		ON CONFLICT DO NOTHING`, testUserID, "pkce-none-"+emailSuffix+"@test.com", testEID)
	svc.VerifyDeviceCode(codeResp.DeviceCode, testUserID.String())

	tokenResp, appErr := svc.ExchangeToken(service.DeviceTokenRequest{
		DeviceCode: codeResp.DeviceCode,
		ClientID:   "ao-cli-no-pkce",
	})
	require.Nil(t, appErr, "ExchangeToken without PKCE should succeed when no challenge was set")
	require.NotEmpty(t, tokenResp.AccessToken)
	t.Log("Step 7: Device flow without PKCE still works (backward compatible)")
}
