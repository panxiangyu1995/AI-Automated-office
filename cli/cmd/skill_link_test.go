package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// withTempHome 设置 HOME 并返回清理函数
func withTempHome(t *testing.T) string {
	t.Helper()
	orig := os.Getenv("HOME")
	home := t.TempDir()
	os.Setenv("HOME", home)
	t.Cleanup(func() { os.Setenv("HOME", orig) })
	return home
}

// setupAgentSkills 创建已知 agent 的 skills 目录
func setupAgentSkills(t *testing.T, home string, agentDirs []string) {
	t.Helper()
	for _, dir := range agentDirs {
		p := filepath.Join(home, dir, "skills")
		if err := os.MkdirAll(p, 0755); err != nil {
			t.Fatal(err)
		}
	}
}

func TestRunSkillLink_NoSkillsDir(t *testing.T) {
	withTempHome(t)
	err := runSkillLink(nil, nil)
	if err == nil {
		t.Fatal("expected error when ~/.ao-cli/skills missing")
	}
	if !strings.Contains(err.Error(), ".ao-cli") {
		t.Errorf("error should mention skills dir: %v", err)
	}
}

func TestRunSkillLink_EmptySkillsDir(t *testing.T) {
	home := withTempHome(t)
	if err := os.MkdirAll(filepath.Join(home, ".ao-cli", "skills"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := runSkillLink(nil, nil); err != nil {
		t.Fatalf("empty skills dir should be OK (no deploy), got: %v", err)
	}
}

func TestRunSkillLink_DeploysToAllAgents(t *testing.T) {
	home := withTempHome(t)
	setupAgentSkills(t, home, []string{".config/opencode", ".claude"})

	// 创建技能文件
	skillsDir := filepath.Join(home, ".ao-cli", "skills")
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(skillsDir, "ai-office-api.skill"), []byte("skill-data"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := runSkillLink(nil, nil); err != nil {
		t.Fatalf("runSkillLink failed: %v", err)
	}

	// 验证部署到两个 agent
	for _, dir := range []string{".config/opencode", ".claude"} {
		got, err := os.ReadFile(filepath.Join(home, dir, "skills", "ai-office-api.skill"))
		if err != nil {
			t.Fatalf("skill not deployed to %s: %v", dir, err)
		}
		if string(got) != "skill-data" {
			t.Errorf("skill content mismatch at %s", dir)
		}
	}
}

func TestRunSkillLink_IgnoresNonSkillFiles(t *testing.T) {
	home := withTempHome(t)
	setupAgentSkills(t, home, []string{".config/opencode"})

	skillsDir := filepath.Join(home, ".ao-cli", "skills")
	os.MkdirAll(skillsDir, 0755)
	os.WriteFile(filepath.Join(skillsDir, "notes.txt"), []byte("not a skill"), 0644)
	os.WriteFile(filepath.Join(skillsDir, "other.skill"), []byte("skill2"), 0644)

	if err := runSkillLink(nil, nil); err != nil {
		t.Fatalf("runSkillLink failed: %v", err)
	}

	// notes.txt 不应部署
	if _, err := os.Stat(filepath.Join(home, ".config/opencode", "skills", "notes.txt")); err == nil {
		t.Error("non-skill file should not be deployed")
	}
	// other.skill 应部署
	if _, err := os.Stat(filepath.Join(home, ".config/opencode", "skills", "other.skill")); err != nil {
		t.Error("other.skill should be deployed")
	}
}

func TestRunSkillLink_CreatesMissingAgentDirs(t *testing.T) {
	home := withTempHome(t)
	// 不预创建 agent 目录 —— link 应自动创建

	skillsDir := filepath.Join(home, ".ao-cli", "skills")
	os.MkdirAll(skillsDir, 0755)
	os.WriteFile(filepath.Join(skillsDir, "x.skill"), []byte("x"), 0644)

	if err := runSkillLink(nil, nil); err != nil {
		t.Fatalf("link should create agent dirs, got: %v", err)
	}
	if _, err := os.Stat(filepath.Join(home, ".config/opencode", "skills", "x.skill")); err != nil {
		t.Errorf("skill not deployed to created dir: %v", err)
	}
}

func TestRunSkillUnlink_RemovesSkill(t *testing.T) {
	home := withTempHome(t)
	setupAgentSkills(t, home, []string{".config/opencode"})

	// 预置技能
	target := filepath.Join(home, ".config/opencode", "skills", "ai-office-api.skill")
	os.MkdirAll(filepath.Dir(target), 0755)
	os.WriteFile(target, []byte("x"), 0644)

	if err := runSkillUnlink(nil, []string{"ai-office-api.skill"}); err != nil {
		t.Fatalf("unlink failed: %v", err)
	}
	if _, err := os.Stat(target); err == nil {
		t.Error("skill should be removed")
	}
}

func TestRunSkillUnlink_MissingSkill(t *testing.T) {
	home := withTempHome(t)
	setupAgentSkills(t, home, []string{".config/opencode"})

	if err := runSkillUnlink(nil, []string{"not-deployed.skill"}); err != nil {
		t.Fatalf("unlink of missing skill should be silent OK, got: %v", err)
	}
}

func TestRunSkillUnlink_InvalidArgCount(t *testing.T) {
	withTempHome(t)
	// cobra.ExactArgs(1) 由 Args 校验；直接调用无 args 应返回错误而非 panic
	err := runSkillUnlink(nil, nil)
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

func TestDeploySkillToAgents_NoWritableDirs(t *testing.T) {
	home := withTempHome(t)
	// 无任何 agent 目录且无法创建（HOME 只读）—— 构造失败场景：
	// 直接指向不可写路径
	skillPath := filepath.Join(home, "s.skill")
	os.WriteFile(skillPath, []byte("x"), 0644)

	// 把 HOME 改成不可写目录
	roHome := filepath.Join(home, "ro")
	os.MkdirAll(roHome, 0555)
	os.Setenv("HOME", roHome)

	err := deploySkillToAgents(skillPath, roHome)
	if err == nil {
		t.Error("expected error when no writable agent dirs")
	}
	os.Chmod(roHome, 0755)
}

func TestRunSkillLink_UnreadableSourceSkill(t *testing.T) {
	home := withTempHome(t)
	setupAgentSkills(t, home, []string{".config/opencode"})

	skillsDir := filepath.Join(home, ".ao-cli", "skills")
	os.MkdirAll(skillsDir, 0755)
	os.WriteFile(filepath.Join(skillsDir, "broken.skill"), []byte("x"), 0644)
	os.Chmod(filepath.Join(skillsDir, "broken.skill"), 0000)

	// 不应 panic
	if err := runSkillLink(nil, nil); err != nil {
		// 允许返回错误或降级
		t.Logf("link returned: %v", err)
	}
	os.Chmod(filepath.Join(skillsDir, "broken.skill"), 0644)
}
