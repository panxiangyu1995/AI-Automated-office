package testutil

import (
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/database"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

func DSN() string {
	if dsn := os.Getenv("AO_TEST_DB_DSN"); dsn != "" {
		return dsn
	}
	if os.Getenv("AO_DATABASE_HOST") != "" {
		return fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			os.Getenv("AO_DATABASE_HOST"),
			envOr("AO_DATABASE_PORT", "5432"),
			envOr("AO_DATABASE_USER", "ai_office"),
			os.Getenv("AO_DATABASE_PASSWORD"),
			envOr("AO_DATABASE_DBNAME", "ai_office"),
			envOr("AO_DATABASE_SSLMODE", "disable"),
		)
	}
	return "host=localhost port=5432 user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable"
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

var testDB *gorm.DB

func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	if testDB != nil {
		testDB.Exec("SET search_path TO public")
		return testDB
	}

	db, err := gorm.Open(postgres.Open(DSN()), &gorm.Config{
		Logger:                 logger.Default.LogMode(logger.Silent),
		SkipDefaultTransaction: true,
		PrepareStmt:            false,
	})
	if err != nil {
		t.Fatalf("failed to connect test database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get sql.DB: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		t.Fatalf("failed to ping test database: %v", err)
	}

	if err := database.AutoMigrateSystem(db); err != nil {
		t.Fatalf("failed to auto-migrate system tables: %v", err)
	}

	tenant.InitGlobalDB(db)
	db.Exec("SET search_path TO public")
	testDB = db
	return db
}

func CreateTestSchema(t *testing.T, db *gorm.DB) string {
	t.Helper()
	enterpriseID := uuid.New().String()
	if err := tenant.CreateSchema(db, enterpriseID); err != nil {
		t.Fatalf("failed to create test schema: %v", err)
	}
	if err := tenant.RunMigrations(db, enterpriseID); err != nil {
		t.Fatalf("failed to run tenant migrations: %v", err)
	}
	return enterpriseID
}

func DropTestSchema(t *testing.T, db *gorm.DB, enterpriseID string) {
	t.Helper()
	if err := tenant.DropSchema(db, enterpriseID); err != nil {
		log.Printf("warning: failed to drop test schema for enterprise %s: %v", enterpriseID, err)
	}
}

func ExecInSchema(t *testing.T, db *gorm.DB, enterpriseID string, fn func()) {
	t.Helper()
	schema, _ := tenant.SchemaName(enterpriseID)
	db.Exec(fmt.Sprintf("SET search_path TO %s,public", schema))
	fn()
	db.Exec("SET search_path TO public")
}
