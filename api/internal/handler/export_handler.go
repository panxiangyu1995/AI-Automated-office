package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type ExportHandler struct {
	svc    *service.ExportService
	worker *service.ExportWorker
}

func NewExportHandler(svc *service.ExportService, worker *service.ExportWorker) *ExportHandler {
	return &ExportHandler{svc: svc, worker: worker}
}

func (h *ExportHandler) CreateTask(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	userID := middleware.GetUserID(c)
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized)
		return
	}

	userRole := middleware.GetRole(c)

	var req service.CreateExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}

	task, appErr := h.svc.CreateTask(eid, userID, userRole, req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	h.worker.Enqueue(task.ID.String())

	response.Created(c, task)
}

func (h *ExportHandler) GetTask(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	taskID := c.Param("id")
	task, appErr := h.svc.GetTask(eid, taskID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, task)
}

func (h *ExportHandler) ListTasks(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	tasks, total, appErr := h.svc.ListTasks(eid, page, pageSize)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, tasks, &response.MetaInfo{
		Page:       page,
		PageSize:   pageSize,
		TotalCount: total,
	})
}

func (h *ExportHandler) DownloadTask(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	userID := middleware.GetUserID(c)
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized)
		return
	}

	taskID := c.Param("id")
	task, appErr := h.svc.DownloadTask(eid, userID, taskID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{
		"task_id":   task.ID,
		"file_key":  task.FileKey,
		"file_size": task.FileSize,
		"format":    task.Format,
		"status":    task.Status,
	})
}
