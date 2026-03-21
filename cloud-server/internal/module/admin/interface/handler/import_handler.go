package handler

import (
	"net/http"

	"cloud-server/internal/module/admin/application/dto"
	"cloud-server/internal/module/admin/application/service"
	auditService "cloud-server/internal/module/audit/application/service"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ImportHandler 导入处理器
type ImportHandler struct {
	ImportService      *service.ImportService
	ImportCommitService *service.ImportCommitService
	AuditService       *auditService.AuditService
	Logger             *zap.Logger
}

// NewImportHandler 创建导入处理器
func NewImportHandler(
	importService *service.ImportService,
	importCommitService *service.ImportCommitService,
	auditSvc *auditService.AuditService,
	logger *zap.Logger,
) *ImportHandler {
	return &ImportHandler{
		ImportService:       importService,
		ImportCommitService: importCommitService,
		AuditService:        auditSvc,
		Logger:              logger,
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

	// 获取操作者信息
	operatorID, _ := c.Get("user_id")
	operatorName, _ := c.Get("username")
	operatorIDStr := ""
	if operatorID != nil {
		operatorIDStr = operatorID.(string)
	}
	operatorNameStr := ""
	if operatorName != nil {
		operatorNameStr = operatorName.(string)
	}

	// 调用提交服务
	result, err := h.ImportCommitService.ConfirmImport(
		c.Request.Context(),
		uuid.MustParse(tenantID),
		&req,
	)
	if err != nil {
		h.Logger.Error("confirm import failed", zap.Error(err))
		switch err.Error() {
		case "BATCH_NOT_FOUND":
			response.Error(c, http.StatusNotFound, "BATCH_NOT_FOUND", "导入批次不存在", nil)
		case "BATCH_ALREADY_PROCESSED":
			response.Error(c, http.StatusBadRequest, "BATCH_ALREADY_PROCESSED", "该批次已处理完成", nil)
		case "BATCH_EXPIRED":
			response.Error(c, http.StatusBadRequest, "BATCH_EXPIRED", "导入批次已过期，请重新上传", nil)
		case "IMPORT_IN_PROGRESS":
			response.Error(c, http.StatusConflict, "IMPORT_IN_PROGRESS", "导入正在处理中，请稍后查询结果", nil)
		default:
			response.Error(c, http.StatusInternalServerError, "IMPORT_FAILED", "导入失败: "+err.Error(), nil)
		}
		return
	}

	// 记录审计日志
	if h.AuditService != nil {
		h.AuditService.LogImport(
			c.Request.Context(),
			tenantID,
			operatorIDStr,
			operatorNameStr,
			"user",
			req.BatchID,
			result.TotalRows,
			result.SuccessRows,
			result.FailedRows,
		)
	}

	response.Success(c, result, "导入完成")
}

// GetImportReceipt 获取导入回执
// GET /api/admin/users/import/:batch_id/receipt
func (h *ImportHandler) GetImportReceipt(c *gin.Context) {
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

	receipt, err := h.ImportCommitService.GetReceipt(
		c.Request.Context(),
		uuid.MustParse(tenantID),
		batchID,
	)
	if err != nil {
		h.Logger.Error("get receipt failed", zap.Error(err))
		response.Error(c, http.StatusNotFound, "RECEIPT_NOT_FOUND", "回执不存在", nil)
		return
	}

	response.Success(c, receipt, "获取导入回执成功")
}

// DownloadReceiptExcel 下载回执 Excel 文件
// GET /api/admin/users/import/:batch_id/receipt/download
func (h *ImportHandler) DownloadReceiptExcel(c *gin.Context) {
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

	receipt, err := h.ImportCommitService.GetReceipt(
		c.Request.Context(),
		uuid.MustParse(tenantID),
		batchID,
	)
	if err != nil {
		h.Logger.Error("get receipt failed", zap.Error(err))
		response.Error(c, http.StatusNotFound, "RECEIPT_NOT_FOUND", "回执不存在", nil)
		return
	}

	// TODO: 生成 Excel 文件
	// 目前返回 JSON 数据
	c.Header("Content-Disposition", "attachment; filename=import_receipt_"+batchID+".json")
	c.JSON(http.StatusOK, receipt)
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

// GetImportProgress 获取导入进度
// GET /api/admin/users/import/:batch_id/progress
func (h *ImportHandler) GetImportProgress(c *gin.Context) {
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

	// TODO: 实现进度查询
	_ = tenantID

	response.Success(c, &dto.ImportProgressResponse{
		BatchID:       batchID,
		Status:        "completed",
		TotalRows:     0,
		ProcessedRows: 0,
		SuccessRows:   0,
		FailedRows:    0,
		Progress:      100,
	}, "获取导入进度成功")
}

// isValidExcelFile 检查是否为有效的 Excel 文件
func isValidExcelFile(filename string) bool {
	return len(filename) > 5 && filename[len(filename)-5:] == ".xlsx"
}
