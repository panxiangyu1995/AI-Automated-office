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
		// 防 Zip Slip：拒绝解压到目标目录之外的路径
		name := filepath.Clean(f.Name)
		if name == ".." || strings.HasPrefix(name, ".."+string(filepath.Separator)) {
			return fmt.Errorf("拒绝不安全的压缩包路径: %s", f.Name)
		}

		outPath := filepath.Join(targetDir, name)
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
