package handler

import (
	"github.com/gin-gonic/gin"

	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/notification"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type NotificationHandler struct {
	notifService *notification.NotificationService
}

func NewNotificationHandler(notifService *notification.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifService: notifService}
}

func (h *NotificationHandler) SendSMS(c *gin.Context) {
	var req struct {
		Phone        string            `json:"phone" binding:"required"`
		TemplateCode string            `json:"template_code" binding:"required"`
		Params       map[string]string `json:"params"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	if err := h.notifService.SendSMS(req.Phone, req.TemplateCode, req.Params); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("短信发送失败: "+err.Error()))
		return
	}
	response.Success(c, gin.H{"message": "短信已发送"})
}

func (h *NotificationHandler) SendEmail(c *gin.Context) {
	var req struct {
		To      string `json:"to" binding:"required"`
		Subject string `json:"subject" binding:"required"`
		Body    string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	if err := h.notifService.SendEmail(req.To, req.Subject, req.Body); err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("邮件发送失败: "+err.Error()))
		return
	}
	response.Success(c, gin.H{"message": "邮件已发送"})
}
