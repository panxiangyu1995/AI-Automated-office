package pathhelper

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

func GOPATH() string {
	gopath := os.Getenv("GOPATH")
	if gopath != "" {
		return gopath
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return filepath.Join(home, "go")
}

func GOPATHBin() string {
	return filepath.Join(GOPATH(), "bin")
}

func IsInPATH(dir string) bool {
	pathEnv := os.Getenv("PATH")
	sep := string(os.PathListSeparator)
	for _, p := range strings.Split(pathEnv, sep) {
		if p == dir {
			return true
		}
	}
	return false
}

type ShellProfile struct {
	Name     string
	FilePath string
	Line     string
}

func DetectShellProfile() ShellProfile {
	home, err := os.UserHomeDir()
	if err != nil {
		return ShellProfile{}
	}

	switch runtime.GOOS {
	case "windows":
		return ShellProfile{
			Name:     "PowerShell",
			FilePath: psProfilePath(home),
			Line:     fmt.Sprintf(`$env:PATH = "%s;" + $env:PATH`, GOPATHBin()),
		}
	default:
		shell := os.Getenv("SHELL")
		switch {
		case strings.Contains(shell, "zsh"):
			return ShellProfile{
				Name:     "zsh",
				FilePath: filepath.Join(home, ".zshrc"),
				Line:     fmt.Sprintf(`export PATH="%s:$PATH"`, GOPATHBin()),
			}
		case strings.Contains(shell, "bash"):
			for _, f := range []string{".bash_profile", ".bashrc"} {
				p := filepath.Join(home, f)
				if _, err := os.Stat(p); err == nil {
					return ShellProfile{
						Name:     "bash",
						FilePath: p,
						Line:     fmt.Sprintf(`export PATH="%s:$PATH"`, GOPATHBin()),
					}
				}
			}
			return ShellProfile{
				Name:     "bash",
				FilePath: filepath.Join(home, ".bashrc"),
				Line:     fmt.Sprintf(`export PATH="%s:$PATH"`, GOPATHBin()),
			}
		case strings.Contains(shell, "fish"):
			return ShellProfile{
				Name:     "fish",
				FilePath: filepath.Join(home, ".config", "fish", "config.fish"),
				Line:     fmt.Sprintf(`set -gx PATH %s $PATH`, GOPATHBin()),
			}
		default:
			return ShellProfile{
				Name:     "sh",
				FilePath: filepath.Join(home, ".profile"),
				Line:     fmt.Sprintf(`export PATH="%s:$PATH"`, GOPATHBin()),
			}
		}
	}
}

func psProfilePath(home string) string {
	documents := filepath.Join(home, "Documents")
	psDir := filepath.Join(documents, "WindowsPowerShell")
	os.MkdirAll(psDir, 0755)
	return filepath.Join(psDir, "Microsoft.PowerShell_profile.ps1")
}

func EnsurePATH() (added bool, profile ShellProfile, err error) {
	gopathBin := GOPATHBin()
	if gopathBin == "" {
		return false, ShellProfile{}, fmt.Errorf("cannot determine GOPATH/bin")
	}

	if IsInPATH(gopathBin) {
		return false, ShellProfile{}, nil
	}

	profile = DetectShellProfile()
	if profile.FilePath == "" {
		return false, ShellProfile{}, fmt.Errorf("cannot detect shell profile")
	}

	if runtime.GOOS == "windows" {
		return ensureWindowsPATH(gopathBin, profile)
	}

	return ensureUnixPATH(gopathBin, profile)
}

func ensureUnixPATH(gopathBin string, profile ShellProfile) (bool, ShellProfile, error) {
	data, err := os.ReadFile(profile.FilePath)
	if err != nil && !os.IsNotExist(err) {
		return false, profile, fmt.Errorf("read %s: %w", profile.FilePath, err)
	}

	content := string(data)
	if strings.Contains(content, gopathBin) {
		os.Setenv("PATH", gopathBin+":"+os.Getenv("PATH"))
		return false, profile, nil
	}

	dir := filepath.Dir(profile.FilePath)
	os.MkdirAll(dir, 0755)

	f, err := os.OpenFile(profile.FilePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return false, profile, fmt.Errorf("open %s: %w", profile.FilePath, err)
	}
	defer f.Close()

	line := fmt.Sprintf("\n# Added by ao-cli\n%s\n", profile.Line)
	if _, err := f.WriteString(line); err != nil {
		return false, profile, fmt.Errorf("write %s: %w", profile.FilePath, err)
	}

	os.Setenv("PATH", gopathBin+":"+os.Getenv("PATH"))
	return true, profile, nil
}

func ensureWindowsPATH(gopathBin string, profile ShellProfile) (bool, ShellProfile, error) {
	data, err := os.ReadFile(profile.FilePath)
	if err != nil && !os.IsNotExist(err) {
		return false, profile, fmt.Errorf("read %s: %w", profile.FilePath, err)
	}

	content := string(data)
	if strings.Contains(content, gopathBin) {
		os.Setenv("PATH", gopathBin+";"+os.Getenv("PATH"))
		return false, profile, nil
	}

	dir := filepath.Dir(profile.FilePath)
	os.MkdirAll(dir, 0755)

	f, err := os.OpenFile(profile.FilePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return false, profile, fmt.Errorf("open %s: %w", profile.FilePath, err)
	}
	defer f.Close()

	line := fmt.Sprintf("\n# Added by ao-cli\n%s\n", profile.Line)
	if _, err := f.WriteString(line); err != nil {
		return false, profile, fmt.Errorf("write %s: %w", profile.FilePath, err)
	}

	os.Setenv("PATH", gopathBin+";"+os.Getenv("PATH"))
	return true, profile, nil
}
