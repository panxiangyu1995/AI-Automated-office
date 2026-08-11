package pkg

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestCopyFile(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "src.txt")
	dst := filepath.Join(dir, "dst.txt")
	content := "hello ao-cli"

	if err := os.WriteFile(src, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	if err := copyFile(src, dst); err != nil {
		t.Fatalf("copyFile failed: %v", err)
	}
	got, err := os.ReadFile(dst)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != content {
		t.Errorf("expected %q, got %q", content, string(got))
	}
}

func TestCopyFileMissingSource(t *testing.T) {
	dir := t.TempDir()
	err := copyFile(filepath.Join(dir, "nope"), filepath.Join(dir, "out"))
	if err == nil {
		t.Fatal("expected error for missing source")
	}
}

func TestInstallCLI(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	src := filepath.Join(dir, "ao-cli-src")
	if err := os.WriteFile(src, []byte("binary"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := InstallCLI(src); err != nil {
		t.Fatalf("InstallCLI failed: %v", err)
	}

	exe := GetAOCLIExeName()
	installed := filepath.Join(dir, AOCLIDirName, BinDirName, exe)
	info, err := os.Stat(installed)
	if err != nil {
		t.Fatalf("installed cli missing: %v", err)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm()&0111 == 0 {
		t.Errorf("installed cli is not executable: %v", info.Mode())
	}
}

func TestVerifyCLI(t *testing.T) {
	origHome := GetUserHome()
	t.Cleanup(func() { os.Setenv("HOME", origHome) })

	dir := t.TempDir()
	os.Setenv("HOME", dir)

	// not installed -> error
	if err := VerifyCLI(); err == nil {
		t.Error("expected error when cli not installed")
	}

	// install then verify
	src := filepath.Join(dir, "ao-cli-src")
	if err := os.WriteFile(src, []byte("binary"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := InstallCLI(src); err != nil {
		t.Fatal(err)
	}
	if err := VerifyCLI(); err != nil {
		t.Errorf("VerifyCLI failed after install: %v", err)
	}
}
