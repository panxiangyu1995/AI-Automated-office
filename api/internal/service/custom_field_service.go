package service

import (
	"encoding/json"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type CustomFieldService struct {
	fieldRepo    repository.CustomFieldRepository
	relationRepo repository.RelationRepository
}

func NewCustomFieldService(fieldRepo repository.CustomFieldRepository, relationRepo repository.RelationRepository) *CustomFieldService {
	return &CustomFieldService{fieldRepo: fieldRepo, relationRepo: relationRepo}
}

func (s *CustomFieldService) ListFields(enterpriseID uuid.UUID, entityType string) ([]model.FieldDefinition, *apperrors.AppError) {
	fields, err := s.fieldRepo.ListFieldsByEntity(enterpriseID, entityType)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询自定义字段失败")
	}
	return fields, nil
}

func (s *CustomFieldService) CreateField(field *model.FieldDefinition) *apperrors.AppError {
	if field.FieldName == "" {
		return apperrors.NewValidationError("field_name", "字段名不能为空")
	}
	if field.EntityType == "" {
		return apperrors.NewValidationError("entity_type", "实体类型不能为空")
	}
	if err := s.fieldRepo.CreateField(field); err != nil {
		return apperrors.ErrInternal.WithDetail("创建自定义字段失败")
	}
	return nil
}

func (s *CustomFieldService) SetCustomFields(enterpriseID, entityType, entityID string, fields map[string]interface{}) *apperrors.AppError {
	if entityType == "" || entityID == "" {
		return apperrors.NewValidationError("entity", "实体类型和ID不能为空")
	}
	entID, _ := uuid.Parse(enterpriseID)
	eID, _ := uuid.Parse(entityID)

	fieldDefs, err := s.fieldRepo.ListFieldsByEntity(entID, entityType)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询字段定义失败")
	}

	allowedFields := make(map[string]bool)
	for _, f := range fieldDefs {
		allowedFields[f.FieldName] = true
	}

	filtered := make(map[string]interface{})
	for k, v := range fields {
		if allowedFields[k] {
			filtered[k] = v
		}
	}

	if err := s.fieldRepo.SetCustomFields(nil, entityType, eID, filtered); err != nil {
		return apperrors.ErrInternal.WithDetail("设置自定义字段值失败")
	}
	return nil
}

func (s *CustomFieldService) GetRelations(enterpriseID uuid.UUID, entityType, entityID, relationName string) ([]model.RelationDefinition, *apperrors.AppError) {
	eID, _ := uuid.Parse(entityID)
	rels, err := s.relationRepo.ListRelations(enterpriseID, entityType, eID, relationName)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询关联数据失败")
	}
	return rels, nil
}

var _ = json.Marshal
