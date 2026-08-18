package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
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

// svcFor returns a MessageService bound to the request's tenant database.
func (h *MessageHandler) svcFor(c *gin.Context) *service.MessageService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewMessageService(
			repository.NewMessageRepository(db),
			repository.NewAnnouncementRepository(db),
			nil,
		)
	}
	return h.msgService
}

func (h *MessageHandler) Get(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}
	msgID := c.Param("id")
	if msgID == "" {
		response.ValidationError(c, "id", "消息ID不能为空")
		return
	}
	msg, appErr := h.svcFor(c).GetByID(eid, msgID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, msg)
}

func (h *MessageHandler) Send(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
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

	msg, appErr := h.svcFor(c).Send(eid, userIDStr, req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, msg)
}

func (h *MessageHandler) List(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	msgs, total, appErr := h.svcFor(c).List(eid, userIDStr, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, msgs, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func (h *MessageHandler) Unread(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	count, appErr := h.svcFor(c).UnreadCount(eid, userIDStr)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"unread_count": count})
}

func (h *MessageHandler) MarkRead(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	msgID := c.Param("id")
	if msgID == "" {
		response.ValidationError(c, "id", "消息ID不能为空")
		return
	}

	appErr := h.svcFor(c).MarkRead(msgID, eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"message": "已标记为已读"})
}

func (h *MessageHandler) BatchMarkRead(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	var raw struct {
		MessageIDsRaw []string `json:"message_ids"`
	}
	if err := c.ShouldBindJSON(&raw); err != nil {
		response.ValidationError(c, "message_ids", "消息ID列表不能为空")
		return
	}
	ids := raw.MessageIDsRaw
	if len(ids) == 0 {
		response.ValidationError(c, "message_ids", "消息ID列表不能为空")
		return
	}

	count, appErr := h.svcFor(c).BatchMarkRead(ids, eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"marked_count": count})
}

func (h *MessageHandler) Poll(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	since := c.Query("since")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	msgs, appErr := h.svcFor(c).Poll(eid, userIDStr, since, limit)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, msgs)
}

func (h *MessageHandler) CreateAnnouncement(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
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

	ann, appErr := h.svcFor(c).CreateAnnouncement(eid, userIDStr, req.Title, req.Content, req.Priority, req.TargetType, req.TargetID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, ann)
}

func (h *MessageHandler) ListAnnouncements(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	anns, total, appErr := h.svcFor(c).ListAnnouncements(eid, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, anns, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
