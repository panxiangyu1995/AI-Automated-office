package pkg

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type zipFile = zip.File

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
	if err := EnsureDir(filepath.Dir(targetDir)); err != nil {
		return fmt.Errorf("failed to create opencode config dir: %w", err)
	}
	return InstallSkills(skillArchives, targetDir)
}

func DeploySkillsToAgents(skillArchives []string, agents []AgentInfo) error {
	for _, agent := range agents {
		home := GetUserHome()
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

	reader, err := zip.NewReader(archiveFile, 0)
	if err != nil {
		return fmt.Errorf("not a valid zip: %w", err)
	}

	for _, f := range reader.File {
		if f.FileInfo().IsDir() {
			continue
		}

		outPath := filepath.Join(targetDir, f.Name)
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

		_, err = io.Copy(outFile, rc)
		rc.Close()
		outFile.Close()
		if err != nil {
			return err
		}
	}
	return nil
}
