package pkg

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type OpenCodeConfig struct {
	Skills struct {
		Paths []string `json:"paths,omitempty"`
		URLs  []string `json:"urls,omitempty"`
	} `json:"skills,omitempty"`
}

func WriteOpenCodeConfig(serverURL string) error {
	configPath := GetOpenCodeConfigPath()
	dir := filepath.Dir(configPath)
	if err := EnsureDir(dir); err != nil {
		return fmt.Errorf("failed to create config dir: %w", err)
	}

	var cfg OpenCodeConfig
	if data, err := os.ReadFile(configPath); err == nil {
		json.Unmarshal(data, &cfg)
	}

	if cfg.Skills.Paths == nil {
		cfg.Skills.Paths = []string{}
	}

	aoCliSkillsPath := GetAOCLISkillsDir()
	hasPath := false
	for _, p := range cfg.Skills.Paths {
		if p == aoCliSkillsPath || p == "~/.ao-cli/skills" {
			hasPath = true
			break
		}
	}
	if !hasPath {
		cfg.Skills.Paths = append(cfg.Skills.Paths, aoCliSkillsPath)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	return os.WriteFile(configPath, data, 0644)
}

func WriteServerConfig(serverURL string) error {
	home := GetUserHome()
	if home == "" {
		return fmt.Errorf("cannot determine home directory")
	}

	configDir := filepath.Join(home, AOCLIDirName, ConfigDirName)
	if err := EnsureDir(configDir); err != nil {
		return err
	}

	cfg := map[string]interface{}{
		"server_url": serverURL,
		"client_id":  generateClientID(),
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	configFile := filepath.Join(configDir, "config.json")
	return os.WriteFile(configFile, data, 0644)
}

func generateClientID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
