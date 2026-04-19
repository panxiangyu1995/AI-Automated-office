package notification

import (
	"context"
	"log"
)

// Channel 通知渠道
type Channel string

const (
	ChannelInApp Channel = "in_app"
	ChannelEmail Channel = "email"
	ChannelSMS   Channel = "sms"
	ChannelIM    Channel = "im" // 企业微信/钉钉/飞书
)

// Notification 通知结构
type Notification struct {
	UserID     string
	TenantID   string
	Title      string
	Content    string
	Channels   []Channel
	Priority   string
	ActionURL  string
	Metadata   map[string]interface{}
}

// Sender 通知发送器接口
type Sender interface {
	Send(ctx context.Context, notif *Notification) error
	Channel() Channel
}

// Dispatcher 通知调度器
type Dispatcher struct {
	senders map[Channel]Sender
}

// NewDispatcher 创建调度器
func NewDispatcher() *Dispatcher {
	return &Dispatcher{
		senders: make(map[Channel]Sender),
	}
}

// Register 注册发送器
func (d *Dispatcher) Register(sender Sender) {
	d.senders[sender.Channel()] = sender
}

// Dispatch 发送通知到各渠道
func (d *Dispatcher) Dispatch(ctx context.Context, notif *Notification) error {
	var lastErr error
	for _, ch := range notif.Channels {
		sender, ok := d.senders[ch]
		if !ok {
			continue
		}
		if err := sender.Send(ctx, notif); err != nil {
			log.Printf("[notification] failed to send via %s: %v", ch, err)
			lastErr = err
		}
	}
	return lastErr
}

// DefaultDispatcher 全局默认调度器
var DefaultDispatcher = NewDispatcher()

func init() {
	// 注册内置发送器
	DefaultDispatcher.Register(&InAppSender{})
}
