package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	apperrors "github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type CustomFieldHandler struct {
	cfService *service.CustomFieldService
}

func NewCustomFieldHandler(cfService *service.CustomFieldService) *CustomFieldHandler {
	return &CustomFieldHandler{cfService: cfService}
}

func (h *CustomFieldHandler) ListFields(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, err := uuid.Parse(entIDStr)
	if err != nil {
		response.Error(c, apperrors.ErrTenantRequired)
		return
	}

	entityType := c.Param("type")
	if entityType == "" {
		response.ValidationError(c, "type", "实体类型不能为空")
		return
	}

	fields, appErr := h.cfService.ListFields(entID, entityType)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, fields)
}

func (h *CustomFieldHandler) SetCustomFields(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entityType := c.Param("type")
	entityID := c.Param("id")

	var fields map[string]interface{}
	if err := c.ShouldBindJSON(&fields); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	appErr := h.cfService.SetCustomFields(entIDStr, entityType, entityID, fields)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"message": "自定义字段已更新"})
}

func (h *CustomFieldHandler) GetRelations(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)
	entityType := c.Param("type")
	entityID := c.Param("id")
	relationName := c.Param("name")

	rels, appErr := h.cfService.GetRelations(entID, entityType, entityID, relationName)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, rels)
}

func (h *CustomFieldHandler) CreateField(c *gin.Context) {
	entIDStr := c.GetString(middleware.ContextKeyEnterpriseID)
	entID, _ := uuid.Parse(entIDStr)

	var req struct {
		EntityType string `json:"entity_type" binding:"required"`
		FieldName  string `json:"field_name" binding:"required"`
		FieldType  string `json:"field_type" binding:"required"`
		Label      string `json:"label"`
		Required   bool   `json:"required"`
		Options    string `json:"options"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	field := &model.FieldDefinition{
		EntityType: req.EntityType,
		FieldName:  req.FieldName,
		FieldType:  req.FieldType,
		Label:      req.Label,
		Required:   req.Required,
		Options:    req.Options,
	}
	field.EnterpriseID = entID

	if appErr := h.cfService.CreateField(field); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, field)
}
