package cmd

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
)

type jwtPayload struct {
	EnterpriseID string `json:"enterprise_id"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
}

func extractEnterpriseID(token string) string {
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return ""
	}
	payload := parts[1]
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}
	decoded, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return ""
	}
	var jp jwtPayload
	if err := json.Unmarshal(decoded, &jp); err != nil {
		return ""
	}
	return jp.EnterpriseID
}

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

	cmd.AddCommand(&cobra.Command{
		Use:   "refresh",
		Short: "刷新认证令牌",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runRefreshToken()
		},
	})

	switchCmd := &cobra.Command{
		Use:   "switch",
		Short: "切换企业上下文",
		RunE: func(cmd *cobra.Command, args []string) error {
			enterpriseID, _ := cmd.Flags().GetString("enterprise-id")
			return runSwitchEnterprise(enterpriseID)
		},
	}
	switchCmd.Flags().String("enterprise-id", "", "目标企业ID")
	switchCmd.MarkFlagRequired("enterprise-id")
	cmd.AddCommand(switchCmd)

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
	accessToken, refreshToken, expiresIn, err := client.Login(email, password)
	if err != nil {
		return fmt.Errorf("login failed: %w", err)
	}

	cfg := &config.Config{
		ServerURL:    serverURL,
		Token:         accessToken,
		RefreshToken: refreshToken,
		Email:         email,
		Host:          u.Host,
		EnterpriseID: extractEnterpriseID(accessToken),
		ExpiresAt:     time.Now().Add(time.Duration(expiresIn) * time.Second),
	}

	if err := config.Save(cfg); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	fmt.Printf("登录成功 (host: %s)\n", u.Host)
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
	if cfg.EnterpriseID != "" {
		fmt.Printf("   企业ID: %s\n", cfg.EnterpriseID)
	}
	return nil
}

func runRefreshToken() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("not logged in: %w", err)
	}
	if cfg.RefreshToken == "" {
		return fmt.Errorf("no refresh token available, please login again")
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	accessToken, refreshToken, expiresIn, err := client.RefreshToken(cfg.RefreshToken)
	if err != nil {
		return fmt.Errorf("refresh failed: %w", err)
	}

	cfg.Token = accessToken
	cfg.RefreshToken = refreshToken
	cfg.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)

	if err := config.Save(cfg); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	fmt.Println("令牌刷新成功")
	return nil
}

func runSwitchEnterprise(enterpriseID string) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("not logged in: %w", err)
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetHMACSecret(cfg.HMACSecret)
	accessToken, refreshToken, expiresIn, err := client.SwitchEnterprise(cfg.Token, enterpriseID)
	if err != nil {
		return fmt.Errorf("switch enterprise failed: %w", err)
	}

	cfg.Token = accessToken
	cfg.RefreshToken = refreshToken
	cfg.EnterpriseID = enterpriseID
	cfg.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)

	if err := config.Save(cfg); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	fmt.Printf("已切换到企业: %s\n", enterpriseID)
	return nil
}
