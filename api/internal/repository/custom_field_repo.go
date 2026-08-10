package repository

import (
	"strings"
	"fmt"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
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
	DeleteField(id, enterpriseID uuid.UUID) error
	SetCustomFields(db *gorm.DB, entityType string, entityID uuid.UUID, enterpriseID uuid.UUID, fields map[string]interface{}) error
	GetCustomFields(db *gorm.DB, entityType string, entityID uuid.UUID) (map[string]interface{}, error)
}

type customFieldRepo struct {
	db *gorm.DB
}

func NewCustomFieldRepository(db *gorm.DB) CustomFieldRepository {
	return &customFieldRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *customFieldRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *customFieldRepo) ListFieldsByEntity(enterpriseID uuid.UUID, entityType string) ([]model.FieldDefinition, error) {
	var fields []model.FieldDefinition
	err := r.fresh().Where("enterprise_id = ? AND entity_type = ?", enterpriseID, entityType).Order("sort_order ASC").Find(&fields).Error
	return fields, err
}

func (r *customFieldRepo) CreateField(field *model.FieldDefinition) error {
	return r.fresh().Create(field).Error
}

func (r *customFieldRepo) DeleteField(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.FieldDefinition{}).Error
}

func (r *customFieldRepo) SetCustomFields(tx *gorm.DB, entityType string, entityID uuid.UUID, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	if err := validateEntityType(entityType); err != nil {
		return err
	}
	db := tx
	if db == nil {
		db = r.db
	}
	table := qualifiedTable(db, entityType)
	for key, value := range fields {
		sql := fmt.Sprintf("UPDATE %s SET custom_fields = COALESCE(custom_fields, '{}'::jsonb) || jsonb_build_object(%s, ?) WHERE id = ? AND enterprise_id = ?",
			table, pqQuoteLiteral(key))
		if err := db.Exec(sql, value, entityID, enterpriseID).Error; err != nil {
			return fmt.Errorf("failed to set custom field %s: %w", key, err)
		}
	}
	return nil
}

func (r *customFieldRepo) GetCustomFields(tx *gorm.DB, entityType string, entityID uuid.UUID) (map[string]interface{}, error) {
	if err := validateEntityType(entityType); err != nil {
		return nil, err
	}
	db := tx
	if db == nil {
		db = r.db
	}
	result := make(map[string]interface{})
	var raw map[string]interface{}
	query := fmt.Sprintf("SELECT custom_fields FROM %s WHERE id = ?", qualifiedTable(db, entityType))
	if err := db.Raw(query, entityID).Scan(&raw).Error; err != nil {
		return nil, err
	}
	if raw != nil && raw["custom_fields"] != nil {
		if cf, ok := raw["custom_fields"].(map[string]interface{}); ok {
			return cf, nil
		}
	}
	return result, nil
}

// qualifiedTable returns the entity table name, prefixed with the tenant
// schema when one is present in the statement context.
func qualifiedTable(tx *gorm.DB, entityType string) string {
	schema := tenant.SchemaFromContext(tx.Statement.Context)
	if schema == "" {
		return pqQuoteIdentifier(entityType)
	}
	return pqQuoteIdentifier(schema) + "." + pqQuoteIdentifier(entityType)
}

func pqQuoteIdentifier(s string) string {
	return `"` + s + `"`
}

func pqQuoteLiteral(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

type RelationRepository interface {
	CreateRelation(rel *model.RelationDefinition) error
	ListRelations(enterpriseID uuid.UUID, entityType string, entityID uuid.UUID, relationName string) ([]model.RelationDefinition, error)
	DeleteRelation(id, enterpriseID uuid.UUID) error
}

type relationRepo struct {
	db *gorm.DB
}

func NewRelationRepository(db *gorm.DB) RelationRepository {
	return &relationRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *relationRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *relationRepo) CreateRelation(rel *model.RelationDefinition) error {
	return r.fresh().Create(rel).Error
}

func (r *relationRepo) ListRelations(enterpriseID uuid.UUID, entityType string, entityID uuid.UUID, relationName string) ([]model.RelationDefinition, error) {
	var rels []model.RelationDefinition
	q := r.fresh().Where("enterprise_id = ? AND source_type = ? AND source_id = ?", enterpriseID, entityType, entityID)
	if relationName != "" {
		q = q.Where("name = ?", relationName)
	}
	err := q.Find(&rels).Error
	return rels, err
}

func (r *relationRepo) DeleteRelation(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.RelationDefinition{}).Error
}
