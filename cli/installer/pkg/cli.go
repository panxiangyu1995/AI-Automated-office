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
	return filepath.Join(GetUserHome(), AOCLIDirName)
}

func GetAOCLIBinDir() string {
	return filepath.Join(GetAOCLIDir(), BinDirName)
}

func GetAOCLISkillsDir() string {
	return filepath.Join(GetAOCLIDir(), SkillsDirName)
}

func GetAOCLIConfigDir() string {
	return filepath.Join(GetAOCLIDir(), ConfigDirName)
}

func GetAOCLIExeName() string {
	if runtime.GOOS == "windows" {
		return "ao-cli.exe"
	}
	return "ao-cli"
}

func GetAOCLIExePath() string {
	return filepath.Join(GetAOCLIBinDir(), GetAOCLIExeName())
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
