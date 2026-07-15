package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/poller"
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
		Short: "启动消息轮询（自适应间隔）",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("消息轮询已启动 (自适应间隔: 5s~300s, 初始60s)")
			fmt.Println("按 Ctrl+C 停止")

			p := poller.NewAdaptive(
				5*time.Second,
				300*time.Second,
				60*time.Second,
				func() (int, error) {
					return pollMessagesWithCount()
				},
			)

			go p.Start()

			select {}
		},
	})

	return cmd
}

func pollMessages() error {
	_, err := pollMessagesWithCount()
	return err
}

func pollMessagesWithCount() (int, error) {
	cfg, err := config.Load()
	if err != nil {
		return 0, fmt.Errorf("not logged in, run 'ao-cli auth login' first: %w", err)
	}

	if cfg.IsTokenExpired() && cfg.RefreshToken != "" {
		client := api_client.NewAPIClient(cfg.ServerURL)
		accessToken, refreshToken, expiresIn, err := client.RefreshToken(cfg.RefreshToken)
		if err != nil {
			return 0, fmt.Errorf("token expired and refresh failed, please login again: %w", err)
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
		return 0, fmt.Errorf("poll request failed: %w", err)
	}

	if len(result) > 0 && string(result) != "null" && string(result) != "[]" {
		fmt.Println(string(result))
		var messages []map[string]interface{}
		if jsonErr := json.Unmarshal(result, &messages); jsonErr == nil {
			return len(messages), nil
		}
		return 1, nil
	}

	return 0, nil
}
