package message

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// Module 消息模块
type Module struct {
}

// NewModule 创建消息模块
func NewModule(db *sql.DB) *Module {
	return &Module{}
}

// RegisterRoutes 注册路由
func (m *Module) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
	// 创建存储库
	messageStore := NewMessageStore(nil) // will be set by module init
	announcementStore := NewAnnouncementStore(nil)
	prefStore := NewNotificationPreferencesStore(nil)
	groupStore := NewGroupMessageStore(nil)
	auditStore := NewMessageAuditStore(nil)

	// 创建服务
	messageSvc := NewMessageService(messageStore, auditStore)
	annSvc := NewAnnouncementService(announcementStore, prefStore)
	notifSvc := NewNotificationService(prefStore)
	groupSvc := NewGroupMessageService(groupStore)

	// 创建处理器
	handler := NewHandler(messageSvc, annSvc, notifSvc, groupSvc)

	// 消息路由组
	messages := r.Group("/api/v1/messages")
	messages.Use(authMiddleware)
	{
		messages.POST("", handler.SendMessage)
		messages.GET("", handler.ListMessages)
		messages.GET("/unread-count", handler.GetUnreadCount)
		messages.GET("/pinned", handler.GetPinnedMessages)
		messages.GET("/search", handler.SearchMessages)
		messages.POST("/search", handler.SearchMessages)
		messages.PUT("/read-all", handler.MarkAllAsRead)
		messages.GET("/:id", handler.GetMessage)
		messages.PUT("/:id/read", handler.MarkAsRead)
		messages.DELETE("/:id", handler.DeleteMessage)
		messages.PUT("/:id/pin", handler.PinMessage)
		messages.PUT("/:id/unpin", handler.UnpinMessage)
		messages.POST("/:id/recall", handler.RecallMessage)
		messages.GET("/:id/status", handler.GetDeliveryStatus)
	}

	// 公告路由组
	announcements := r.Group("/api/v1/announcements")
	announcements.Use(authMiddleware)
	{
		announcements.POST("", handler.CreateAnnouncement)
		announcements.GET("", handler.ListAnnouncements)
		announcements.GET("/unread-count", handler.GetAnnouncementUnreadCount)
		announcements.GET("/:id", handler.GetAnnouncement)
		announcements.PUT("/:id/read", handler.MarkAnnouncementRead)
	}

	// 通知偏好路由组
	notifications := r.Group("/api/v1/notifications")
	notifications.Use(authMiddleware)
	{
		notifications.GET("/preferences", handler.GetPreferences)
		notifications.PUT("/preferences", handler.UpdatePreferences)
	}

	// 群消息路由组
	groupMessages := r.Group("/api/v1/group-messages")
	groupMessages.Use(authMiddleware)
	{
		groupMessages.POST("", handler.SendGroupMessage)
		groupMessages.GET("/:group_id", handler.ListGroupMessages)
	}
}

// Init 初始化模块
func (m *Module) Init(db *sql.DB) error {
	return nil
}
