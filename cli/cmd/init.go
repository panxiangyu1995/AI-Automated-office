package cmd

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/generator"
)

func newInitCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Initialize ao-cli with API server connection",
		Long:  "Interactive setup: input API address, verify connection, fetch skills list, complete initialization.",
		RunE:  runInit,
	}

	cmd.Flags().Bool("update", false, "Re-download skill definitions and update CLAUDE.md without overwriting user customizations")
	return cmd
}

func runInit(cmd *cobra.Command, args []string) error {
	updateMode, _ := cmd.Flags().GetBool("update")

	if updateMode {
		return runInitUpdate()
	}
	return runInitFull()
}

func runInitFull() error {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter API server URL (default: http://localhost:8080): ")
	serverURL, _ := reader.ReadString('\n')
	serverURL = strings.TrimSpace(serverURL)
	if serverURL == "" {
		serverURL = "http://localhost:8080"
	}

	fmt.Printf("Verifying connection to %s ...\n", serverURL)
	resp, err := http.Get(serverURL + "/api/v1/health")
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", serverURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API health check failed with status %d", resp.StatusCode)
	}
	fmt.Println("Connection verified!")

	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	configDir := home + "/.ai-office-cli"
	os.MkdirAll(configDir, 0755)

	configPath := configDir + "/config.yaml"
	configContent := fmt.Sprintf("server:\n  url: %s\n", serverURL)
	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	fmt.Printf("Configuration saved to %s\n", configPath)

	skills, err := fetchSkills(serverURL)
	if err != nil {
		fmt.Printf("Warning: could not fetch skills: %v\n", err)
		skills = []generator.SkillInfo{}
	}

	config := generator.ClaudeMDConfig{
		EnterpriseName:  "default",
		APIEndpoint:     serverURL,
		AvailableSkills: skills,
		Role:            "employee",
	}

	claudeMD := generator.GenerateClaudeMD(config)
	if err := os.WriteFile("CLAUDE.md", []byte(claudeMD), 0644); err != nil {
		fmt.Printf("Warning: could not write CLAUDE.md: %v\n", err)
	} else {
		fmt.Println("CLAUDE.md generated in current directory")
	}

	agentMD := generator.GenerateAgentMD(config)
	if err := os.WriteFile("agent.md", []byte(agentMD), 0644); err != nil {
		fmt.Printf("Warning: could not write agent.md: %v\n", err)
	} else {
		fmt.Println("agent.md generated in current directory")
	}

	fmt.Println("Initialization complete! Run 'ao-cli auth login' to authenticate.")
	return nil
}

func runInitUpdate() error {
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	configDir := home + "/.ai-office-cli"
	configPath := configDir + "/config.yaml"

	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("config not found, run 'ao-cli init' first: %w", err)
	}

	serverURL := extractServerURL(string(data))
	if serverURL == "" {
		serverURL = "http://localhost:8080"
	}

	skills, err := fetchSkills(serverURL)
	if err != nil {
		return fmt.Errorf("could not fetch skills: %w", err)
	}

	config := generator.ClaudeMDConfig{
		EnterpriseName:  "default",
		APIEndpoint:     serverURL,
		AvailableSkills: skills,
		Role:            "employee",
	}

	existingClaudeMD, err := os.ReadFile("CLAUDE.md")
	if err != nil {
		claudeMD := generator.GenerateClaudeMD(config)
		if err := os.WriteFile("CLAUDE.md", []byte(claudeMD), 0644); err != nil {
			return fmt.Errorf("could not write CLAUDE.md: %w", err)
		}
		fmt.Println("CLAUDE.md generated (no existing file found)")
	} else {
		skillsSection := generateSkillsSection(config)
		existing := string(existingClaudeMD)
		markerStart := "## 可用 Skill 列表"
		markerEnd := "## 操作示例"

		startIdx := strings.Index(existing, markerStart)
		endIdx := strings.Index(existing, markerEnd)

		if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
			updated := existing[:startIdx] + skillsSection + "\n\n" + existing[endIdx:]
			if err := os.WriteFile("CLAUDE.md", []byte(updated), 0644); err != nil {
				return fmt.Errorf("could not update CLAUDE.md: %w", err)
			}
			fmt.Println("CLAUDE.md updated (preserved custom sections)")
		} else {
			claudeMD := generator.GenerateClaudeMD(config)
			if err := os.WriteFile("CLAUDE.md", []byte(claudeMD), 0644); err != nil {
				return fmt.Errorf("could not write CLAUDE.md: %w", err)
			}
			fmt.Println("CLAUDE.md regenerated (could not find section markers)")
		}
	}

	agentMD := generator.GenerateAgentMD(config)
	if err := os.WriteFile("agent.md", []byte(agentMD), 0644); err != nil {
		fmt.Printf("Warning: could not write agent.md: %v\n", err)
	} else {
		fmt.Println("agent.md updated")
	}

	fmt.Println("Update complete!")
	return nil
}

func generateSkillsSection(config generator.ClaudeMDConfig) string {
	var sb strings.Builder
	sb.WriteString("## 可用 Skill 列表\n\n")
	for _, skill := range config.AvailableSkills {
		sb.WriteString(fmt.Sprintf("### %s\n%s\n\n", skill.Name, skill.Description))
		if len(skill.Parameters) > 0 {
			sb.WriteString("参数:\n")
			for _, p := range skill.Parameters {
				req := ""
				if p.Required {
					req = "(必填)"
				}
				sb.WriteString(fmt.Sprintf("- %s [%s]%s\n", p.Name, p.Type, req))
			}
			sb.WriteString("\n")
		}
	}
	return sb.String()
}

func fetchSkills(serverURL string) ([]generator.SkillInfo, error) {
	resp, err := http.Get(serverURL + "/api/v1/skills")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("skills endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Data []struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Parameters  []struct {
				Name     string `json:"name"`
				Type     string `json:"type"`
				Required bool   `json:"required"`
			} `json:"parameters"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	skills := make([]generator.SkillInfo, 0, len(result.Data))
	for _, s := range result.Data {
		params := make([]generator.ParamInfo, 0, len(s.Parameters))
		for _, p := range s.Parameters {
			params = append(params, generator.ParamInfo{
				Name:     p.Name,
				Type:     p.Type,
				Required: p.Required,
			})
		}
		skills = append(skills, generator.SkillInfo{
			Name:        s.Name,
			Description: s.Description,
			Parameters:  params,
		})
	}
	return skills, nil
}

func extractServerURL(configContent string) string {
	lines := strings.Split(configContent, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "url:") {
			return strings.TrimSpace(strings.TrimPrefix(line, "url:"))
		}
	}
	return ""
}
