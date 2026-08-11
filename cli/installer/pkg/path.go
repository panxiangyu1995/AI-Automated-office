package pkg

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func AddToPATH(installPath string) error {
	if runtime.GOOS == "windows" {
		return addToPathWindows(installPath)
	}
	return addToPathUnix(installPath)
}

func addToPathWindows(installPath string) error {
	cmd := exec.Command("powershell", "-NoProfile", "-Command",
		fmt.Sprintf(`[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';%s', 'User')`, installPath))
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to update PATH: %w", err)
	}
	return nil
}

func addToPathUnix(installPath string) error {
	shellProfile := os.Getenv("HOME") + "/.profile"
	content, err := os.ReadFile(shellProfile)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	pathExport := fmt.Sprintf("\nexport PATH=\"$PATH:%s\"\n", installPath)
	if strings.Contains(string(content), pathExport) {
		return nil
	}

	f, err := os.OpenFile(shellProfile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(pathExport)
	return err
}

func IsInPATH(exeName string) bool {
	_, err := exec.LookPath(exeName)
	return err == nil
}
