package crypto

import (
	"testing"
	"time"
)

func TestBcryptHasherHashVerifyAndStrength(t *testing.T) {
	t.Parallel()

	hasher := NewDefaultBcryptHasher()
	password := "StrongPass1"

	if err := hasher.ValidateStrength(password); err != nil {
		t.Fatalf("expected strong password, got: %v", err)
	}

	hash, err := hasher.Hash(password)
	if err != nil {
		t.Fatalf("hash failed: %v", err)
	}

	if !hasher.Verify(hash, password) {
		t.Fatal("verify should pass for original password")
	}
	if hasher.Verify(hash, "wrong-pass") {
		t.Fatal("verify should fail for wrong password")
	}
}

func TestJWTManagerGenerateValidateRefresh(t *testing.T) {
	t.Parallel()

	manager := NewJWTManager(JWTConfig{
		Secret:          "test-secret",
		Issuer:          "test-issuer",
		Audience:        "test-audience",
		AccessTokenExp:  60 * time.Second,
		RefreshTokenExp: 120 * time.Second,
	})

	pair, err := manager.GenerateTokenPair("user-1", "tenant-1", []string{"admin"}, []string{"auth.login"})
	if err != nil {
		t.Fatalf("GenerateTokenPair failed: %v", err)
	}
	if pair.AccessToken == "" || pair.RefreshToken == "" || pair.ExpiresIn <= 0 {
		t.Fatal("token pair should be fully populated")
	}

	claims, err := manager.ValidateToken(pair.AccessToken)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != "user-1" || claims.TenantID != "tenant-1" {
		t.Fatalf("unexpected claims: %+v", claims)
	}

	refreshed, err := manager.RefreshToken(pair.RefreshToken)
	if err != nil {
		t.Fatalf("RefreshToken failed: %v", err)
	}
	if refreshed.AccessToken == pair.AccessToken {
		t.Fatal("refresh should generate a new access token")
	}
}
