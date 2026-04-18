package message

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Handler 消息模块HTTP处理器
type Handler struct {
	svc *MessageService
	ann *AnnouncementService
	notif *NotificationService
	group *GroupMessageService
}

// NewHandler 创建消息处理器
func NewHandler(svc *MessageService, ann *AnnouncementService, notif *NotificationService, group *GroupMessageService) *Handler {
	return &Handler{
		svc: svc,
		ann: ann,
		notif: notif,
		group: group,
	}
}

// getTenantID 获取租户ID
func (h *Handler) getTenantID(c *gin.Context) string {
	if tenantID, ok := c.Get("tenant_id"); ok {
		return tenantID.(string)
	}
	return ""
}

// getUserID 获取用户ID
func (h *Handler) getUserID(c *gin.Context) string {
	if userID, ok := c.Get("user_id"); ok {
		return userID.(string)
	}
	return ""
}

// getUserName 获取用户名
func (h *Handler) getUserName(c *gin.Context) string {
	if name, ok := c.Get("user_name"); ok {
		return name.(string)
	}
	return ""
}

// ============== Message Routes ==============

// SendMessage 发送消息
// POST /api/v1/messages
func (h *Handler) SendMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	userName := h.getUserName()

	var req CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": err.Error()})
		return
	}

	msg, err := h.svc.SendMessage(c.Request.Context(), tenantID, userID, userName, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "SEND_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"code": "SUCCESS", "message": "消息发送成功", "data": msg})
}

// ListMessages 获取消息列表
// GET /api/v1/messages
func (h *Handler) ListMessages(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	status := c.Query("status")
	var statusFilter *MessageStatus
	if status != "" {
		s := MessageStatus(status)
		statusFilter = &s
	}

	limit := 20
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	messages, err := h.svc.ListMessages(c.Request.Context(), tenantID, userID, statusFilter, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "LIST_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": messages})
}

// GetMessage 获取消息详情
// GET /api/v1/messages/:id
func (h *Handler) GetMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	id := c.Param("id")

	msg, err := h.svc.GetMessage(c.Request.Context(), tenantID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_FAILED", "message": err.Error()})
		return
	}
	if msg == nil {
		c.JSON(http.StatusNotFound, gin.H{"code": "NOT_FOUND", "message": "消息不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": msg})
}

// MarkAsRead 标记已读
// PUT /api/v1/messages/:id/read
func (h *Handler) MarkAsRead(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	if err := h.svc.MarkAsRead(c.Request.Context(), tenantID, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "MARK_READ_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "标记已读成功"})
}

// MarkAllAsRead 全部已读
// PUT /api/v1/messages/read-all
func (h *Handler) MarkAllAsRead(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	if err := h.svc.MarkAllAsRead(c.Request.Context(), tenantID, userID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "MARK_ALL_READ_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "全部已读成功"})
}

// DeleteMessage 删除消息
// DELETE /api/v1/messages/:id
func (h *Handler) DeleteMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	if err := h.svc.DeleteMessage(c.Request.Context(), tenantID, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "DELETE_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "删除成功"})
}

// GetUnreadCount 获取未读数
// GET /api/v1/messages/unread-count
func (h *Handler) GetUnreadCount(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	count, err := h.svc.GetUnreadCount(c.Request.Context(), tenantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_COUNT_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": count})
}

// SearchMessages 搜索消息
// POST /api/v1/messages/search
func (h *Handler) SearchMessages(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	var req SearchMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": err.Error()})
		return
	}

	result, err := h.svc.SearchMessages(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "SEARCH_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": result})
}

// PinMessage 置顶消息
// PUT /api/v1/messages/:id/pin
func (h *Handler) PinMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	var req PinMessageRequest
	c.ShouldBindJSON(&req)

	if err := h.svc.PinMessage(c.Request.Context(), tenantID, id, userID, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "PIN_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "置顶成功"})
}

// UnpinMessage 取消置顶
// PUT /api/v1/messages/:id/unpin
func (h *Handler) UnpinMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	if err := h.svc.UnpinMessage(c.Request.Context(), tenantID, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "UNPIN_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "取消置顶成功"})
}

// GetPinnedMessages 获取置顶消息
// GET /api/v1/messages/pinned
func (h *Handler) GetPinnedMessages(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	messages, err := h.svc.GetPinnedMessages(c.Request.Context(), tenantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_PINNED_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": messages})
}

// RecallMessage 撤回消息
// POST /api/v1/messages/:id/recall
func (h *Handler) RecallMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	result, err := h.svc.RecallMessage(c.Request.Context(), tenantID, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "RECALL_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": result})
}

// GetDeliveryStatus 获取投递状态
// GET /api/v1/messages/:id/status
func (h *Handler) GetDeliveryStatus(c *gin.Context) {
	id := c.Param("id")

	status, err := h.svc.GetDeliveryStatus(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_STATUS_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": status})
}

// ============== Announcement Routes ==============

// CreateAnnouncement 创建公告
// POST /api/v1/announcements
func (h *Handler) CreateAnnouncement(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	userName := h.getUserName()

	var req CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": err.Error()})
		return
	}

	ann, err := h.ann.Create(c.Request.Context(), tenantID, userID, userName, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "CREATE_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"code": "SUCCESS", "message": "公告创建成功", "data": ann})
}

// ListAnnouncements 获取公告列表
// GET /api/v1/announcements
func (h *Handler) ListAnnouncements(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	limit := 20
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	announcements, err := h.ann.List(c.Request.Context(), tenantID, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "LIST_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": announcements})
}

// GetAnnouncement 获取公告详情
// GET /api/v1/announcements/:id
func (h *Handler) GetAnnouncement(c *gin.Context) {
	tenantID := h.getTenantID()
	id := c.Param("id")

	ann, err := h.ann.Get(c.Request.Context(), tenantID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_FAILED", "message": err.Error()})
		return
	}
	if ann == nil {
		c.JSON(http.StatusNotFound, gin.H{"code": "NOT_FOUND", "message": "公告不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": ann})
}

// MarkAnnouncementRead 标记公告已读
// PUT /api/v1/announcements/:id/read
func (h *Handler) MarkAnnouncementRead(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	id := c.Param("id")

	if err := h.ann.MarkAsRead(c.Request.Context(), tenantID, id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "MARK_READ_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "标记已读成功"})
}

// GetAnnouncementUnreadCount 获取公告未读数
// GET /api/v1/announcements/unread-count
func (h *Handler) GetAnnouncementUnreadCount(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	count, err := h.ann.GetUnreadCount(c.Request.Context(), tenantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_COUNT_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": gin.H{"unread": count}})
}

// ============== Notification Preferences Routes ==============

// GetPreferences 获取通知偏好
// GET /api/v1/notifications/preferences
func (h *Handler) GetPreferences(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	pref, err := h.notif.GetPreferences(c.Request.Context(), tenantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "GET_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": pref})
}

// UpdatePreferences 更新通知偏好
// PUT /api/v1/notifications/preferences
func (h *Handler) UpdatePreferences(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()

	var req UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": err.Error()})
		return
	}

	if err := h.notif.UpdatePreferences(c.Request.Context(), tenantID, userID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "UPDATE_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "更新成功"})
}

// ============== Group Message Routes ==============

// SendGroupMessage 发送群消息
// POST /api/v1/group-messages
func (h *Handler) SendGroupMessage(c *gin.Context) {
	tenantID := h.getTenantID()
	userID := h.getUserID()
	userName := h.getUserName()

	var req SendGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": err.Error()})
		return
	}

	msg, err := h.group.SendMessage(c.Request.Context(), tenantID, userID, userName, "user", &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "SEND_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"code": "SUCCESS", "message": "消息发送成功", "data": msg})
}

// ListGroupMessages 获取群消息列表
// GET /api/v1/group-messages/:group_id
func (h *Handler) ListGroupMessages(c *gin.Context) {
	tenantID := h.getTenantID()
	groupID := c.Param("group_id")

	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := parseInt(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	messages, err := h.group.ListMessages(c.Request.Context(), tenantID, groupID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": "LIST_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "data": messages})
}

// Helper function to parse int
func parseInt(s string) (int, error) {
	var n int
	_, err := parseIntFmt(s, &n)
	return n, err
}

func parseIntFmt(s string, n *int) (int, error) {
	parsed, err := parseIntImpl(s)
	if err != nil {
		return 0, err
	}
	*n = parsed
	return parsed, nil
}

func parseIntImpl(s string) (int, error) {
	var n int64
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, nil
		}
		n = n*10 + int64(c-'0')
	}
	return int(n), nil
}

// Ensure uuid is used
var _ = uuid.New
