package pkg

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type InstallOptions struct {
	InstallPath   string
	ServerURL     string
	InstallSkills bool
	AddToPath     bool

	// CLISource 显式指定 ao-cli 源文件路径；为空时自动查找
	// （安装程序同目录 → 父目录 → PATH）。
	CLISource string
	// SkillSource 显式指定技能包路径；为空时自动查找。
	SkillSource string
}

// ProgressFunc 安装阶段进度回调（stage 名称 + 0~1 进度）。
type ProgressFunc func(stage string, progress float64)

func DefaultInstallPath() string {
	return GetAOCLIDir()
}

// Install 执行完整的用户级安装流程。
func Install(opts InstallOptions, onProgress ProgressFunc) error {
	steps := []struct {
		name string
		fn   func() error
	}{
		{"创建目录结构", func() error { return ensureInstallDirs(opts.InstallPath) }},
		{"安装 ao-cli", func() error { return installCLIBinary(opts.InstallPath, opts.CLISource) }},
		{"配置 ao-cli", func() error { return WriteServerConfig(opts.ServerURL) }},
		{"安装技能包", func() error { return installSkillPackage(opts) }},
		{"更新 PATH", func() error { return maybeAddToPath(opts) }},
		{"验证安装", func() error { return VerifyInstall(opts.InstallPath) }},
	}
	total := len(steps)
	for i, s := range steps {
		if onProgress != nil {
			onProgress(s.name, float64(i)/float64(total))
		}
		if err := s.fn(); err != nil {
			return fmt.Errorf("%s: %w", s.name, err)
		}
	}
	if onProgress != nil {
		onProgress("安装完成", 1.0)
	}
	return nil
}

func ensureInstallDirs(installPath string) error {
	if installPath == "" {
		return fmt.Errorf("empty install path")
	}
	for _, p := range []string{"bin", "config", "skills"} {
		if err := EnsureDir(filepath.Join(installPath, p)); err != nil {
			return err
		}
	}
	return nil
}

// findCLISource 查找待安装的 ao-cli 二进制：
//  1. 与安装程序同目录（zip 解压后 ao-setup 与 ao-cli 并列）
//  2. 父目录
//  3. PATH 中已安装的 ao-cli
func findCLISource() (string, error) {
	exeName := GetAOCLIExeName()
	execPath, err := os.Executable()
	if err != nil {
		execPath = os.Args[0]
	}
	execDir := filepath.Dir(execPath)

	candidates := []string{
		filepath.Join(execDir, exeName),
		filepath.Join(filepath.Dir(execDir), exeName),
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	if p, err := exec.LookPath(exeName); err == nil {
		return p, nil
	}
	return "", fmt.Errorf("ao-cli 未找到：请将 ao-cli 与安装程序放在同一目录，或先安装 ao-cli 到 PATH")
}

func installCLIBinary(installPath, cliSource string) error {
	src := cliSource
	if src == "" {
		var err error
		src, err = findCLISource()
		if err != nil {
			return err
		}
	}
	dst := filepath.Join(installPath, "bin", GetAOCLIExeName())
	if err := copyFile(src, dst); err != nil {
		return fmt.Errorf("复制 ao-cli 失败: %w", err)
	}
	if runtime.GOOS != "windows" {
		if err := os.Chmod(dst, 0755); err != nil {
			return err
		}
	}
	return nil
}

// findSkillSource 查找技能包 .skill 文件：
//  1. 与安装程序同目录
//  2. 同目录 skills/ 子目录
//  3. 父目录 skills/ 子目录
func findSkillSource() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		execPath = os.Args[0]
	}
	execDir := filepath.Dir(execPath)

	candidates := []string{
		filepath.Join(execDir, SkillPackageName),
		filepath.Join(execDir, "skills", SkillPackageName),
		filepath.Join(filepath.Dir(execDir), "skills", SkillPackageName),
	}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	return "", fmt.Errorf("技能包 %s 未找到", SkillPackageName)
}

func installSkillPackage(opts InstallOptions) error {
	if !opts.InstallSkills {
		return nil
	}
	src := opts.SkillSource
	if src == "" {
		var err error
		src, err = findSkillSource()
		if err != nil {
			// 技能包缺失不阻塞安装，仅记录
			return nil
		}
	}
	dst := filepath.Join(opts.InstallPath, "skills", SkillPackageName)
	if err := copyFile(src, dst); err != nil {
		return fmt.Errorf("复制技能包失败: %w", err)
	}
	return nil
}

func maybeAddToPath(opts InstallOptions) error {
	if !opts.AddToPath {
		return nil
	}
	return AddToPATH(filepath.Join(opts.InstallPath, "bin"))
}

func VerifyInstall(installPath string) error {
	if installPath == "" {
		return fmt.Errorf("empty install path")
	}
	cliPath := filepath.Join(installPath, "bin", GetAOCLIExeName())
	info, err := os.Stat(cliPath)
	if err != nil {
		return fmt.Errorf("ao-cli 未安装到 %s", cliPath)
	}
	if info.IsDir() {
		return fmt.Errorf("%s 是目录而非可执行文件", cliPath)
	}
	return nil
}
