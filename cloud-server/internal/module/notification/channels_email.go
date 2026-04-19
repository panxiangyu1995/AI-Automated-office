package notification

import (
	"context"
	"fmt"
	"net/smtp"
)

// EmailSenderConfig 邮件发送器配置
type EmailSenderConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// EmailSender 邮件通知发送器
type EmailSender struct {
	config EmailSenderConfig
}

// NewEmailSender 创建邮件发送器
func NewEmailSender(config EmailSenderConfig) *EmailSender {
	return &EmailSender{config: config}
}

func (s *EmailSender) Channel() Channel { return ChannelEmail }

func (s *EmailSender) Send(ctx context.Context, notif *Notification) error {
	to := notif.Metadata["email"]
	if to == nil {
		to = notif.UserID + "@example.com" // 占位，实际应从用户表查询
	}

	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	body := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		s.config.From, to, notif.Title, notif.Content)

	return smtp.SendMail(addr, auth, s.config.Username, []string{to.(string)}, []byte(body))
}
