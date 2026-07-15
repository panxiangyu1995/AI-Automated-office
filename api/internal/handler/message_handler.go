package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type MessageHandler struct {
	msgService *service.MessageService
}

func NewMessageHandler(msgService *service.MessageService) *MessageHandler {
	return &MessageHandler{msgService: msgService}
}

func (h *MessageHandler) Get(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	msgID := c.Param("id")
	if msgID == "" {
		response.ValidationError(c, "id", "消息ID不能为空")
		return
	}
	msg, appErr := h.msgService.GetByID(eid, msgID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, msg)
}

func (h *MessageHandler) Send(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)

	var req service.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	msg, appErr := h.msgService.Send(eid, userIDStr, req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, msg)
}

func (h *MessageHandler) List(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	msgs, total, appErr := h.msgService.List(eid, userIDStr, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, msgs, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *MessageHandler) Unread(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	count, appErr := h.msgService.UnreadCount(eid, userIDStr)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"unread_count": count})
}

func (h *MessageHandler) MarkRead(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	msgID := c.Param("id")
	if msgID == "" {
		response.ValidationError(c, "id", "消息ID不能为空")
		return
	}

	appErr := h.msgService.MarkRead(msgID, eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"message": "已标记为已读"})
}

func (h *MessageHandler) Poll(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	timeout, _ := strconv.Atoi(c.DefaultQuery("timeout", "5"))

	msgs, appErr := h.msgService.Poll(eid, userIDStr, timeout)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, msgs)
}

func (h *MessageHandler) CreateAnnouncement(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)

	var req struct {
		Title      string `json:"title" binding:"required"`
		Content    string `json:"content" binding:"required"`
		Priority   string `json:"priority"`
		TargetType string `json:"target_type"`
		TargetID   string `json:"target_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	ann, appErr := h.msgService.CreateAnnouncement(eid, userIDStr, req.Title, req.Content, req.Priority, req.TargetType, req.TargetID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, ann)
}

func (h *MessageHandler) ListAnnouncements(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	anns, total, appErr := h.msgService.ListAnnouncements(eid, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, anns, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
