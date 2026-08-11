package pkg

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func AddToPATH(installPath string) error {
	if installPath == "" {
		return fmt.Errorf("empty install path")
	}
	if runtime.GOOS == "windows" {
		return addToPathWindows(installPath)
	}
	return addToPathUnix(installPath)
}

func addToPathWindows(installPath string) error {
	escaped := strings.ReplaceAll(installPath, "'", "''")
	cmd := exec.Command("powershell", "-NoProfile", "-Command",
		fmt.Sprintf(`$p=[Environment]::GetEnvironmentVariable('Path','User'); if($p -notlike '*%s*'){[Environment]::SetEnvironmentVariable('Path', $p + ';%s', 'User')}`, escaped, escaped))
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to update PATH: %w", err)
	}
	return nil
}

func addToPathUnix(installPath string) error {
	home := GetUserHome()
	if home == "" {
		return fmt.Errorf("cannot determine home directory")
	}

	profile := preferredShellProfile(home)
	if profile == "" {
		return fmt.Errorf("无法确定 shell 配置文件")
	}

	pathExport := fmt.Sprintf("\nexport PATH=\"$PATH:%s\"\n", installPath)
	if content, err := os.ReadFile(profile); err == nil {
		if strings.Contains(string(content), pathExport) {
			return nil
		}
	}

	f, err := os.OpenFile(profile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(pathExport)
	return err
}

// preferredShellProfile 根据 $SHELL 选择配置文件（macOS 默认 zsh）。
func preferredShellProfile(home string) string {
	shell := os.Getenv("SHELL")
	switch {
	case strings.HasSuffix(shell, "zsh"):
		return filepath.Join(home, ".zshrc")
	case strings.HasSuffix(shell, "bash"):
		return filepath.Join(home, ".bashrc")
	}
	return filepath.Join(home, ".profile")
}

func IsInPATH(exeName string) bool {
	_, err := exec.LookPath(exeName)
	return err == nil
}
