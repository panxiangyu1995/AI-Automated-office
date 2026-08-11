package pkg

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// WriteOpenCodeConfig 将 ao-cli skills 路径注册到 opencode.json，
// 保留配置中所有既有字段。
func WriteOpenCodeConfig(skillsPath string) error {
	configPath := GetOpenCodeConfigPath()
	if configPath == "" {
		return fmt.Errorf("cannot determine home directory")
	}
	dir := filepath.Dir(configPath)
	if err := EnsureDir(dir); err != nil {
		return fmt.Errorf("failed to create config dir: %w", err)
	}

	// 使用 map 保留未知字段，避免结构体 Unmarshal 丢弃
	var cfg map[string]interface{}
	if data, err := os.ReadFile(configPath); err == nil {
		if err := json.Unmarshal(data, &cfg); err != nil {
			return fmt.Errorf("opencode.json 解析失败，拒绝覆盖: %w", err)
		}
	}
	if cfg == nil {
		cfg = map[string]interface{}{}
	}

	skills, _ := cfg["skills"].(map[string]interface{})
	if skills == nil {
		skills = map[string]interface{}{}
	}
	paths, _ := skills["paths"].([]interface{})

	hasPath := false
	for _, p := range paths {
		if s, ok := p.(string); ok && s == skillsPath {
			hasPath = true
			break
		}
	}
	if !hasPath {
		paths = append(paths, skillsPath)
	}
	skills["paths"] = paths
	cfg["skills"] = skills

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	return os.WriteFile(configPath, data, 0644)
}

// WriteServerConfig 写入 ao-cli 实际读取的配置
// (CLI 读取 ~/.ai-office-cli/config.yaml，字段 server_url)。
func WriteServerConfig(serverURL string) error {
	home := GetUserHome()
	if home == "" {
		return fmt.Errorf("cannot determine home directory")
	}

	configDir := filepath.Join(home, ".ai-office-cli")
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config dir: %w", err)
	}

	content := fmt.Sprintf("server_url: %s\n", serverURL)
	configFile := filepath.Join(configDir, "config.yaml")
	if err := os.WriteFile(configFile, []byte(content), 0600); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}
	return nil
}
