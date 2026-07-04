package handler

import (
	"strconv"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
	"github.com/ai-office/api/internal/model"
)

type KnowledgeHandler struct{ db *gorm.DB }
func NewKnowledgeHandler(db *gorm.DB) *KnowledgeHandler { return &KnowledgeHandler{db} }

func crudList[T any](db *gorm.DB, c *gin.Context, model T) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	var items []T; var total int64
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1")); ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	db.Model(&model).Where("enterprise_id=?", eid).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&items)
	response.SuccessWithMeta(c, items, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}

func crudCreate[T any](db *gorm.DB, c *gin.Context, model T) {
	eid := c.Param("enterprise_id"); if eid == "" { response.Error(c, errors.ErrTenantRequired); return }
	if err := c.ShouldBindJSON(&model); err != nil { response.ValidationError(c, "body", "格式错误"); return }
	if err := db.Create(&model).Error; err != nil { response.Error(c, errors.ErrInternal); return }
	response.Created(c, model)
}

func (h *KnowledgeHandler) UploadFile(c *gin.Context)    { crudCreate(h.db, c, model.FileRecord{}) }
func (h *KnowledgeHandler) ListFiles(c *gin.Context)     { crudList(h.db, c, model.FileRecord{}) }
func (h *KnowledgeHandler) SendMessage(c *gin.Context)   { crudCreate(h.db, c, model.Message{}) }
func (h *KnowledgeHandler) ListMessages(c *gin.Context)  { crudList(h.db, c, model.Message{}) }
func (h *KnowledgeHandler) CreateDoc(c *gin.Context)     { crudCreate(h.db, c, model.KnowledgeDoc{}) }
func (h *KnowledgeHandler) ListDocs(c *gin.Context)      { crudList(h.db, c, model.KnowledgeDoc{}) }
func (h *KnowledgeHandler) CreateCategory(c *gin.Context) { crudCreate(h.db, c, model.KBCategory{}) }
func (h *KnowledgeHandler) ListCategories(c *gin.Context) { crudList(h.db, c, model.KBCategory{}) }
