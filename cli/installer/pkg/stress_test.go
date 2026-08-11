package pkg

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

// TestConcurrentInstallDifferentHomes 并发安装到不同 HOME（race 检测）
func TestConcurrentInstallDifferentHomes(t *testing.T) {
	var wg sync.WaitGroup
	errs := make(chan error, 8)

	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			home := filepath.Join(t.TempDir(), fmt.Sprintf("home%d", n))
			if err := os.MkdirAll(home, 0755); err != nil {
				errs <- err
				return
			}
			os.Setenv("HOME", home)

			src := filepath.Join(home, "cli-src")
			if err := os.WriteFile(src, []byte("cli"), 0755); err != nil {
				errs <- err
				return
			}
			if err := Install(InstallOptions{
				InstallPath:   filepath.Join(home, ".ao-cli"),
				ServerURL:     fmt.Sprintf("http://localhost:%d", 9000+n),
				InstallSkills: true,
				AddToPath:     false,
				CLISource:     src,
				SkillSource:   filepath.Join(home, "missing-skill.skill"),
			}, nil); err != nil {
				errs <- fmt.Errorf("install %d: %w", n, err)
			}
		}(i)
	}
	wg.Wait()
	close(errs)

	for err := range errs {
		t.Errorf("concurrent install error: %v", err)
	}
}

// TestConcurrentInstallSameHome 并发安装到同一 HOME（幂等 + 无数据竞争）
func TestConcurrentInstallSameHome(t *testing.T) {
	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	content := []byte("SHARED-CLI")
	if err := os.WriteFile(src, content, 0755); err != nil {
		t.Fatal(err)
	}

	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			if err := Install(InstallOptions{
				InstallPath:   filepath.Join(home, ".ao-cli"),
				ServerURL:     "http://localhost:8080",
				InstallSkills: false,
				AddToPath:     false,
				CLISource:     src,
			}, nil); err != nil {
				t.Errorf("install %d: %v", n, err)
			}
		}(i)
	}
	wg.Wait()

	// 最终文件完整
	got, err := os.ReadFile(filepath.Join(home, ".ao-cli", "bin", GetAOCLIExeName()))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, content) {
		t.Error("cli binary corrupted after concurrent installs")
	}
}

// TestInstallHugeCLIBinary 压力：100MB 二进制复制
func TestInstallHugeCLIBinary(t *testing.T) {
	if testing.Short() {
		t.Skip("short mode")
	}
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	f, err := os.Create(src)
	if err != nil {
		t.Fatal(err)
	}
	chunk := make([]byte, 1024*1024)
	for i := range chunk {
		chunk[i] = byte(i % 251)
	}
	total := 100 * 1024 * 1024 // 100MB
	for written := 0; written < total; written += len(chunk) {
		if _, err := f.Write(chunk); err != nil {
			t.Fatal(err)
		}
	}
	f.Close()

	if err := Install(InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
	}, nil); err != nil {
		t.Fatalf("100MB install failed: %v", err)
	}

	info, err := os.Stat(filepath.Join(home, ".ao-cli", "bin", GetAOCLIExeName()))
	if err != nil {
		t.Fatal(err)
	}
	if info.Size() != int64(total) {
		t.Errorf("expected %d bytes, got %d", total, info.Size())
	}
}

// TestInstallWithSkillMissingSilentlyDrops 技能缺失不阻塞安装
func TestInstallWithSkillMissingSilentlyDrops(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("cli"), 0755); err != nil {
		t.Fatal(err)
	}

	err := Install(InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: true, // 请求安装技能
		AddToPath:     false,
		CLISource:     src,
		// SkillSource 为空 → 自动查找失败 → 跳过（不阻塞）
	}, nil)
	if err != nil {
		t.Fatalf("install should not fail on missing skill, got: %v", err)
	}
	if err := VerifyInstall(filepath.Join(home, ".ao-cli")); err != nil {
		t.Errorf("VerifyInstall failed: %v", err)
	}
}

// TestInstallSkillsFalseSkipsSkillStep 关闭技能安装时完全不触碰技能文件
func TestInstallSkillsFalseSkipsSkillStep(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	home := t.TempDir()
	os.Setenv("HOME", home)

	src := filepath.Join(t.TempDir(), "cli")
	if err := os.WriteFile(src, []byte("cli"), 0755); err != nil {
		t.Fatal(err)
	}

	err := Install(InstallOptions{
		InstallPath:   filepath.Join(home, ".ao-cli"),
		ServerURL:     "http://localhost:8080",
		InstallSkills: false,
		AddToPath:     false,
		CLISource:     src,
		SkillSource:   filepath.Join(home, "this-must-not-be-read.skill"),
	}, nil)
	if err != nil {
		t.Fatalf("install failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(home, ".ao-cli", "skills", SkillPackageName)); err == nil {
		t.Error("skill should NOT be installed when InstallSkills=false")
	}
}
