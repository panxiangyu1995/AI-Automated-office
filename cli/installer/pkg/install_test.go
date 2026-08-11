package pkg

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestInstall(t *testing.T) {
	origHome := GetUserHome()
	origShell := os.Getenv("SHELL")
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("SHELL", origShell)
	})

	home := t.TempDir()
	os.Setenv("HOME", home)
	if runtime.GOOS != "windows" {
		os.Setenv("SHELL", "/bin/zsh")
	}

	// 模拟 zip 解压布局：ao-cli 与 ao-setup 同目录
	execDir := t.TempDir()
	fakeExec := filepath.Join(execDir, "ao-setup")
	if err := os.WriteFile(fakeExec, []byte("setup"), 0755); err != nil {
		t.Fatal(err)
	}
	fakeCLI := filepath.Join(execDir, GetAOCLIExeName())
	if err := os.WriteFile(fakeCLI, []byte("real-cli-binary"), 0755); err != nil {
		t.Fatal(err)
	}
	// skills 与安装程序同目录
	skillSrc := filepath.Join(execDir, SkillPackageName)
	if err := os.WriteFile(skillSrc, []byte("skill"), 0644); err != nil {
		t.Fatal(err)
	}

	installPath := filepath.Join(home, ".ao-cli")
	opts := InstallOptions{
		InstallPath:   installPath,
		ServerURL:     "https://office.example.com",
		InstallSkills: true,
		AddToPath:     true,
		CLISource:     fakeCLI,
		SkillSource:   skillSrc,
	}

	var stages []string
	if err := Install(opts, func(stage string, _ float64) {
		stages = append(stages, stage)
	}); err != nil {
		t.Fatalf("Install failed: %v", err)
	}

	// 1. ao-cli 复制自同目录（非 installer 自身）
	cliBytes, err := os.ReadFile(filepath.Join(installPath, "bin", GetAOCLIExeName()))
	if err != nil {
		t.Fatalf("ao-cli not installed: %v", err)
	}
	if string(cliBytes) != "real-cli-binary" {
		t.Errorf("installed cli content mismatch (got installer self?): %q", string(cliBytes))
	}

	// 2. 配置写入 ~/.ai-office-cli/config.yaml
	cfgData, err := os.ReadFile(filepath.Join(home, ".ai-office-cli", "config.yaml"))
	if err != nil {
		t.Fatalf("server config not written: %v", err)
	}
	if !strings.Contains(string(cfgData), "server_url: https://office.example.com") {
		t.Errorf("bad server config: %s", string(cfgData))
	}

	// 3. skills 安装
	if _, err := os.Stat(filepath.Join(installPath, "skills", SkillPackageName)); err != nil {
		t.Errorf("skill not installed: %v", err)
	}

	// 4. PATH 更新（unix）
	if runtime.GOOS != "windows" {
		profileData, err := os.ReadFile(filepath.Join(home, ".zshrc"))
		if err != nil {
			t.Fatalf(".zshrc not written: %v", err)
		}
		if !strings.Contains(string(profileData), installPath) {
			t.Errorf("PATH not updated: %s", string(profileData))
		}
	}

	// 5. 进度回调覆盖全部阶段
	if len(stages) == 0 {
		t.Error("progress callback never invoked")
	}

	// 6. VerifyInstall 通过
	if err := VerifyInstall(installPath); err != nil {
		t.Errorf("VerifyInstall failed: %v", err)
	}
}

func TestInstallMissingCLI(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	opts := InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     filepath.Join(t.TempDir(), "missing-ao-cli"),
	}
	if err := Install(opts, nil); err == nil {
		t.Error("expected error when ao-cli binary not found")
	}
}

func TestDefaultInstallPath(t *testing.T) {
	p := DefaultInstallPath()
	if p == "" {
		t.Error("default install path is empty")
	}
	if filepath.Base(p) != AOCLIDirName {
		t.Errorf("default path should end with %s, got %s", AOCLIDirName, p)
	}
}
