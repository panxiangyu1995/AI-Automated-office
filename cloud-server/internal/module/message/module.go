package message

import (
	"database/sql"

)

// Module 消息模块
type Module struct {
	db      *sql.DB
	handler *Handler
}

// NewModule 创建消息模块
func NewModule(db *sql.DB) *Module {
	// 创建存储库
	messageStore := NewMessageStore(db)
	announcementStore := NewAnnouncementStore(db)
	prefStore := NewNotificationPreferencesStore(db)
	groupStore := NewGroupMessageStore(db)
	auditStore := NewMessageAuditStore(db)

	// 创建服务（通知调度器通过 WebSocket 发送 in-app 通知）
	messageSvc := NewMessageService(messageStore, auditStore, nil)
	annSvc := NewAnnouncementService(announcementStore, prefStore)
	notifSvc := NewNotificationService(prefStore)
	groupSvc := NewGroupMessageService(groupStore)

	// 创建处理器
	handler := NewHandler(messageSvc, annSvc, notifSvc, groupSvc)

	return &Module{db: db, handler: handler}
}

// Handler 返回HTTP处理器
func (m *Module) Handler() *Handler {
	return m.handler
}

// Init 初始化模块
func (m *Module) Init() error {
	return nil
}
