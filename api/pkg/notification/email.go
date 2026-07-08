package notification

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"strings"
)

type EmailConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	From     string `yaml:"from"`
	UseTLS   bool   `yaml:"use_tls"`
}

type EmailClient struct {
	config EmailConfig
}

func NewEmailClient(cfg EmailConfig) *EmailClient {
	return &EmailClient{config: cfg}
}

func (c *EmailClient) Send(to, subject, body string) error {
	if c.config.Host == "" {
		return fmt.Errorf("SMTP host not configured")
	}

	from := c.config.From
	if from == "" {
		from = c.config.Username
	}

	msg := strings.Join([]string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	addr := fmt.Sprintf("%s:%d", c.config.Host, c.config.Port)

	if c.config.UseTLS {
		return c.sendTLS(addr, from, to, []byte(msg))
	}

	auth := smtp.PlainAuth("", c.config.Username, c.config.Password, c.config.Host)
	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}

func (c *EmailClient) sendTLS(addr, from, to string, msg []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: c.config.Host})
	if err != nil {
		return fmt.Errorf("TLS dial failed: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, c.config.Host)
	if err != nil {
		return fmt.Errorf("SMTP client creation failed: %w", err)
	}
	defer client.Close()

	auth := smtp.PlainAuth("", c.config.Username, c.config.Password, c.config.Host)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP auth failed: %w", err)
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("SMTP mail from failed: %w", err)
	}

	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP rcpt to failed: %w", err)
	}

	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP data failed: %w", err)
	}
	defer wc.Close()

	if _, err := wc.Write(msg); err != nil {
		return fmt.Errorf("SMTP write failed: %w", err)
	}

	return client.Quit()
}
