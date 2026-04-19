package notification

import (
	"context"
	"log"
)

// InAppSender 应用内通知发送器
type InAppSender struct{}

func (s *InAppSender) Channel() Channel { return ChannelInApp }

func (s *InAppSender) Send(ctx context.Context, notif *Notification) error {
	// 应用内通知直接写入消息表
	log.Printf("[inapp] user=%s title=%s", notif.UserID, notif.Title)
	return nil
}
