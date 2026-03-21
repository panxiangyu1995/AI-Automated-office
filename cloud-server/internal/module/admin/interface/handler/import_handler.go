package handler

import (
	"net/http"

	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ImportHandler 导入处理器
type ImportHandler struct {
	ImportService *service.ImportService
	Logger        *zap.Logger
}

// NewImportHandler 创建导入处理器
func NewImportHandler(importService *service.ImportService, logger *zap.Logger) *ImportHandler {
	return &ImportHandler{
		ImportService: importService,
		Logger:        logger,
	}
}

// GetTemplate 获取导入模板
// GET /api/admin/users/import/template
func (h *ImportHandler) GetTemplate(c *gin.Context) {
	template := h.ImportService.GetTemplate()
	response.Success(c, template, "获取导入模板成功")
}

// UploadAndPreview 上传并预览导入文件
// POST /api/admin/users/import/preview
func (h *ImportHandler) UploadAndPreview(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_FILE", "请上传有效的Excel文件", nil)
		return
	}
	defer file.Close()

	// 检查文件类型
	if !isValidExcelFile(header.Filename) {
		response.Error(c, http.StatusBadRequest, "INVALID_FILE_TYPE", "仅支持.xlsx格式的Excel文件", nil)
		return
	}

	// 解析并预览
	result, err := h.ImportService.PreviewImport(
		c.Request.Context(),
		uuid.MustParse(tenantID),
		file,
		header.Filename,
	)
	if err != nil {
		h.Logger.Error("preview import failed", zap.Error(err))
		response.Error(c, http.StatusInternalServerError, "PREVIEW_FAILED", "预览失败: "+err.Error(), nil)
		return
	}

	response.Success(c, result, "导入预览成功")
}

// GetImportTemplateDownload 下载导入模板文件
// GET /api/admin/users/import/template/download
func (h *ImportHandler) GetImportTemplateDownload(c *gin.Context) {
	// 生成 Excel 模板
	template := h.ImportService.GetTemplate()
	
	// TODO: 生成实际的 Excel 文件并返回
	// 目前返回字段定义
	response.Success(c, gin.H{
		"message": "模板下载功能待实现",
		"fields":  template.Fields,
	}, "获取模板下载信息成功")
}

// ConfirmImport 确认导入
// POST /api/admin/users/import/confirm
func (h *ImportHandler) ConfirmImport(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	var req dto.ConfirmImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效", nil)
		return
	}

	// TODO: 实现确认导入逻辑
	// 1. 验证批次是否存在且未过期
	// 2. 幂等性检查（通过 idempotency_key）
	// 3. 执行导入
	// 4. 记录审计日志

	response.Success(c, &dto.ConfirmImportResponse{
		BatchID: req.BatchID,
		Status:  "processing",
		Message: "导入任务已提交，正在处理中",
	}, "导入确认成功")
}

// GetImportBatchList 获取导入批次列表
// GET /api/admin/users/import/batches
func (h *ImportHandler) GetImportBatchList(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	// TODO: 实现批次列表查询
	_ = tenantID // 避免未使用变量警告

	response.Success(c, &dto.ImportBatchListResponse{
		Items: []dto.ImportBatchListItem{},
		Total: 0,
	}, "获取导入批次列表成功")
}

// GetImportBatchDetail 获取导入批次详情
// GET /api/admin/users/import/batches/:batch_id
func (h *ImportHandler) GetImportBatchDetail(c *gin.Context) {
	tenantID := getTenantID(c)
	if tenantID == "" {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "租户信息缺失", nil)
		return
	}

	batchID := c.Param("batch_id")
	if batchID == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_BATCH_ID", "批次ID不能为空", nil)
		return
	}

	// TODO: 实现批次详情查询
	_ = tenantID // 避免未使用变量警告

	response.Success(c, gin.H{
		"batch_id": batchID,
		"message":  "批次详情查询功能待实现",
	}, "获取导入批次详情成功")
}

// isValidExcelFile 检查是否为有效的 Excel 文件
func isValidExcelFile(filename string) bool {
	return len(filename) > 5 && filename[len(filename)-5:] == ".xlsx"
}