package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// IMProvider IM提供商
type IMProvider string

const (
	IMDingTalk  IMProvider = "dingtalk"
	IMFeishu    IMProvider = "feishu"
	IMWechat    IMProvider = "wechat"
)

// IMSenderConfig IM发送器配置
type IMSenderConfig struct {
	Provider IMProvider
	Webhook  string // Webhook URL
	AgentID  string
	CorpID   string
	CorpSec  string
}

// IMSender 企业IM通知发送器
type IMSender struct {
	config IMSenderConfig
	client *http.Client
}

// NewIMSender 创建IM发送器
func NewIMSender(config IMSenderConfig) *IMSender {
	return &IMSender{
		config: config,
		client: &http.Client{},
	}
}

func (s *IMSender) Channel() Channel { return ChannelIM }

func (s *IMSender) Send(ctx context.Context, notif *Notification) error {
	switch s.config.Provider {
	case IMDingTalk:
		return s.sendDingTalk(ctx, notif)
	case IMFeishu:
		return s.sendFeishu(ctx, notif)
	case IMWechat:
		return s.sendWechat(ctx, notif)
	default:
		return fmt.Errorf("unsupported IM provider: %s", s.config.Provider)
	}
}

func (s *IMSender) sendDingTalk(ctx context.Context, notif *Notification) error {
	// 钉钉 webhook 格式
	msg := map[string]interface{}{
		"msgtype": "text",
		"text": map[string]string{
			"content": fmt.Sprintf("%s\n%s", notif.Title, notif.Content),
		},
	}
	body, _ := json.Marshal(msg)

	req, err := http.NewRequestWithContext(ctx, "POST", s.config.Webhook, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	if resp.StatusCode != 200 {
		return fmt.Errorf("dingtalk error: %v", result)
	}
	return nil
}

func (s *IMSender) sendFeishu(ctx context.Context, notif *Notification) error {
	msg := map[string]interface{}{
		"msg_type": "text",
		"content": map[string]string{
			"text": fmt.Sprintf("%s\n%s", notif.Title, notif.Content),
		},
	}
	body, _ := json.Marshal(msg)

	req, err := http.NewRequestWithContext(ctx, "POST", s.config.Webhook, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (s *IMSender) sendWechat(ctx context.Context, notif *Notification) error {
	msg := map[string]interface{}{
		"msgtype": "text",
		"text": map[string]string{
			"content": fmt.Sprintf("%s\n%s", notif.Title, notif.Content),
		},
	}
	body, _ := json.Marshal(msg)

	req, err := http.NewRequestWithContext(ctx, "POST", s.config.Webhook, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
