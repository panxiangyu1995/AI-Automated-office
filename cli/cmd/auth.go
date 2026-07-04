package cmd

import (
	"fmt"
	"net/url"
	"os"

	"github.com/spf13/cobra"

	"github.com/ai-office/cli/internal/config"
	"github.com/ai-office/cli/pkg/api_client"
)

func newAuthCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "auth",
		Short: "认证管理（登录/登出/状态）",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "login",
		Short: "登录到 AI-Automated-office",
		RunE: func(cmd *cobra.Command, args []string) error {
			serverURL := getFlagString(cmd, "server")
			return runLogin(serverURL)
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "logout",
		Short: "登出",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runLogout()
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "status",
		Short: "查看当前认证状态",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runAuthStatus()
		},
	})

	return cmd
}

func runLogin(serverURL string) error {
	u, err := url.Parse(serverURL)
	if err != nil {
		return fmt.Errorf("invalid server URL: %w", err)
	}

	fmt.Print("Email: ")
	var email string
	fmt.Scanln(&email)

	fmt.Print("Password: ")
	var password string
	fmt.Scanln(&password)

	client := api_client.NewAPIClient(serverURL)
	token, err := client.Login(email, password)
	if err != nil {
		return fmt.Errorf("login failed: %w", err)
	}

	cfg := &config.Config{
		ServerURL: serverURL,
		Token:     token,
		Email:     email,
		Host:      u.Host,
	}

	if err := config.Save(cfg); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	fmt.Printf("✅ 登录成功 (host: %s)\n", u.Host)
	return nil
}

func runLogout() error {
	if err := config.Clear(); err != nil {
		return fmt.Errorf("failed to clear config: %w", err)
	}
	fmt.Println("✅ 已登出")
	return nil
}

func runAuthStatus() error {
	cfg, err := config.Load()
	if err != nil {
		if os.IsNotExist(err) {
			fmt.Println("🔓 未登录 (使用 ao-cli auth login 登录)")
			return nil
		}
		return err
	}

	fmt.Printf("✅ 已登录\n")
	fmt.Printf("   服务器: %s\n", cfg.ServerURL)
	fmt.Printf("   邮箱:   %s\n", cfg.Email)
	fmt.Printf("   主机:   %s\n", cfg.Host)
	return nil
}
