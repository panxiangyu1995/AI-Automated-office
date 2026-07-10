package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
)

func newPollCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "poll",
		Short: "消息轮询（启动轮询服务）",
		Long: `启动消息轮询服务，每 60 秒轮询一次未读消息。
使用 ao-cli poll start 启动轮询。
使用 Ctrl+C 停止轮询。`,
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "start",
		Short: "启动消息轮询",
		RunE: func(cmd *cobra.Command, args []string) error {
			interval := 60
			fmt.Printf("消息轮询已启动 (每 %d 秒轮询一次)\n", interval)
			fmt.Println("按 Ctrl+C 停止")

			ticker := time.NewTicker(time.Duration(interval) * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				if err := pollMessages(); err != nil {
					fmt.Fprintf(os.Stderr, "轮询失败: %v\n", err)
				}
			}
			return nil
		},
	})

	return cmd
}

func pollMessages() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("not logged in, run 'ao-cli auth login' first: %w", err)
	}

	if cfg.IsTokenExpired() && cfg.RefreshToken != "" {
		client := api_client.NewAPIClient(cfg.ServerURL)
		accessToken, refreshToken, expiresIn, err := client.RefreshToken(cfg.RefreshToken)
		if err != nil {
			return fmt.Errorf("token expired and refresh failed, please login again: %w", err)
		}
		cfg.Token = accessToken
		cfg.RefreshToken = refreshToken
		cfg.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)
		if saveErr := config.Save(cfg); saveErr != nil {
			fmt.Fprintf(os.Stderr, "warning: failed to save refreshed token: %v\n", saveErr)
		}
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	endpoint := fmt.Sprintf("/api/v1/enterprises/%s/messages/poll?timeout=60", cfg.EnterpriseID)
	result, err := client.Get(endpoint)
	if err != nil {
		return fmt.Errorf("poll request failed: %w", err)
	}

	if len(result) > 0 && string(result) != "null" && string(result) != "[]" {
		fmt.Println(string(result))
	}

	return nil
}
