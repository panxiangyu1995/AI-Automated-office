package repository

import "gorm.io/gorm"

type SchemaManager interface {
	CreateSchema(enterpriseID string) error
	RunMigrations(enterpriseID string) error
}

type schemaManager struct {
	db *gorm.DB
}

func NewSchemaManager(db *gorm.DB) SchemaManager {
	return &schemaManager{db: db}
}
