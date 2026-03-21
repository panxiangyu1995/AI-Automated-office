package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/audit/application/service"
	"cloud-server/internal/module/audit/domain/repository"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
)

// AuditHandler 审计日志处理器
type AuditHandler struct {
	logger     *service.AuditLogger
	repo       repository.AuditLogRepository
	zap        *zap.Logger
	auditSvc   *service.AuditService
}

// NewAuditHandler 创建审计日志处理器
func NewAuditHandler(
	logger *service.AuditLogger,
	repo repository.AuditLogRepository,
	zap *zap.Logger,
	auditSvc *service.AuditService,
) *AuditHandler {
	return &AuditHandler{
		logger:   logger,
		repo:     repo,
		zap:      zap,
		auditSvc: auditSvc,
	}
}

// AuditLogListResponse 审计日志列表响应
type AuditLogListResponse struct {
	List  []AuditLogItem `json:"list"`
	Total int64          `json:"total"`
}

// AuditLogItem 审计日志项
type AuditLogItem struct {
	ID           string    `json:"id"`
	TenantID     string    `json:"tenant_id"`
	OperatorID   string    `json:"operator_id,omitempty"`
	OperatorName string    `json:"operator_name,omitempty"`
	TargetID     string    `json:"target_id,omitempty"`
	TargetType   string    `json:"target_type,omitempty"`
	EventType    string    `json:"event_type"`
	Resource     string    `json:"resource"`
	Action       string    `json:"action"`
	Result       string    `json:"result"`
	IPAddress    string    `json:"ip_address,omitempty"`
	UserAgent    string    `json:"user_agent,omitempty"`
	TraceID      string    `json:"trace_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// AuditLogDetailResponse 审计日志详情响应
type AuditLogDetailResponse struct {
	ID           string      `json:"id"`
	TenantID     string      `json:"tenant_id"`
	OperatorID   string      `json:"operator_id,omitempty"`
	OperatorName string      `json:"operator_name,omitempty"`
	TargetID     string      `json:"target_id,omitempty"`
	TargetType   string      `json:"target_type,omitempty"`
	EventType    string      `json:"event_type"`
	Resource     string      `json:"resource"`
	Action       string      `json:"action"`
	Result       string      `json:"result"`
	OldValues    interface{} `json:"old_values,omitempty"`
	NewValues    interface{} `json:"new_values,omitempty"`
	IPAddress    string      `json:"ip_address,omitempty"`
	UserAgent    string      `json:"user_agent,omitempty"`
	TraceID      string      `json:"trace_id,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

// List 获取审计日志列表
// @Summary 获取审计日志列表
// @Tags 审计
// @Accept json
// @Produce json
// @Param tenant_id query string false "租户ID"
// @Param operator_id query string false "操作人ID"
// @Param event_type query string false "事件类型"
// @Param resource query string false "资源类型"
// @Param action query string false "操作类型"
// @Param result query string false "结果(success/failure)"
// @Param start_time query string false "开始时间(RFC3339)"
// @Param end_time query string false "结束时间(RFC3339)"
// @Param page query int false "页码(默认1)"
// @Param page_size query int false "每页条数(默认20)"
// @Success 200 {object} AuditLogListResponse
// @Router /api/v1/audit/logs [get]
func (h *AuditHandler) List(c *gin.Context) {
	// 获取租户ID
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// 构建查询条件
	query := &repository.AuditLogQuery{
		TenantID:  tenantID.(string),
		Page:      1,
		PageSize:  20,
		OrderBy:   "created_at",
		OrderDesc: true,
	}

	// 解析查询参数
	if operatorID := c.Query("operator_id"); operatorID != "" {
		query.OperatorID = operatorID
	}
	if eventType := c.Query("event_type"); eventType != "" {
		query.EventType = eventType
	}
	if resource := c.Query("resource"); resource != "" {
		query.Resource = resource
	}
	if action := c.Query("action"); action != "" {
		query.Action = action
	}
	if result := c.Query("result"); result != "" {
		query.Result = result
	}

	// 解析时间范围
	if startTimeStr := c.Query("start_time"); startTimeStr != "" {
		if t, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			query.StartTime = &t
		}
	}
	if endTimeStr := c.Query("end_time"); endTimeStr != "" {
		if t, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			query.EndTime = &t
		}
	}

	// 解析分页参数
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			query.Page = page
		}
	}
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
			query.PageSize = pageSize
		}
	}

	// 查询审计日志
	logs, total, err := h.repo.List(c.Request.Context(), query)
	if err != nil {
		h.zap.Error("Failed to list audit logs", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list audit logs"})
		return
	}

	// 转换为响应格式
	items := make([]AuditLogItem, len(logs))
	for i, log := range logs {
		items[i] = AuditLogItem{
			ID:           log.ID,
			TenantID:     log.TenantID,
			OperatorID:   log.OperatorID,
			OperatorName: log.OperatorName,
			TargetID:     log.TargetID,
			TargetType:   log.TargetType,
			EventType:    log.EventType,
			Resource:     log.Resource,
			Action:       log.Action,
			Result:       log.Result,
			IPAddress:    log.IPAddress,
			UserAgent:    log.UserAgent,
			TraceID:      log.TraceID,
			CreatedAt:    log.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, AuditLogListResponse{
		List:  items,
		Total: total,
	})
}

// Get 获取审计日志详情
// @Summary 获取审计日志详情
// @Tags 审计
// @Accept json
// @Produce json
// @Param id path string true "审计日志ID"
// @Success 200 {object} AuditLogDetailResponse
// @Router /api/v1/audit/logs/{id} [get]
func (h *AuditHandler) Get(c *gin.Context) {
	// 获取租户ID
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	// 查询审计日志
	log, err := h.repo.FindByID(c.Request.Context(), id)
	if err != nil {
		h.zap.Error("Failed to get audit log", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "audit log not found"})
		return
	}

	// 验证租户
	if log.TenantID != tenantID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.JSON(http.StatusOK, AuditLogDetailResponse{
		ID:           log.ID,
		TenantID:     log.TenantID,
		OperatorID:   log.OperatorID,
		OperatorName: log.OperatorName,
		TargetID:     log.TargetID,
		TargetType:   log.TargetType,
		EventType:    log.EventType,
		Resource:     log.Resource,
		Action:       log.Action,
		Result:       log.Result,
		OldValues:    log.OldValues,
		NewValues:    log.NewValues,
		IPAddress:    log.IPAddress,
		UserAgent:    log.UserAgent,
		TraceID:      log.TraceID,
		CreatedAt:    log.CreatedAt,
	})
}

// Export 导出审计日志
// @Summary 导出审计日志
// @Tags 审计
// @Accept json
// @Produce octet-stream
// @Param tenant_id query string false "租户ID"
// @Param operator_id query string false "操作人ID"
// @Param event_type query string false "事件类型"
// @Param resource query string false "资源类型"
// @Param action query string false "操作类型"
// @Param result query string false "结果(success/failure)"
// @Param start_time query string false "开始时间(RFC3339)"
// @Param end_time query string false "结束时间(RFC3339)"
// @Param format query string false "导出格式(csv/excel,默认csv)"
// @Success 200 {file} file
// @Router /api/v1/audit/export [get]
func (h *AuditHandler) Export(c *gin.Context) {
	// 获取租户ID
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// 构建查询条件
	query := &repository.AuditLogQuery{
		TenantID:  tenantID.(string),
		Page:      1,
		PageSize:  10000, // 导出最多10000条
		OrderBy:   "created_at",
		OrderDesc: true,
	}

	// 解析查询参数
	if operatorID := c.Query("operator_id"); operatorID != "" {
		query.OperatorID = operatorID
	}
	if eventType := c.Query("event_type"); eventType != "" {
		query.EventType = eventType
	}
	if resource := c.Query("resource"); resource != "" {
		query.Resource = resource
	}
	if action := c.Query("action"); action != "" {
		query.Action = action
	}
	if result := c.Query("result"); result != "" {
		query.Result = result
	}

	// 解析时间范围
	if startTimeStr := c.Query("start_time"); startTimeStr != "" {
		if t, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			query.StartTime = &t
		}
	}
	if endTimeStr := c.Query("end_time"); endTimeStr != "" {
		if t, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			query.EndTime = &t
		}
	}

	// 查询审计日志
	logs, _, err := h.repo.List(c.Request.Context(), query)
	if err != nil {
		h.zap.Error("Failed to list audit logs for export", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to export audit logs"})
		return
	}

	// 根据格式导出
	format := c.DefaultQuery("format", "csv")
	switch format {
	case "excel":
		h.exportExcel(c, logs)
	default:
		h.exportCSV(c, logs)
	}
}

// exportCSV 导出CSV格式
func (h *AuditHandler) exportCSV(c *gin.Context, logs []*model.AuditLog) {
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=audit_logs_%s.csv", time.Now().Format("20060102150405")))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// 写入BOM以支持中文
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	// 写入表头
	headers := []string{"ID", "操作人", "事件类型", "资源", "操作", "结果", "IP地址", "时间"}
	writer.Write(headers)

	// 写入数据
	for _, al := range logs {
		row := []string{
			al.ID,
			al.OperatorName,
			al.EventType,
			al.Resource,
			al.Action,
			al.Result,
			al.IPAddress,
			al.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		writer.Write(row)
	}
}

// exportExcel 导出Excel格式
func (h *AuditHandler) exportExcel(c *gin.Context, logs []*model.AuditLog) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "审计日志"
	f.SetSheetName("Sheet1", sheet)

	// 设置表头
	headers := []string{"ID", "操作人", "事件类型", "资源", "操作", "结果", "IP地址", "时间"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetRowStyle(sheet, 1, 1, headerStyle)

	// 写入数据
	for i, al := range logs {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), al.ID)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), al.OperatorName)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), al.EventType)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), al.Resource)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), al.Action)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), al.Result)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), al.IPAddress)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), al.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	// 设置列宽
	f.SetColWidth(sheet, "A", "A", 36)
	f.SetColWidth(sheet, "B", "H", 15)

	// 写入响应
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=audit_logs_%s.xlsx", time.Now().Format("20060102150405")))

	f.Write(c.Writer)
}
