package repository

import (
	"fmt"

	"github.com/lib/pq"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var allowedEntityTypes = map[string]bool{
	"customers":       true,
	"contacts":        true,
	"opportunities":   true,
	"contracts":       true,
	"suppliers":       true,
	"materials":       true,
	"employees":       true,
	"departments":     true,
	"warehouses":      true,
	"purchase_orders": true,
	"sales_orders":    true,
	"service_orders":  true,
	"invoices":        true,
}

func validateEntityType(entityType string) error {
	if !allowedEntityTypes[entityType] {
		return fmt.Errorf("invalid entity type: %s", entityType)
	}
	return nil
}

type CustomFieldRepository interface {
	ListFieldsByEntity(enterpriseID uuid.UUID, entityType string) ([]model.FieldDefinition, error)
	CreateField(field *model.FieldDefinition) error
	DeleteField(id uuid.UUID) error
	SetCustomFields(db *gorm.DB, entityType string, entityID uuid.UUID, fields map[string]interface{}) error
	GetCustomFields(db *gorm.DB, entityType string, entityID uuid.UUID) (map[string]interface{}, error)
}

type customFieldRepo struct {
	db *gorm.DB
}

func NewCustomFieldRepository(db *gorm.DB) CustomFieldRepository {
	return &customFieldRepo{db: db}
}

func (r *customFieldRepo) ListFieldsByEntity(enterpriseID uuid.UUID, entityType string) ([]model.FieldDefinition, error) {
	var fields []model.FieldDefinition
	err := r.db.Where("enterprise_id = ? AND entity_type = ?", enterpriseID, entityType).Order("sort_order ASC").Find(&fields).Error
	return fields, err
}

func (r *customFieldRepo) CreateField(field *model.FieldDefinition) error {
	return r.db.Create(field).Error
}

func (r *customFieldRepo) DeleteField(id uuid.UUID) error {
	return r.db.Delete(&model.FieldDefinition{}, "id = ?", id).Error
}

func (r *customFieldRepo) SetCustomFields(tx *gorm.DB, entityType string, entityID uuid.UUID, fields map[string]interface{}) error {
	if err := validateEntityType(entityType); err != nil {
		return err
	}
	for key, value := range fields {
		sql := fmt.Sprintf("UPDATE %s SET custom_fields = COALESCE(custom_fields, '{}'::jsonb) || jsonb_build_object(%s, ?) WHERE id = ?",
			pq.QuoteIdentifier(entityType), pq.QuoteLiteral(key))
		if err := tx.Exec(sql, value, entityID).Error; err != nil {
			return fmt.Errorf("failed to set custom field %s: %w", key, err)
		}
	}
	return nil
}

func (r *customFieldRepo) GetCustomFields(tx *gorm.DB, entityType string, entityID uuid.UUID) (map[string]interface{}, error) {
	if err := validateEntityType(entityType); err != nil {
		return nil, err
	}
	result := make(map[string]interface{})
	var raw map[string]interface{}
	query := fmt.Sprintf("SELECT custom_fields FROM %s WHERE id = ?", pq.QuoteIdentifier(entityType))
	if err := tx.Raw(query, entityID).Scan(&raw).Error; err != nil {
		return nil, err
	}
	if raw != nil && raw["custom_fields"] != nil {
		if cf, ok := raw["custom_fields"].(map[string]interface{}); ok {
			return cf, nil
		}
	}
	return result, nil
}

type RelationRepository interface {
	CreateRelation(rel *model.RelationDefinition) error
	ListRelations(enterpriseID uuid.UUID, entityType string, entityID uuid.UUID, relationName string) ([]model.RelationDefinition, error)
	DeleteRelation(id uuid.UUID) error
}

type relationRepo struct {
	db *gorm.DB
}

func NewRelationRepository(db *gorm.DB) RelationRepository {
	return &relationRepo{db: db}
}

func (r *relationRepo) CreateRelation(rel *model.RelationDefinition) error {
	return r.db.Create(rel).Error
}

func (r *relationRepo) ListRelations(enterpriseID uuid.UUID, entityType string, entityID uuid.UUID, relationName string) ([]model.RelationDefinition, error) {
	var rels []model.RelationDefinition
	q := r.db.Where("enterprise_id = ? AND source_type = ? AND source_id = ?", enterpriseID, entityType, entityID)
	if relationName != "" {
		q = q.Where("name = ?", relationName)
	}
	err := q.Find(&rels).Error
	return rels, err
}

func (r *relationRepo) DeleteRelation(id uuid.UUID) error {
	return r.db.Delete(&model.RelationDefinition{}, "id = ?", id).Error
}
