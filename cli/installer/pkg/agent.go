package pkg

import (
	"fmt"
	"os"
	"path/filepath"
)

const (
	OpenCodeConfigDir     = ".config/opencode"
	OpenCodeSkillsDir     = "skills"
	OpenCodeConfigFile    = "opencode.json"
	ClaudeExternalDir     = ".claude"
	AgentsExternalDir     = ".agents"
)

type AgentInfo struct {
	Name    string
	Dir     string
	Skills  string
}

var KnownAgents = []AgentInfo{
	{Name: "OpenCode", Dir: ".config/opencode", Skills: "skills"},
	{Name: "Claude Code", Dir: ".claude", Skills: "skills"},
	{Name: "Codex", Dir: ".codex", Skills: "skills"},
}

func GetUserHome() string {
	if home := os.Getenv("HOME"); home != "" {
		return home
	}
	if home := os.Getenv("USERPROFILE"); home != "" {
		return home
	}
	return ""
}

func DetectAgents() []AgentInfo {
	home := GetUserHome()
	if home == "" {
		return nil
	}

	var detected []AgentInfo
	for _, agent := range KnownAgents {
		skillsPath := filepath.Join(home, agent.Dir, agent.Skills)
		if _, err := os.Stat(skillsPath); err == nil {
			detected = append(detected, agent)
		}
	}
	return detected
}

func DetectOpenCodeDesktop() bool {
	home := GetUserHome()
	if home == "" {
		return false
	}
	configPath := filepath.Join(home, OpenCodeConfigDir, OpenCodeConfigFile)
	_, err := os.Stat(configPath)
	return err == nil
}

func GetOpenCodeConfigPath() string {
	home := GetUserHome()
	if home == "" {
		return ""
	}
	return filepath.Join(home, OpenCodeConfigDir, OpenCodeConfigFile)
}

func GetOpenCodeSkillsPath() string {
	home := GetUserHome()
	if home == "" {
		return ""
	}
	return filepath.Join(home, OpenCodeConfigDir, OpenCodeSkillsDir)
}

func EnsureDir(path string) error {
	if path == "" {
		return fmt.Errorf("empty path")
	}
	return os.MkdirAll(path, 0755)
}
