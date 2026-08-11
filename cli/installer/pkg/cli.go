package pkg

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
)

var (
	AOCLIDirName  = ".ao-cli"
	BinDirName    = "bin"
	SkillsDirName = "skills"
	ConfigDirName = "config"
	SkillPackageName = "ai-office-api.skill"
)

func GetAOCLIDir() string {
	home := GetUserHome()
	if home == "" {
		return ""
	}
	return filepath.Join(home, AOCLIDirName)
}

func GetAOCLIBinDir() string {
	dir := GetAOCLIDir()
	if dir == "" {
		return ""
	}
	return filepath.Join(dir, BinDirName)
}

func GetAOCLISkillsDir() string {
	dir := GetAOCLIDir()
	if dir == "" {
		return ""
	}
	return filepath.Join(dir, SkillsDirName)
}

func GetAOCLIConfigDir() string {
	dir := GetAOCLIDir()
	if dir == "" {
		return ""
	}
	return filepath.Join(dir, ConfigDirName)
}

func GetAOCLIExeName() string {
	if runtime.GOOS == "windows" {
		return "ao-cli.exe"
	}
	return "ao-cli"
}

func GetAOCLIExePath() string {
	dir := GetAOCLIBinDir()
	if dir == "" {
		return ""
	}
	return filepath.Join(dir, GetAOCLIExeName())
}

func copyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return err
	}
	return dstFile.Sync()
}

func InstallCLI(srcPath string) error {
	binDir := GetAOCLIBinDir()
	if err := EnsureDir(binDir); err != nil {
		return fmt.Errorf("failed to create bin dir: %w", err)
	}

	dstPath := filepath.Join(binDir, GetAOCLIExeName())
	if err := copyFile(srcPath, dstPath); err != nil {
		return fmt.Errorf("failed to copy cli: %w", err)
	}

	if runtime.GOOS != "windows" {
		if err := os.Chmod(dstPath, 0755); err != nil {
			return fmt.Errorf("failed to set executable: %w", err)
		}
	}
	return nil
}

func VerifyCLI() error {
	if err := VerifyInstall(GetAOCLIDir()); err != nil {
		return err
	}
	return nil
}
