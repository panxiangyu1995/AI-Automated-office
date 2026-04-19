package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// SMSSenderConfig 短信发送器配置
type SMSSenderConfig struct {
	APIKey    string
	APISecret string
	Endpoint  string
	SignName  string
}

// SMSSender 短信通知发送器
type SMSSender struct {
	config SMSSenderConfig
	client *http.Client
}

// NewSMSSender 创建短信发送器
func NewSMSSender(config SMSSenderConfig) *SMSSender {
	return &SMSSender{
		config: config,
		client: &http.Client{},
	}
}

func (s *SMSSender) Channel() Channel { return ChannelSMS }

func (s *SMSSender) Send(ctx context.Context, notif *Notification) error {
	phone := notif.Metadata["phone"]
	if phone == nil {
		return fmt.Errorf("missing phone number")
	}

	// 短信内容截断（通常70字符）
	content := notif.Title
	if len(notif.Content) > 50 {
		content = notif.Content[:50] + "..."
	}

	payload := map[string]interface{}{
		"phone":    phone,
		"content":  content,
		"signName": s.config.SignName,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, "POST", s.config.Endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", s.config.APIKey)

	_, err = s.client.Do(req)
	return err
}
