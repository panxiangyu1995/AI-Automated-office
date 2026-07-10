package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type BackupHandler struct {
	backupService *service.BackupService
}

func NewBackupHandler(backupService *service.BackupService) *BackupHandler {
	return &BackupHandler{backupService: backupService}
}

type createConfigRequest struct {
	BackupTime      string `json:"backup_time"`
	BackupDirectory string `json:"backup_directory"`
	RetentionDays   int    `json:"retention_days"`
	Enabled         bool   `json:"enabled"`
}

type updateConfigRequest struct {
	BackupTime      string `json:"backup_time"`
	BackupDirectory string `json:"backup_directory"`
	RetentionDays   int    `json:"retention_days"`
	Enabled         bool   `json:"enabled"`
}

func (h *BackupHandler) CreateConfig(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	var req createConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	config, appErr := h.backupService.CreateConfig(enterpriseID, req.BackupTime, req.BackupDirectory, req.RetentionDays, req.Enabled)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, config)
}

func (h *BackupHandler) UpdateConfig(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	configID := c.Param("id")
	if configID == "" {
		response.ValidationError(c, "id", "配置ID不能为空")
		return
	}

	var req updateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	config, appErr := h.backupService.UpdateConfig(configID, enterpriseID, req.BackupTime, req.BackupDirectory, req.RetentionDays, req.Enabled)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, config)
}

func (h *BackupHandler) DeleteConfig(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	configID := c.Param("id")
	if configID == "" {
		response.ValidationError(c, "id", "配置ID不能为空")
		return
	}

	appErr := h.backupService.DeleteConfig(configID, enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *BackupHandler) GetConfig(c *gin.Context) {
	configID := c.Param("id")
	if configID == "" {
		response.ValidationError(c, "id", "配置ID不能为空")
		return
	}

	config, appErr := h.backupService.GetConfig(configID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, config)
}

func (h *BackupHandler) ListConfigs(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	configs, appErr := h.backupService.ListConfigs(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, configs)
}

func (h *BackupHandler) ListRecords(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	records, total, appErr := h.backupService.ListRecords(enterpriseID, page, pageSize)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, records, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}

func (h *BackupHandler) TriggerBackup(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	record, appErr := h.backupService.TriggerBackup(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, record)
}

func (h *BackupHandler) Restore(c *gin.Context) {
	recordID := c.Param("record_id")
	if recordID == "" {
		response.ValidationError(c, "record_id", "备份记录ID不能为空")
		return
	}

	appErr := h.backupService.Restore(recordID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{"message": "恢复成功"})
}
