package auth

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("my-password")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if hash == "my-password" {
		t.Fatal("hash should not equal plaintext")
	}
}

func TestCheckPassword_Correct(t *testing.T) {
	hash, _ := HashPassword("correct-password")
	if !CheckPassword("correct-password", hash) {
		t.Error("expected password check to pass")
	}
}

func TestCheckPassword_Wrong(t *testing.T) {
	hash, _ := HashPassword("correct-password")
	if CheckPassword("wrong-password", hash) {
		t.Error("expected password check to fail")
	}
}

func TestHashPassword_Empty(t *testing.T) {
	hash, err := HashPassword("")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if !CheckPassword("", hash) {
		t.Error("expected empty password check to pass")
	}
}
