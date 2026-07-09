package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSaveAndLoad(t *testing.T) {
	// Use a temp dir so we don't pollute real home
	tmpHome := t.TempDir()
	t.Setenv("HOME", tmpHome)

	cfg := &Config{
		ServerURL: "http://localhost:8080",
		Token:     "test-token-123",
		Email:     "test@example.com",
		Host:      "localhost:8080",
	}

	if err := Save(cfg); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded, err := Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if loaded.Token != "test-token-123" {
		t.Errorf("expected token test-token-123, got %s", loaded.Token)
	}
	if loaded.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", loaded.Email)
	}
	if loaded.ServerURL != "http://localhost:8080" {
		t.Errorf("expected server URL, got %s", loaded.ServerURL)
	}
}

func TestClear(t *testing.T) {
	tmpHome := t.TempDir()
	t.Setenv("HOME", tmpHome)

	cfg := &Config{ServerURL: "http://localhost:8080", Token: "tok", Email: "e@e.com", Host: "h"}
	Save(cfg)

	if err := Clear(); err != nil {
		t.Fatalf("Clear failed: %v", err)
	}

	if _, err := Load(); !os.IsNotExist(err) {
		t.Error("expected not-exist error after clear")
	}
}

func TestConfigDir_CreatesDir(t *testing.T) {
	tmpHome := t.TempDir()
	t.Setenv("HOME", tmpHome)

	path, err := configDir()
	if err != nil {
		t.Fatalf("configDir failed: %v", err)
	}

	expected := filepath.Join(tmpHome, ".ai-office-cli")
	if path != expected {
		t.Errorf("expected %s, got %s", expected, path)
	}

	if _, err := os.Stat(expected); os.IsNotExist(err) {
		t.Error("config directory was not created")
	}
}
