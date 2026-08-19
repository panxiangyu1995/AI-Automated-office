package poller

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
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
	HasUnread   bool            `json:"has_unread"`
	UnreadCount int             `json:"unread_count"`
	Messages    []UnreadMessage `json:"messages"`
}

// UnreadCheckOnConversationStart 是 skill 执行前置 hook：检查并送达新未读消息。
// 与 poll 守护共用 CheckAndNotify，从而保证双通道去重一致。
func UnreadCheckOnConversationStart(cfg *config.Config) error {
	_, err := CheckAndNotify(cfg, CursorPath(cfg))
	return err
}

// CursorPath 返回未读去重游标文件路径（可经配置覆盖）。
func CursorPath(cfg *config.Config) string {
	return defaultCursorPath(cfg)
}

// CheckAndNotify 拉取自 since 之后的未读消息：
//   - 无新消息返回 0；
//   - 有新消息时无条件打印到 stdout，并按 cfg.Notify.Enable 决定是否发送 OS 通知；
//   - 送达后推进本地游标（去重），返回本次新消息条数。
func CheckAndNotify(cfg *config.Config, cursorPath string) (int, error) {
	since, err := loadCursor(cursorPath)
	if err != nil {
		return 0, fmt.Errorf("load cursor failed: %w", err)
	}

	msgs, latest, err := FetchNewUnread(cfg, since)
	if err != nil {
		return 0, fmt.Errorf("fetch unread messages failed: %w", err)
	}

	if len(msgs) == 0 {
		return 0, nil
	}

	fmt.Printf("\n您有 %d 条新消息：\n", len(msgs))
	for _, m := range msgs {
		fmt.Printf("  - [%s] %s\n", m.MsgType, m.Title)
	}
	fmt.Println("提示：处理后可用 ao-cli message mark-read --id <消息ID> 标记已读。")

	if cfg.Notify.Enable {
		title := fmt.Sprintf("您有 %d 条新消息", len(msgs))
		content := messageSummary(msgs)
		if err := SendNotification(title, content, notifyConfigFrom(cfg)); err != nil {
			fmt.Fprintf(os.Stderr, "warning: send notification failed: %v\n", err)
		}
	}

	if err := saveCursor(cursorPath, latest); err != nil {
		fmt.Fprintf(os.Stderr, "warning: save cursor failed: %v\n", err)
	}
	return len(msgs), nil
}

// FetchNewUnread 调用 /messages/poll?since=...&limit=100 获取增量未读消息，
// 返回消息列表与最新一条的 created_at（用于推进游标）。
func FetchNewUnread(cfg *config.Config, since time.Time) ([]UnreadMessage, time.Time, error) {
	var err error
	cfg, err = RefreshTokenIfNeeded(cfg)
	if err != nil {
		return nil, time.Time{}, err
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if cfg.EnterpriseID != "" {
		client.SetEnterpriseID(cfg.EnterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	endpoint := fmt.Sprintf("/api/v1/enterprises/%s/messages/poll?limit=100", cfg.EnterpriseID)
	if !since.IsZero() {
		endpoint += "&since=" + since.UTC().Format(time.RFC3339Nano)
	}

	result, err := client.Get(endpoint)
	if err != nil {
		return nil, time.Time{}, err
	}

	var wrapper struct {
		Data []UnreadMessage `json:"data"`
	}
	if err := json.Unmarshal(result, &wrapper); err != nil {
		return nil, time.Time{}, fmt.Errorf("parse poll response failed: %w", err)
	}

	var latest time.Time
	parseFailed := false
	for _, m := range wrapper.Data {
		t, perr := time.Parse(time.RFC3339Nano, m.CreatedAt)
		if perr != nil {
			parseFailed = true
			continue
		}
		if t.After(latest) {
			latest = t
		}
	}
	if parseFailed {
		return nil, time.Time{}, fmt.Errorf("poll response contains message without valid created_at (RFC3339Nano); cursor cannot advance safely")
	}
	return wrapper.Data, latest, nil
}

func defaultCursorPath(cfg *config.Config) string {
	if cfg != nil && cfg.Poll.CursorFile != "" {
		return cfg.Poll.CursorFile
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "messages.cursor"
	}
	return filepath.Join(home, ".ai-office-cli", "messages.cursor")
}

func loadCursor(path string) (time.Time, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return time.Time{}, nil
		}
		return time.Time{}, err
	}
	t, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(string(data)))
	if err != nil {
		return time.Time{}, fmt.Errorf("parse cursor: %w", err)
	}
	return t, nil
}

func saveCursor(path string, t time.Time) error {
	if t.IsZero() {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(t.UTC().Format(time.RFC3339Nano)), 0600)
}

func messageSummary(msgs []UnreadMessage) string {
	var parts []string
	for i, m := range msgs {
		if i >= 3 {
			break
		}
		parts = append(parts, m.Title)
	}
	summary := strings.Join(parts, ", ")
	if len(msgs) > 3 {
		summary += fmt.Sprintf(" 等%d条", len(msgs))
	}
	return summary
}

func notifyConfigFrom(cfg *config.Config) NotifyConfig {
	nc := NotifyConfig{
		Enable:      cfg.Notify.Enable,
		OpenclawURL: cfg.Notify.OpenclawURL,
		MarkFile:    cfg.Notify.MarkFile,
	}
	return nc
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