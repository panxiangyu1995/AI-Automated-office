package middleware

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/config"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
)

func TestAuthRequired_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")
	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called")
	})

	w := performRequest(r, "GET", "/test")

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthRequired_InvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")
	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called")
	})

	w := performRequestWithHeader(r, "GET", "/test", "Authorization", "InvalidFormat token")

	if w.Code != 401 {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestMFAFunctions_NilCache(t *testing.T) {
	original := mfaCache
	mfaCache = nil
	defer func() { mfaCache = original }()

	ctx := context.Background()

	_, err := IsMFAVerified(ctx, "user-1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not initialized")

	err = MarkMFAVerified(ctx, "user-1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not initialized")

	err = ClearMFAVerified(ctx, "user-1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not initialized")
}

func newTestMFACache(t *testing.T) *redis.Cache {
	t.Helper()
	client, err := redis.NewClient(redisTestConfig())
	if err != nil {
		t.Skipf("Redis not available: %v", err)
	}
	t.Cleanup(func() {
		client.RDB().FlushDB(context.Background())
		client.Close()
	})
	return redis.NewCache(client)
}

func redisTestConfig() config.RedisConfig {
	return config.RedisConfig{Host: "localhost", Port: 6379, DB: 2}
}

func TestMarkMFAVerified_AndIsMFAVerified(t *testing.T) {
	cache := newTestMFACache(t)
	original := mfaCache
	mfaCache = cache
	defer func() { mfaCache = original }()

	ctx := context.Background()
	userID := "mfa-test-user-1"

	verified, err := IsMFAVerified(ctx, userID)
	assert.NoError(t, err)
	assert.False(t, verified, "should not be verified before marking")

	err = MarkMFAVerified(ctx, userID)
	assert.NoError(t, err)

	verified, err = IsMFAVerified(ctx, userID)
	assert.NoError(t, err)
	assert.True(t, verified, "should be verified after marking")
}

func TestClearMFAVerified(t *testing.T) {
	cache := newTestMFACache(t)
	original := mfaCache
	mfaCache = cache
	defer func() { mfaCache = original }()

	ctx := context.Background()
	userID := "mfa-test-user-2"

	err := MarkMFAVerified(ctx, userID)
	require.NoError(t, err)

	verified, err := IsMFAVerified(ctx, userID)
	require.True(t, verified)

	err = ClearMFAVerified(ctx, userID)
	assert.NoError(t, err)

	verified, err = IsMFAVerified(ctx, userID)
	assert.NoError(t, err)
	assert.False(t, verified, "should not be verified after clearing")
}

func TestAuthRequired_MFARequired_Blocked(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")

	db := setupAuthTestDB(t)
	originalDB := GlobalAuthDB
	GlobalAuthDB = db
	defer func() { GlobalAuthDB = originalDB }()

	userID := "11111111-1111-1111-1111-111111111111"
	eid := "22222222-2222-2222-2222-222222222222"
	db.Exec(`INSERT INTO mfa_configs (id, enterprise_id, user_id, method, secret, verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		"33333333-3333-3333-3333-333333333333", eid, userID, "totp", "JBSWY3DPEHPK3PXP", 1, time.Now(), time.Now())

	cache := newTestMFACache(t)
	original := mfaCache
	mfaCache = cache
	defer func() { mfaCache = original }()

	token, err := mgr.GenerateAccessToken(uuid.MustParse(userID), uuid.MustParse(eid), "employee", "mfa@test.com")
	require.NoError(t, err)

	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called when MFA required but not verified")
	})

	w := performRequestWithHeader(r, "GET", "/test", "Authorization", "Bearer "+token)

	assert.Equal(t, 403, w.Code)
}

func TestAuthRequired_MFARequired_PassesWhenVerified(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")

	db := setupAuthTestDB(t)
	originalDB := GlobalAuthDB
	GlobalAuthDB = db
	defer func() { GlobalAuthDB = originalDB }()

	userID := "44444444-4444-4444-4444-444444444444"
	eid := "55555555-5555-5555-5555-555555555555"
	db.Exec(`INSERT INTO mfa_configs (id, enterprise_id, user_id, method, secret, verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		"66666666-6666-6666-6666-666666666666", eid, userID, "totp", "JBSWY3DPEHPK3PXP", 1, time.Now(), time.Now())

	cache := newTestMFACache(t)
	original := mfaCache
	mfaCache = cache
	defer func() { mfaCache = original }()

	ctx := context.Background()
	err := MarkMFAVerified(ctx, userID)
	require.NoError(t, err)

	token, err := mgr.GenerateAccessToken(uuid.MustParse(userID), uuid.MustParse(eid), "employee", "mfa-verified@test.com")
	require.NoError(t, err)

	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	w := performRequestWithHeader(r, "GET", "/test", "Authorization", "Bearer "+token)

	assert.Equal(t, 200, w.Code)
}

func TestAuthRequired_MFANotRequired_Passes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mgr := auth.NewJWTManager("secret", 3600, 2592000, "test")

	db := setupAuthTestDB(t)
	originalDB := GlobalAuthDB
	GlobalAuthDB = db
	defer func() { GlobalAuthDB = originalDB }()

	userID := "77777777-7777-7777-7777-777777777777"
	eid := "88888888-8888-8888-8888-888888888888"

	cache := newTestMFACache(t)
	original := mfaCache
	mfaCache = cache
	defer func() { mfaCache = original }()

	token, err := mgr.GenerateAccessToken(uuid.MustParse(userID), uuid.MustParse(eid), "employee", "no-mfa@test.com")
	require.NoError(t, err)

	r := gin.New()
	r.Use(AuthRequired(mgr, nil))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	w := performRequestWithHeader(r, "GET", "/test", "Authorization", "Bearer "+token)

	assert.Equal(t, 200, w.Code)
}

func setupAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE mfa_configs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, user_id TEXT NOT NULL,
		method VARCHAR(20) NOT NULL DEFAULT 'totp', secret VARCHAR(100) NOT NULL,
		verified BOOLEAN DEFAULT FALSE, backup_codes TEXT)`).Error)
	return db
}

func TestGetUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	assert.Equal(t, "", GetUserID(c))

	c.Set(ContextKeyUserID, "user-123")
	assert.Equal(t, "user-123", GetUserID(c))

	c.Set(ContextKeyUserID, 123)
	assert.Equal(t, "", GetUserID(c))
}

func TestGetRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	assert.Equal(t, "", GetRole(c))

	c.Set(ContextKeyRole, "admin")
	assert.Equal(t, "admin", GetRole(c))

	c.Set(ContextKeyRole, 42)
	assert.Equal(t, "", GetRole(c))
}

func performRequest(r *gin.Engine, method, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, nil)
	r.ServeHTTP(w, req)
	return w
}

func performRequestWithHeader(r *gin.Engine, method, path, header, value string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, nil)
	req.Header.Set(header, value)
	r.ServeHTTP(w, req)
	return w
}
