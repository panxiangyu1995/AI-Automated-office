package pkg

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWriteServerConfig(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	serverURL := "https://office.example.com"
	if err := WriteServerConfig(serverURL); err != nil {
		t.Fatalf("WriteServerConfig failed: %v", err)
	}

	configFile := filepath.Join(dir, ".ai-office-cli", "config.yaml")
	data, err := os.ReadFile(configFile)
	if err != nil {
		t.Fatalf("config not written: %v", err)
	}
	if !strings.Contains(string(data), "server_url: https://office.example.com") {
		t.Errorf("config missing server_url, got: %s", string(data))
	}
}

func TestWriteServerConfigEmptyHome(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("USERPROFILE", origHome)
	})
	os.Setenv("HOME", "")
	os.Setenv("USERPROFILE", "")

	if err := WriteServerConfig("http://localhost:8080"); err == nil {
		t.Error("expected error when home directory unavailable")
	}
}

func TestWriteOpenCodeConfig(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	skillsPath := filepath.Join(dir, ".ao-cli", "skills")
	if err := WriteOpenCodeConfig(skillsPath); err != nil {
		t.Fatalf("WriteOpenCodeConfig failed: %v", err)
	}

	configFile := GetOpenCodeConfigPath()
	data, err := os.ReadFile(configFile)
	if err != nil {
		t.Fatalf("opencode.json not written: %v", err)
	}
	if !strings.Contains(string(data), ".ao-cli/skills") {
		t.Errorf("opencode.json missing skills path, got: %s", string(data))
	}

	// second call should not duplicate
	if err := WriteOpenCodeConfig(skillsPath); err != nil {
		t.Fatal(err)
	}
	data, _ = os.ReadFile(configFile)
	if strings.Count(string(data), ".ao-cli/skills") != 1 {
		t.Errorf("skills path duplicated: %s", string(data))
	}
}
