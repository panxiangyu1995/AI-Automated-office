package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type DeviceAuthHandler struct {
	deviceAuthService *service.DeviceAuthService
}

func NewDeviceAuthHandler(deviceAuthService *service.DeviceAuthService) *DeviceAuthHandler {
	return &DeviceAuthHandler{deviceAuthService: deviceAuthService}
}

func (h *DeviceAuthHandler) GenerateDeviceCode(c *gin.Context) {
	var req service.DeviceCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	resp, appErr := h.deviceAuthService.GenerateDeviceCode(req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, resp)
}

func (h *DeviceAuthHandler) ExchangeToken(c *gin.Context) {
	var req service.DeviceTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	resp, appErr := h.deviceAuthService.ExchangeToken(req)
	if appErr != nil {
		if appErr.Code == "AUTH_DEVICE_PENDING" {
			c.JSON(appErr.Status, gin.H{
				"error":             "authorization_pending",
				"error_description": appErr.Message,
			})
			return
		}
		response.Error(c, appErr)
		return
	}

	response.Success(c, resp)
}

func (h *DeviceAuthHandler) VerifyDeviceCode(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		response.Error(c, apperrors.ErrUnauthorized)
		return
	}

	var req struct {
		UserCode string `json:"user_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "user_code", "用户码不能为空")
		return
	}

	dc, err := h.deviceAuthService.FindByUserCode(req.UserCode)
	if err != nil {
		response.Error(c, apperrors.ErrInternal.WithDetail("查询设备码失败"))
		return
	}
	if dc == nil {
		response.Error(c, apperrors.ErrNotFound.WithDetail("无效的用户码"))
		return
	}

	if err := h.deviceAuthService.VerifyDeviceCode(dc.DeviceCode, userIDStr); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{"message": "设备已授权"})
}
