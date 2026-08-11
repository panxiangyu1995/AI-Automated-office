package pkg

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// ---------- copyFile 边界 ----------

func TestCopyFileLargeFile(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "large.bin")
	dst := filepath.Join(dir, "large-copy.bin")

	// 20MB 随机数据
	data := make([]byte, 20*1024*1024)
	if _, err := rand.Read(data); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(src, data, 0644); err != nil {
		t.Fatal(err)
	}

	if err := copyFile(src, dst); err != nil {
		t.Fatalf("copyFile(20MB) failed: %v", err)
	}

	got, err := os.ReadFile(dst)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, data) {
		t.Error("20MB copy content mismatch")
	}
}

func TestCopyFileEmptyFile(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "empty")
	dst := filepath.Join(dir, "empty-copy")
	if err := os.WriteFile(src, nil, 0644); err != nil {
		t.Fatal(err)
	}
	if err := copyFile(src, dst); err != nil {
		t.Fatalf("copyFile(empty) failed: %v", err)
	}
	info, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	if info.Size() != 0 {
		t.Errorf("expected empty dst, got %d bytes", info.Size())
	}
}

func TestCopyFileDstIsDirectory(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "src.txt")
	dst := filepath.Join(dir, "subdir") // 目录
	if err := os.WriteFile(src, []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(dst, 0755); err != nil {
		t.Fatal(err)
	}
	if err := copyFile(src, dst); err == nil {
		t.Error("expected error when dst is a directory")
	}
}

func TestCopyFileSrcIsDirectory(t *testing.T) {
	dir := t.TempDir()
	sub := filepath.Join(dir, "sub")
	if err := os.Mkdir(sub, 0755); err != nil {
		t.Fatal(err)
	}
	if err := copyFile(sub, filepath.Join(dir, "out")); err == nil {
		t.Error("expected error when src is a directory")
	}
}

// ---------- InstallCLI 边界 ----------

func TestInstallCLIOverwriteExisting(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 预置旧版本
	binDir := filepath.Join(home, AOCLIDirName, BinDirName)
	if err := EnsureDir(binDir); err != nil {
		t.Fatal(err)
	}
	old := filepath.Join(binDir, GetAOCLIExeName())
	if err := os.WriteFile(old, []byte("OLD-VERSION"), 0755); err != nil {
		t.Fatal(err)
	}

	// 安装新版本覆盖
	newSrc := filepath.Join(home, "new-cli")
	if err := os.WriteFile(newSrc, []byte("NEW-VERSION"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := InstallCLI(newSrc); err != nil {
		t.Fatalf("InstallCLI overwrite failed: %v", err)
	}
	got, _ := os.ReadFile(old)
	if string(got) != "NEW-VERSION" {
		t.Errorf("expected overwrite with NEW-VERSION, got %q", string(got))
	}
}

func TestInstallCLIUnreadableSource(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 不存在的源
	if err := InstallCLI(filepath.Join(home, "does-not-exist")); err == nil {
		t.Error("expected error for missing source file")
	}
}

func TestInstallCLIInvalidHome(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("USERPROFILE", origHome)
	})
	os.Setenv("HOME", "")
	os.Setenv("USERPROFILE", "")

	// bin 目录无法解析 → 应报错而非 panic
	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := InstallCLI(src); err == nil {
		t.Error("expected error when home directory unavailable")
	}
}

// ---------- VerifyInstall 边界 ----------

func TestVerifyInstallEdgeCases(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 空路径
	if err := VerifyInstall(""); err == nil {
		t.Error("expected error for empty install path")
	}

	// 路径是文件而非目录
	file := filepath.Join(home, "afile")
	if err := os.WriteFile(file, []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := VerifyInstall(file); err == nil {
		t.Error("expected error when install path is a file")
	}

	// 未安装
	if err := VerifyInstall(filepath.Join(home, "no-such-dir")); err == nil {
		t.Error("expected error when not installed")
	}

	// bin/ao-cli 是目录
	installPath := filepath.Join(home, ".ao-cli")
	binDir := filepath.Join(installPath, "bin")
	if err := EnsureDir(binDir); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(binDir, GetAOCLIExeName()), 0755); err != nil {
		t.Fatal(err)
	}
	if err := VerifyInstall(installPath); err == nil {
		t.Error("expected error when cli path is a directory")
	}
}

// ---------- 深路径 / 超长路径 ----------

func TestInstallDeepPath(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	// 多级嵌套安装路径
	home := t.TempDir()
	os.Setenv("HOME", home)
	deep := filepath.Join(home, strings.Repeat("level/", 20), ".ao-cli")

	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("x"), 0755); err != nil {
		t.Fatal(err)
	}

	opts := InstallOptions{
		InstallPath:   deep,
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
	}
	if err := Install(opts, nil); err != nil {
		t.Fatalf("Install(deep path) failed: %v", err)
	}
}

func TestInstallVeryLongPath(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 超长目录名（macOS 单段最多 255 字节）→ 应返回错误而非 panic
	longName := strings.Repeat("a", 260)
	badPath := filepath.Join(home, longName)

	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("x"), 0755); err != nil {
		t.Fatal(err)
	}

	err := Install(InstallOptions{
		InstallPath:   badPath,
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
	}, nil)
	if err == nil {
		// 部分文件系统可能允许超长路径（宽松检查：若成功则验证目录确实创建）
		if _, statErr := os.Stat(badPath); statErr != nil {
			t.Errorf("path should exist if no error, got %v", statErr)
		}
	}
}

// ---------- 进度回调边界 ----------

func TestInstallProgressCallback(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("x"), 0755); err != nil {
		t.Fatal(err)
	}

	var stages []string
	var progressValues []float64
	err := Install(InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
	}, func(stage string, p float64) {
		stages = append(stages, stage)
		progressValues = append(progressValues, p)
	})
	if err != nil {
		t.Fatalf("Install failed: %v", err)
	}

	// 每个阶段至少回调一次，最后进度必须为 1.0
	if len(stages) == 0 {
		t.Fatal("no progress callbacks")
	}
	if last := progressValues[len(progressValues)-1]; last != 1.0 {
		t.Errorf("final progress should be 1.0, got %v", last)
	}

	// 进度单调不减
	for i := 1; i < len(progressValues); i++ {
		if progressValues[i] < progressValues[i-1] {
			t.Errorf("progress decreased: %v -> %v", progressValues[i-1], progressValues[i])
		}
	}

	// 阶段名非空
	for _, s := range stages {
		if strings.TrimSpace(s) == "" {
			t.Error("empty stage name in progress callback")
		}
	}
}

func TestInstallFailureStopsProgress(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 缺失 CLISource → 安装应中途失败，进度回调应已发出至少一个阶段
	var stages []string
	err := Install(InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     filepath.Join(t.TempDir(), "missing"),
	}, func(stage string, _ float64) {
		stages = append(stages, stage)
	})
	if err == nil {
		t.Fatal("expected install failure")
	}
	if len(stages) == 0 {
		t.Error("expected at least one progress callback before failure")
	}
	if !strings.Contains(err.Error(), "安装 ao-cli") {
		t.Errorf("error should identify failing stage, got: %v", err)
	}
}

// ---------- 特殊字符 ----------

func TestInstallPathWithSpacesAndUnicode(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	// 安装路径含空格 + 中文
	installPath := filepath.Join(home, "我的 办公 目录", ".ao-cli")
	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("x"), 0755); err != nil {
		t.Fatal(err)
	}

	if err := Install(InstallOptions{
		InstallPath:   installPath,
		ServerURL:     "https://企业.办公/",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
	}, nil); err != nil {
		t.Fatalf("Install(path with spaces/unicode) failed: %v", err)
	}

	// 验证配置写入正确（特殊 URL）
	cfg, err := os.ReadFile(filepath.Join(home, ".ai-office-cli", "config.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(cfg), "server_url: https://企业.办公/") {
		t.Errorf("unicode server URL not preserved: %s", string(cfg))
	}
}

// ---------- 压力：重复安装 ----------

func TestRepeatedInstallIdempotent(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	content := []byte("CLI-BINARY-V2")
	if err := os.WriteFile(src, content, 0755); err != nil {
		t.Fatal(err)
	}

	installPath := filepath.Join(home, ".ao-cli")
	for i := 0; i < 10; i++ {
		err := Install(InstallOptions{
			InstallPath:   installPath,
			ServerURL:     fmt.Sprintf("http://localhost:%d", 8000+i),
			InstallSkills: false,
			AddToPath:     false,
			CLISource:     src,
		}, nil)
		if err != nil {
			t.Fatalf("install iteration %d failed: %v", i, err)
		}
	}

	// 内容正确且无残留
	got, err := os.ReadFile(filepath.Join(installPath, "bin", GetAOCLIExeName()))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, content) {
		t.Error("binary corrupted after repeated installs")
	}

	// PATH 幂等：重复安装不产生重复条目（SHELL=zsh 场景由 path_test 覆盖，这里验证无重复行）
	cfgPath := filepath.Join(home, ".ai-office-cli", "config.yaml")
	cfgData, err := os.ReadFile(cfgPath)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Count(string(cfgData), "server_url:") != 1 {
		t.Errorf("config duplicated after repeated installs: %s", string(cfgData))
	}
}
