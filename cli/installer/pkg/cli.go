package pkg

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

var (
	AOCLIDirName  = ".ao-cli"
	BinDirName    = "bin"
	SkillsDirName = "skills"
	ConfigDirName = "config"
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

func InstallCLI(srcPath string) error {
	binDir := GetAOCLIBinDir()
	if err := EnsureDir(binDir); err != nil {
		return fmt.Errorf("failed to create bin dir: %w", err)
	}

	dstPath := filepath.Join(binDir, GetAOCLIExeName())
	if err := copyFile(srcPath, dstPath); err != nil {
		return fmt.Errorf("failed to copy cli: %w", err)
	}

	if err := os.Chmod(dstPath, 0755); err != nil {
		return fmt.Errorf("failed to set executable: %w", err)
	}

	return nil
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

	buf := make([]byte, 32*1024)
	for {
		n, err := srcFile.Read(buf)
		if n > 0 {
			if _, werr := dstFile.Write(buf[:n]); werr != nil {
				return werr
			}
		}
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return err
		}
	}
	return nil
}

func VerifyCLI() error {
	exePath := GetAOCLIExePath()
	if _, err := os.Stat(exePath); err != nil {
		return fmt.Errorf("cli not found at %s: %w", exePath, err)
	}
	return nil
}
