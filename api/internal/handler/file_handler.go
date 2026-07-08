package handler

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type FileHandler struct {
	fileService *service.FileService
}

func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{fileService: fileService}
}

func (h *FileHandler) Upload(c *gin.Context) {
	eid := c.Param("enterprise_id")
	if eid == "" {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.ValidationError(c, "file", "请选择文件")
		return
	}
	defer file.Close()

	userIDStr := c.GetString(middleware.ContextKeyUserID)
	refType := c.PostForm("ref_type")
	refID := c.PostForm("ref_id")

	fm, appErr := h.fileService.Upload(eid, header.Filename, header.Header.Get("Content-Type"), userIDStr, refType, refID, header.Size, file)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, fm)
}

func (h *FileHandler) Preview(c *gin.Context) {
	fileKey := c.Param("file_key")
	if fileKey == "" {
		response.ValidationError(c, "file_key", "文件key不能为空")
		return
	}

	fm, appErr := h.fileService.GetByStorageKey(fileKey)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	if _, err := os.Stat(fm.StoragePath); os.IsNotExist(err) {
		response.Error(c, apperrors.ErrNotFound.WithDetail("文件不存在于存储"))
		return
	}

	contentType := fm.MimeType
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", fm.OriginalName))
	c.File(fm.StoragePath)
}

func (h *FileHandler) View(c *gin.Context) {
	fileKey := c.Param("file_key")
	fm, appErr := h.fileService.GetByStorageKey(fileKey)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	url := fmt.Sprintf("/api/v1/files/%s/preview", fm.StorageKey)
	c.Redirect(http.StatusFound, url)
}

func (h *FileHandler) Download(c *gin.Context) {
	fileKey := c.Param("file_key")
	fm, appErr := h.fileService.GetByStorageKey(fileKey)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	if _, err := os.Stat(fm.StoragePath); os.IsNotExist(err) {
		response.Error(c, apperrors.ErrNotFound.WithDetail("文件不存在于存储"))
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fm.OriginalName))
	c.File(fm.StoragePath)
}
