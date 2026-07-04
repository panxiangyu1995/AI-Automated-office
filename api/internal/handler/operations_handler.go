package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
	"github.com/ai-office/api/internal/model"
)

type OperationsHandler struct{ db *gorm.DB }
func NewOperationsHandler(db *gorm.DB) *OperationsHandler { return &OperationsHandler{db} }

func opList[T any](db *gorm.DB, c *gin.Context, model T) {
	var items []T; var total int64
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	db.Model(&model).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items)
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func opCreate[T any](db *gorm.DB, c *gin.Context, model T) {
	if err := c.ShouldBindJSON(&model); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if err := db.Create(&model).Error; err != nil { response.Error(c, errors.ErrInternal); return }
	response.Created(c, model)
}

func (h *OperationsHandler) ListPlans(c *gin.Context)        { opList(h.db, c, model.SubscriptionPlan{}) }
func (h *OperationsHandler) CreatePlan(c *gin.Context)       { opCreate(h.db, c, model.SubscriptionPlan{}) }
func (h *OperationsHandler) ListSubs(c *gin.Context)         { opList(h.db, c, model.EnterpriseSubscription{}) }
func (h *OperationsHandler) CreateSub(c *gin.Context)        { opCreate(h.db, c, model.EnterpriseSubscription{}) }
func (h *OperationsHandler) ListWebhooks(c *gin.Context)     { opList(h.db, c, model.Webhook{}) }
func (h *OperationsHandler) CreateWebhook(c *gin.Context)    { opCreate(h.db, c, model.Webhook{}) }
func (h *OperationsHandler) ListAuditLogs(c *gin.Context)    { opList(h.db, c, model.AuditLogEntry{}) }
func (h *OperationsHandler) Dashboard(c *gin.Context) {
	response.Success(c, gin.H{
		"enterprises": 0, "users": 0, "revenue": 0,
		"message": "Dashboard data available when DB is connected",
	})
}
