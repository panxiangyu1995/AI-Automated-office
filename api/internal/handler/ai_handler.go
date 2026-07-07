package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type AIHandler struct{ svc *service.AIService }
func NewAIHandler(svc *service.AIService) *AIHandler { return &AIHandler{svc} }

func (h *AIHandler) CreateSession(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ UserID, Title, Model string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sess, appErr := h.svc.CreateSession(eid, req.UserID, req.Title, req.Model)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sess)
}

func (h *AIHandler) ListSessions(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	sessions, appErr := h.svc.ListSessions(eid, c.Query("user_id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, sessions)
}

func (h *AIHandler) SendMessage(c *gin.Context) {
	sessionID := c.Param("session_id"); if sessionID == "" { response.ValidationError(c, "session_id", "不能为空"); return }
	var req struct{ Content string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	msg, appErr := h.svc.SendMessage(sessionID, "user", req.Content)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, msg)
}

func (h *AIHandler) GetMessages(c *gin.Context) {
	sessionID := c.Param("session_id"); if sessionID == "" { response.ValidationError(c, "session_id", "不能为空"); return }
	msgs, appErr := h.svc.GetMessages(sessionID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, msgs)
}

func (h *AIHandler) UpdatePreference(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct{ Key, Value string }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	sess, appErr := h.svc.UpdatePreference(eid, c.GetString("user_id"), req.Key, req.Value)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, sess)
}
