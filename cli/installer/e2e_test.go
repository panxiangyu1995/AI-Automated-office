package main

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/charmbracelet/bubbletea"
)

// TestInstallerEndToEnd 真实 TUI 全流程：
// 按键流驱动安装向导 → 真实安装到临时 HOME → 验证产物 → 退出
func TestInstallerEndToEnd(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix style test")
	}

	origHome := os.Getenv("HOME")
	origShell := os.Getenv("SHELL")
	origPath := os.Getenv("PATH")
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("SHELL", origShell)
		os.Setenv("PATH", origPath)
	})

	home := t.TempDir()
	os.Setenv("HOME", home)
	os.Setenv("SHELL", "/bin/zsh")

	// 构造可控 PATH：仅包含 fakebin（内含 ao-cli），确保 findCLISource 命中
	fakeBin := filepath.Join(home, "fakebin")
	if err := os.MkdirAll(fakeBin, 0755); err != nil {
		t.Fatal(err)
	}
	cliContent := []byte("FAKE-AO-CLI-E2E")
	if err := os.WriteFile(filepath.Join(fakeBin, "ao-cli"), cliContent, 0755); err != nil {
		t.Fatal(err)
	}
	os.Setenv("PATH", fakeBin)

	// 输入管道：先发 空格+回车 完成 许可→路径→服务器→选项，等安装完成后发回车退出
	pr, pw := io.Pipe()
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer pw.Close()
		keys := []byte{' ', '\r', '\r', '\r'} // 许可 / 路径 / 服务器 / 选项
		if _, err := pw.Write(keys); err != nil {
			t.Errorf("send keys: %v", err)
			return
		}
		// 等待安装完成（轮询 ~/.ao-cli/bin/ao-cli）
		deadline := time.Now().Add(15 * time.Second)
		for time.Now().Before(deadline) {
			if _, err := os.Stat(filepath.Join(home, ".ao-cli", "bin", "ao-cli")); err == nil {
				break
			}
			time.Sleep(100 * time.Millisecond)
		}
		pw.Write([]byte{'\r'}) // 完成界面退出
	}()

	err := RunInstaller(context.Background(), tea.WithInput(pr), tea.WithoutRenderer())
	wg.Wait()
	if err != nil {
		t.Fatalf("RunInstaller failed: %v", err)
	}

	// ---- 验证安装产物 ----
	// 1. ao-cli 安装（内容来自 fakebin 而非 installer 自身）
	installed, err := os.ReadFile(filepath.Join(home, ".ao-cli", "bin", "ao-cli"))
	if err != nil {
		t.Fatalf("ao-cli not installed: %v", err)
	}
	if string(installed) != string(cliContent) {
		t.Errorf("installed cli content mismatch: %q", string(installed))
	}

	// 2. 服务器配置
	cfg, err := os.ReadFile(filepath.Join(home, ".ai-office-cli", "config.yaml"))
	if err != nil {
		t.Fatalf("server config missing: %v", err)
	}
	if !strings.Contains(string(cfg), "server_url: http://localhost:8080") {
		t.Errorf("bad server config: %s", string(cfg))
	}

	// 3. PATH 写入 .zshrc
	zshrc, err := os.ReadFile(filepath.Join(home, ".zshrc"))
	if err != nil {
		t.Fatalf(".zshrc not written: %v", err)
	}
	if !strings.Contains(string(zshrc), filepath.Join(home, ".ao-cli", "bin")) {
		t.Errorf("PATH not added: %s", string(zshrc))
	}

	// 4. 目录结构完整
	for _, sub := range []string{"bin", "config", "skills"} {
		if _, err := os.Stat(filepath.Join(home, ".ao-cli", sub)); err != nil {
			t.Errorf("missing dir %s: %v", sub, err)
		}
	}
}

// TestInstallerEndToEnd_FailureShowsRetry 安装失败 → 错误提示 → 回车返回选项 → Ctrl+C 退出
func TestInstallerEndToEnd_FailureShowsRetry(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix style test")
	}

	origHome := os.Getenv("HOME")
	origShell := os.Getenv("SHELL")
	origPath := os.Getenv("PATH")
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("SHELL", origShell)
		os.Setenv("PATH", origPath)
	})

	home := t.TempDir()
	os.Setenv("HOME", home)
	os.Setenv("SHELL", "/bin/zsh")

	// 空 PATH → findCLISource 必然失败 → 安装失败
	os.Setenv("PATH", t.TempDir())

	pr, pw := io.Pipe()
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer pw.Close()
		// 许可 → 路径 → 服务器 → 选项 → 安装（失败）
		pw.Write([]byte{' ', '\r', '\r', '\r'})
		time.Sleep(3 * time.Second)
		// 失败后回车 → 返回选项（step 3）
		pw.Write([]byte{'\r'})
		time.Sleep(500 * time.Millisecond)
		// Ctrl+C 退出
		pw.Write([]byte{3}) // ETX
	}()

	err := RunInstaller(context.Background(), tea.WithInput(pr), tea.WithoutRenderer())
	wg.Wait()
	if err != nil {
		t.Fatalf("expected graceful exit via ctrl+c, got: %v", err)
	}

	// 失败时不应留下完整安装
	if _, err := os.Stat(filepath.Join(home, ".ao-cli", "bin", "ao-cli")); err == nil {
		t.Error("failed install should not leave ao-cli behind")
	}
}
