package poller

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
)

type UnreadMessage struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	MsgType   string `json:"msg_type"`
	SenderID  string `json:"sender_id"`
	CreatedAt string `json:"created_at"`
}

type UnreadCheckResult struct {
	HasUnread   bool           `json:"has_unread"`
	UnreadCount int            `json:"unread_count"`
	Messages    []UnreadMessage `json:"messages"`
}

func UnreadCheckOnConversationStart(cfg *config.Config) error {
	messages, err := fetchUnreadMessages(cfg)
	if err != nil {
		return fmt.Errorf("fetch unread messages failed: %w", err)
	}

	if len(messages) == 0 {
		return nil
	}

	notifyCfg := NotifyConfig{
		Enable:      true,
		OpenclawURL: "",
		MarkFile:    "",
	}

	summary := ""
	for i, msg := range messages {
		if i >= 3 {
			break
		}
		if i > 0 {
			summary += ", "
		}
		summary += msg.Title
	}
	if len(messages) > 3 {
		summary += fmt.Sprintf(" 等%d条", len(messages))
	}

	title := fmt.Sprintf("您有 %d 条未读消息", len(messages))
	if err := SendNotification(title, summary, notifyCfg); err != nil {
		return fmt.Errorf("send notification failed: %w", err)
	}

	return nil
}

func fetchUnreadMessages(cfg *config.Config) ([]UnreadMessage, error) {
	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	endpoint := fmt.Sprintf("/api/v1/enterprises/%s/messages?page=1&page_size=50", cfg.EnterpriseID)
	result, err := client.Get(endpoint)
	if err != nil {
		return nil, err
	}

	var messages []UnreadMessage
	var wrapper struct {
		Data []UnreadMessage `json:"data"`
	}
	if err := json.Unmarshal(result, &wrapper); err != nil {
		if err2 := json.Unmarshal(result, &messages); err2 != nil {
			return nil, fmt.Errorf("parse messages failed: %w", err)
		}
	} else {
		messages = wrapper.Data
	}

	unread := make([]UnreadMessage, 0)
	for _, msg := range messages {
		if msg.MsgType == "announcement" || msg.MsgType == "notification" || msg.MsgType == "reminder" {
			continue
		}
		unread = append(unread, msg)
	}

	return unread, nil
}

func BatchMarkAsRead(cfg *config.Config, messageIDs []string) error {
	if len(messageIDs) == 0 {
		return nil
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	payload := map[string]interface{}{
		"message_ids": messageIDs,
	}

	_, err := client.Post(fmt.Sprintf("/api/v1/enterprises/%s/messages/read", cfg.EnterpriseID), payload)
	return err
}

func RefreshTokenIfNeeded(cfg *config.Config) (*config.Config, error) {
	if !cfg.IsTokenExpired() {
		return cfg, nil
	}

	if cfg.RefreshToken == "" {
		return cfg, fmt.Errorf("token expired and no refresh token")
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	accessToken, refreshToken, expiresIn, err := client.RefreshToken(cfg.RefreshToken)
	if err != nil {
		return cfg, fmt.Errorf("refresh token failed: %w", err)
	}

	cfg.Token = accessToken
	cfg.RefreshToken = refreshToken
	cfg.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)

	if err := config.Save(cfg); err != nil {
		fmt.Fprintf(os.Stderr, "warning: failed to save refreshed token: %v\n", err)
	}

	return cfg, nil
}
