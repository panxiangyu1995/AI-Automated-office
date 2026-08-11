package pkg

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func InstallSkills(skillArchives []string, targetDir string) error {
	if err := EnsureDir(targetDir); err != nil {
		return fmt.Errorf("failed to create skills dir: %w", err)
	}

	for _, archive := range skillArchives {
		if err := extractSkillTo(archive, targetDir); err != nil {
			return fmt.Errorf("failed to extract %s: %w", archive, err)
		}
	}
	return nil
}

func DeploySkillsToOpenCode(skillArchives []string) error {
	targetDir := GetOpenCodeSkillsPath()
	if targetDir == "" {
		return fmt.Errorf("cannot determine home directory")
	}
	if err := EnsureDir(filepath.Dir(targetDir)); err != nil {
		return fmt.Errorf("failed to create opencode config dir: %w", err)
	}
	return InstallSkills(skillArchives, targetDir)
}

func DeploySkillsToAgents(skillArchives []string, agents []AgentInfo) error {
	home := GetUserHome()
	if home == "" {
		return fmt.Errorf("cannot determine home directory")
	}
	for _, agent := range agents {
		targetDir := filepath.Join(home, agent.Dir, agent.Skills)
		if err := InstallSkills(skillArchives, targetDir); err != nil {
			return fmt.Errorf("failed to deploy to %s: %w", agent.Name, err)
		}
	}
	return nil
}

func extractSkillTo(archivePath, targetDir string) error {
	archiveFile, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer archiveFile.Close()

	info, err := archiveFile.Stat()
	if err != nil {
		return err
	}

	reader, err := zip.NewReader(archiveFile, info.Size())
	if err != nil {
		return fmt.Errorf("not a valid zip: %w", err)
	}

	for _, f := range reader.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if err := validateSafePath(f.Name); err != nil {
			return err
		}

		outPath := filepath.Join(targetDir, filepath.Clean(f.Name))
		if err := os.MkdirAll(filepath.Dir(outPath), 0755); err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			return err
		}

		outFile, err := os.Create(outPath)
		if err != nil {
			rc.Close()
			return err
		}

		_, copyErr := io.Copy(outFile, rc)
		closeErr := outFile.Close()
		rcErr := rc.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		if rcErr != nil && !errors.Is(rcErr, io.EOF) {
			return rcErr
		}
	}
	return nil
}

// validateSafePath 防 Zip Slip：
//   - 拒绝绝对路径
//   - 拒绝任何 .. 上跳（统一处理 / 与 \，避免跨平台绕过）
func validateSafePath(name string) error {
	// 统一分隔符：filepath.ToSlash 在非 Windows 平台不处理反斜杠，需手动替换
	cleaned := strings.ReplaceAll(name, "\\", "/")

	// 绝对路径（POSIX 或 Windows 盘符）
	if strings.HasPrefix(cleaned, "/") || (len(cleaned) >= 2 && cleaned[1] == ':') {
		return fmt.Errorf("拒绝不安全的压缩包绝对路径: %s", name)
	}

	// 逐段检查 .. 上跳
	depth := 0
	for _, part := range strings.Split(cleaned, "/") {
		switch part {
		case "..":
			depth--
			if depth < 0 {
				return fmt.Errorf("拒绝不安全的压缩包路径: %s", name)
			}
		case "", ".":
			// 忽略空段与当前目录
		default:
			depth++
		}
	}
	return nil
}
