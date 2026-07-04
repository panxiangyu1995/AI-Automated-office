package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestJWTManager_GenerateAccessToken(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	userID := uuid.New()
	enterpriseID := uuid.New()

	token, err := mgr.GenerateAccessToken(userID, enterpriseID, "admin", "admin@test.com")
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
}

func TestJWTManager_ValidateToken_Valid(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	userID := uuid.New()
	enterpriseID := uuid.New()

	token, _ := mgr.GenerateAccessToken(userID, enterpriseID, "admin", "admin@test.com")
	claims, err := mgr.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != userID.String() {
		t.Errorf("expected user_id %s, got %s", userID.String(), claims.UserID)
	}
	if claims.Role != "admin" {
		t.Errorf("expected role admin, got %s", claims.Role)
	}
	if claims.Email != "admin@test.com" {
		t.Errorf("expected email admin@test.com, got %s", claims.Email)
	}
}

func TestJWTManager_ValidateToken_Expired(t *testing.T) {
	mgr := NewJWTManager("test-secret", -1, 2592000, "test-issuer")
	userID := uuid.New()

	token, _ := mgr.GenerateAccessToken(userID, uuid.New(), "admin", "a@b.com")
	_, err := mgr.ValidateToken(token)
	if err == nil {
		t.Error("expected error for expired token")
	}
}

func TestJWTManager_ValidateToken_WrongSecret(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	mgr2 := NewJWTManager("wrong-secret", 3600, 2592000, "test-issuer")
	userID := uuid.New()

	token, _ := mgr.GenerateAccessToken(userID, uuid.New(), "admin", "a@b.com")
	_, err := mgr2.ValidateToken(token)
	if err == nil {
		t.Error("expected error for wrong secret")
	}
}

func TestJWTManager_ValidateToken_InvalidToken(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	_, err := mgr.ValidateToken("invalid-token-string")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestJWTManager_GenerateRefreshToken(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	userID := uuid.New()

	token, expiresAt, err := mgr.GenerateRefreshToken(userID)
	if err != nil {
		t.Fatalf("GenerateRefreshToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if expiresAt.IsZero() {
		t.Fatal("expected non-zero expiration")
	}
}

func TestJWTManager_RefreshToken_Validation(t *testing.T) {
	mgr := NewJWTManager("test-secret", 3600, 2592000, "test-issuer")
	userID := uuid.New()

	token, _, _ := mgr.GenerateRefreshToken(userID)
	claims, err := mgr.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != userID.String() {
		t.Errorf("expected user_id %s, got %s", userID.String(), claims.UserID)
	}
}

func TestJWTManager_AccessTokenHasClaims(t *testing.T) {
	mgr := NewJWTManager("secret", 3600, 2592000, "issuer")
	userID := uuid.New()
	enterpriseID := uuid.New()

	token, _ := mgr.GenerateAccessToken(userID, enterpriseID, "employee", "emp@test.com")
	claims, _ := mgr.ValidateToken(token)

	if claims.EnterpriseID != enterpriseID.String() {
		t.Errorf("expected enterprise_id %s, got %s", enterpriseID.String(), claims.EnterpriseID)
	}
}

func TestJWTManager_AccessTTL(t *testing.T) {
	mgr := NewJWTManager("secret", 3600, 2592000, "issuer")
	if mgr.AccessTTL() != time.Hour {
		t.Errorf("expected 1h, got %v", mgr.AccessTTL())
	}
}

func TestClaims_ImplementsStandardClaims(t *testing.T) {
	c := &Claims{
		UserID: "user-1",
		Role:   "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: "test",
		},
	}
	if c.Issuer != "test" {
		t.Errorf("expected issuer test, got %s", c.Issuer)
	}
}
