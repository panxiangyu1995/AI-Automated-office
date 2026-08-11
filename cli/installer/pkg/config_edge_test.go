package pkg

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWriteOpenCodeConfig_PreservesOtherFields(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	// 预置带其他字段的 opencode.json
	configPath := GetOpenCodeConfigPath()
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		t.Fatal(err)
	}
	existing := `{"$schema":"https://opencode.ai/config.json","model":"gpt-4o","skills":{"paths":["/custom/path"]}}`
	if err := os.WriteFile(configPath, []byte(existing), 0644); err != nil {
		t.Fatal(err)
	}

	skillsPath := filepath.Join(dir, ".ao-cli", "skills")
	if err := WriteOpenCodeConfig(skillsPath); err != nil {
		t.Fatalf("WriteOpenCodeConfig failed: %v", err)
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatal(err)
	}
	content := string(data)
	if !strings.Contains(content, `"model": "gpt-4o"`) {
		t.Errorf("existing fields lost: %s", content)
	}
	if !strings.Contains(content, "/custom/path") {
		t.Errorf("existing skills path lost: %s", content)
	}
	if !strings.Contains(content, skillsPath) {
		t.Errorf("new skills path missing: %s", content)
	}
}

func TestWriteOpenCodeConfig_CorruptExisting(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	configPath := GetOpenCodeConfigPath()
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		t.Fatal(err)
	}
	// 损坏的 JSON —— 应拒绝覆盖而非静默损坏
	if err := os.WriteFile(configPath, []byte("{not-json"), 0644); err != nil {
		t.Fatal(err)
	}

	err := WriteOpenCodeConfig(filepath.Join(dir, ".ao-cli", "skills"))
	if err == nil {
		t.Fatal("expected error for corrupt existing config (refuse to overwrite)")
	}
	// 原文件保留
	got, _ := os.ReadFile(configPath)
	if string(got) != "{not-json" {
		t.Error("corrupt config should be preserved")
	}
}

func TestWriteServerConfig_OverwritesOldValue(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	if err := WriteServerConfig("http://old.example.com"); err != nil {
		t.Fatal(err)
	}
	if err := WriteServerConfig("https://new.example.com"); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(filepath.Join(dir, ".ai-office-cli", "config.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "server_url: https://new.example.com") {
		t.Errorf("config should be overwritten with new URL: %s", string(data))
	}
	if strings.Contains(string(data), "old.example.com") {
		t.Errorf("old URL should be gone: %s", string(data))
	}
}

func TestWriteServerConfig_EmptyURL(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	if err := WriteServerConfig(""); err != nil {
		t.Fatalf("empty URL should be written (validation at TUI layer), got: %v", err)
	}
}

func TestDeploySkillsToOpenCode(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	archive := makeZip(t, map[string]string{"SKILL.md": "# s"})
	if err := DeploySkillsToOpenCode([]string{archive}); err != nil {
		t.Fatalf("deploy failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, ".config", "opencode", "skills", "SKILL.md")); err != nil {
		t.Errorf("skill not deployed to opencode: %v", err)
	}
}

func TestDeploySkillsToAgents(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	archive := makeZip(t, map[string]string{"SKILL.md": "# s"})
	agents := []AgentInfo{
		{Name: "OpenCode", Dir: ".config/opencode", Skills: "skills"},
		{Name: "Claude Code", Dir: ".claude", Skills: "skills"},
	}
	if err := DeploySkillsToAgents([]string{archive}, agents); err != nil {
		t.Fatalf("deploy failed: %v", err)
	}
	for _, a := range agents {
		if _, err := os.Stat(filepath.Join(dir, a.Dir, a.Skills, "SKILL.md")); err != nil {
			t.Errorf("not deployed to %s: %v", a.Name, err)
		}
	}
}
