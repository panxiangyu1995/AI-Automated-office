package pkg

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestPreferredShellProfile(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix only")
	}

	origShell := os.Getenv("SHELL")
	t.Cleanup(func() { os.Setenv("SHELL", origShell) })

	home := t.TempDir()
	os.Setenv("SHELL", "/bin/zsh")
	if got := preferredShellProfile(home); got != filepath.Join(home, ".zshrc") {
		t.Errorf("zsh: expected .zshrc, got %s", got)
	}
	os.Setenv("SHELL", "/bin/bash")
	if got := preferredShellProfile(home); got != filepath.Join(home, ".bashrc") {
		t.Errorf("bash: expected .bashrc, got %s", got)
	}
	os.Setenv("SHELL", "")
	if got := preferredShellProfile(home); got != filepath.Join(home, ".profile") {
		t.Errorf("default: expected .profile, got %s", got)
	}
}

func TestAddToPathUnix(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix only")
	}

	origHome := GetUserHome()
	origShell := os.Getenv("SHELL")
	t.Cleanup(func() {
		os.Setenv("HOME", origHome)
		os.Setenv("SHELL", origShell)
	})

	dir := t.TempDir()
	os.Setenv("HOME", dir)
	os.Setenv("SHELL", "/bin/zsh")

	installPath := filepath.Join(dir, ".ao-cli", "bin")
	if err := AddToPATH(installPath); err != nil {
		t.Fatalf("AddToPATH failed: %v", err)
	}

	profile, err := os.ReadFile(filepath.Join(dir, ".zshrc"))
	if err != nil {
		t.Fatalf(".zshrc not written: %v", err)
	}
	if !strings.Contains(string(profile), installPath) {
		t.Errorf(".zshrc missing PATH entry: %s", string(profile))
	}

	// idempotent: second call does not duplicate
	if err := AddToPATH(installPath); err != nil {
		t.Fatal(err)
	}
	profile, _ = os.ReadFile(filepath.Join(dir, ".zshrc"))
	if strings.Count(string(profile), installPath) != 1 {
		t.Errorf("PATH entry duplicated: %s", string(profile))
	}
}

func TestAddToPATHEmptyPath(t *testing.T) {
	if err := AddToPATH(""); err == nil {
		t.Error("expected error for empty path")
	}
}
