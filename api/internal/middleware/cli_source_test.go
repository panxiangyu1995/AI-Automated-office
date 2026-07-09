package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/ai-office/api/pkg/config"
)

func testCLISetup(secret string) (*gin.Engine, string) {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		JWT: config.JWTConfig{Secret: secret},
	}
	logger := zap.NewNop()
	r := gin.New()
	r.Use(CLISourceOnly(cfg, logger))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})
	return r, cfg.JWT.GetCLIHMACSecret()
}

func computeSig(secret, method, path, bodyHashHex, tsStr string) string {
	message := method + "\n" + path + "\n" + bodyHashHex + "\n" + tsStr
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}

func emptyBodyHash() string {
	h := sha256.Sum256(nil)
	return hex.EncodeToString(h[:])
}

func TestCLISourceOnly_MissingSource(t *testing.T) {
	r, _ := testCLISetup("secret")
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	if w.Code != 403 {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestCLISourceOnly_LegacyNoSignature(t *testing.T) {
	r, _ := testCLISetup("secret")
	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Errorf("expected 200 (legacy mode), got %d", w.Code)
	}
}

func TestCLISourceOnly_ValidSignature(t *testing.T) {
	secret := "test-hmac-secret"
	r, hmacSecret := testCLISetup(secret)
	if hmacSecret != secret {
		t.Fatalf("expected secret %s, got %s", secret, hmacSecret)
	}

	ts := time.Now().Unix()
	tsStr := strconv.FormatInt(ts, 10)
	bodyHash := emptyBodyHash()
	sig := computeSig(hmacSecret, "GET", "/test", bodyHash, tsStr)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	req.Header.Set("X-Signature", sig)
	req.Header.Set("X-Timestamp", tsStr)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestCLISourceOnly_InvalidSignature(t *testing.T) {
	r, _ := testCLISetup("secret")

	ts := time.Now().Unix()
	tsStr := strconv.FormatInt(ts, 10)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	req.Header.Set("X-Signature", "badsignature")
	req.Header.Set("X-Timestamp", tsStr)
	r.ServeHTTP(w, req)

	if w.Code != 403 {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestCLISourceOnly_ExpiredTimestamp(t *testing.T) {
	r, hmacSecret := testCLISetup("secret")

	ts := time.Now().Add(-10 * time.Minute).Unix()
	tsStr := strconv.FormatInt(ts, 10)
	bodyHash := emptyBodyHash()
	sig := computeSig(hmacSecret, "GET", "/test", bodyHash, tsStr)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	req.Header.Set("X-Signature", sig)
	req.Header.Set("X-Timestamp", tsStr)
	r.ServeHTTP(w, req)

	if w.Code != 403 {
		t.Errorf("expected 403 for expired timestamp, got %d", w.Code)
	}
}

func TestCLISourceOnly_InvalidTimestamp(t *testing.T) {
	r, _ := testCLISetup("secret")

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	req.Header.Set("X-Signature", "sig")
	req.Header.Set("X-Timestamp", "not-a-number")
	r.ServeHTTP(w, req)

	if w.Code != 403 {
		t.Errorf("expected 403 for invalid timestamp, got %d", w.Code)
	}
}

func TestCLISourceOnly_DedicatedHMACSecret(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:        "jwt-secret",
			CLIHMACSecret: "dedicated-hmac-secret",
		},
	}
	logger := zap.NewNop()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CLISourceOnly(cfg, logger))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})

	hmacSecret := cfg.JWT.GetCLIHMACSecret()
	if hmacSecret != "dedicated-hmac-secret" {
		t.Fatalf("expected dedicated secret, got %s", hmacSecret)
	}

	ts := time.Now().Unix()
	tsStr := strconv.FormatInt(ts, 10)
	bodyHash := emptyBodyHash()
	sig := computeSig(hmacSecret, "GET", "/test", bodyHash, tsStr)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-Source", "ao-cli")
	req.Header.Set("X-Signature", sig)
	req.Header.Set("X-Timestamp", tsStr)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("expected 200 with dedicated secret, got %d", w.Code)
	}
}
