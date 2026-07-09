package cmd

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

func newInitCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Initialize ao-cli with API server connection",
		Long:  "Interactive setup: input API address, verify connection, fetch skills list, complete initialization.",
		RunE:  runInit,
	}
	return cmd
}

func runInit(cmd *cobra.Command, args []string) error {
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
	fmt.Println("Initialization complete! Run 'ao-cli auth login' to authenticate.")
	return nil
}
