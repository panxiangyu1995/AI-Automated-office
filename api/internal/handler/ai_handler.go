package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type AIHandler struct {
	svc                *service.AIService
	contextInjectionSvc *service.ContextInjectionService
}
func NewAIHandler(svc *service.AIService, contextInjectionSvc *service.ContextInjectionService) *AIHandler {
	return &AIHandler{svc: svc, contextInjectionSvc: contextInjectionSvc}
}

// svcFor returns an AIService bound to the request's tenant database.
func (h *AIHandler) svcFor(c *gin.Context) *service.AIService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewAIServiceWithContext(repository.NewAIRepository(db), h.contextInjectionSvc)
	}
	return h.svc
}

func (h *AIHandler) CreateSession(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct {
		Title string `json:"title"`
		Model string `json:"model"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	userID := c.GetString(middleware.ContextKeyUserID)
	sess, appErr := h.svcFor(c).CreateSession(eid, userID, req.Title, req.Model)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, sess)
}

func (h *AIHandler) ListSessions(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	sessions, appErr := h.svcFor(c).ListSessions(eid, c.Query("user_id"))
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, sessions)
}

func (h *AIHandler) SendMessage(c *gin.Context) {
	sessionID := c.Param("session_id"); if sessionID == "" { response.ValidationError(c, "session_id", "不能为空"); return }
	var req struct{ Content string `json:"content"` }
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	eid := middleware.GetEnterpriseID(c)
	msg, appErr := h.svcFor(c).SendMessageWithEnterprise(sessionID, "user", req.Content, eid)
	if appErr != nil { response.Error(c, appErr); return }
	response.Created(c, msg)
}

func (h *AIHandler) GetMessages(c *gin.Context) {
	sessionID := c.Param("session_id"); if sessionID == "" { response.ValidationError(c, "session_id", "不能为空"); return }
	msgs, appErr := h.svcFor(c).GetMessages(sessionID)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, msgs)
}

func (h *AIHandler) UpdatePreference(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var req struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	userID := c.GetString(middleware.ContextKeyUserID)
	sess, appErr := h.svcFor(c).UpdatePreference(eid, userID, req.Key, req.Value)
	if appErr != nil { response.Error(c, appErr); return }
	response.Success(c, sess)
}
