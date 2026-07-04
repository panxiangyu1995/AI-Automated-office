package tenant

import (
	"fmt"
	"log"
	"strings"

	"gorm.io/gorm"

	"github.com/ai-office/api/pkg/database"
)

const SchemaPrefix = "tenant_"

func SchemaName(enterpriseID string) string {
	return fmt.Sprintf("%s%s", SchemaPrefix, strings.ReplaceAll(enterpriseID, "-", "_"))
}

func CreateSchema(db *gorm.DB, enterpriseID string) error {
	schema := SchemaName(enterpriseID)

	if err := db.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schema)).Error; err != nil {
		return fmt.Errorf("failed to create schema %s: %w", schema, err)
	}

	log.Printf("[tenant] schema %s created", schema)
	return nil
}

func SchemaExists(db *gorm.DB, enterpriseID string) (bool, error) {
	schema := SchemaName(enterpriseID)
	var count int64
	err := db.Raw(
		"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?",
		schema,
	).Scan(&count).Error
	if err != nil {
		return false, fmt.Errorf("failed to check schema existence: %w", err)
	}
	return count > 0, nil
}

func DropSchema(db *gorm.DB, enterpriseID string) error {
	schema := SchemaName(enterpriseID)
	if err := db.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema)).Error; err != nil {
		return fmt.Errorf("failed to drop schema %s: %w", schema, err)
	}
	log.Printf("[tenant] schema %s dropped", schema)
	return nil
}

func ListSchemas(db *gorm.DB) ([]string, error) {
	var schemas []string
	err := db.Raw(
		"SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE ? ORDER BY schema_name",
		SchemaPrefix+"%",
	).Scan(&schemas).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list schemas: %w", err)
	}
	return schemas, nil
}

func UseSchema(db *gorm.DB, enterpriseID string) *gorm.DB {
	schema := SchemaName(enterpriseID)
	return database.SetSearchPath(db, schema)
}

var GlobalDB *gorm.DB

func InitGlobalDB(db *gorm.DB) {
	GlobalDB = db
}

func GetDB(enterpriseID string) *gorm.DB {
	if enterpriseID == "" || GlobalDB == nil {
		return GlobalDB
	}
	return UseSchema(GlobalDB, enterpriseID)
}
