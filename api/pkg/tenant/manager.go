package tenant

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var identifierRe = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func validateIdentifier(name, kind string) error {
	if !identifierRe.MatchString(name) {
		return fmt.Errorf("invalid %s identifier: %s", kind, name)
	}
	return nil
}

func qi(name string) string {
	return pq.QuoteIdentifier(name)
}

const SchemaPrefix = "tenant_"

func SchemaName(enterpriseID string) (string, error) {
	if _, err := uuid.Parse(enterpriseID); err != nil {
		return "", fmt.Errorf("invalid enterprise ID (must be UUID): %s", enterpriseID)
	}
	s := strings.ReplaceAll(enterpriseID, "-", "_")
	return fmt.Sprintf("%s%s", SchemaPrefix, s), nil
}

func CreateSchema(db *gorm.DB, enterpriseID string) error {
	schema, err := SchemaName(enterpriseID)
	if err != nil {
		return err
	}
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := db.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", qi(schema))).Error; err != nil {
		return fmt.Errorf("failed to create schema %s: %w", schema, err)
	}
	log.Printf("[tenant] schema %s created", schema)
	return nil
}

func SchemaExists(db *gorm.DB, enterpriseID string) (bool, error) {
	schema, err := SchemaName(enterpriseID)
	if err != nil {
		return false, err
	}
	var count int64
	err = db.Raw(
		"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?",
		schema,
	).Scan(&count).Error
	if err != nil {
		return false, fmt.Errorf("failed to check schema existence: %w", err)
	}
	return count > 0, nil
}

func DropSchema(db *gorm.DB, enterpriseID string) error {
	schema, err := SchemaName(enterpriseID)
	if err != nil {
		return err
	}
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := db.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", qi(schema))).Error; err != nil {
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
	schema, err := SchemaName(enterpriseID)
	if err != nil {
		log.Printf("[tenant] UseSchema: %v", err)
		return db
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("[tenant] UseSchema: %v", err)
		return db
	}
	// Acquire a dedicated connection and pin the schema on it. All queries
	// executed through the returned instance reuse this same connection, so
	// tenant isolation does not depend on pooled-connection search_path
	// state (which leaks across requests and randomly resolves to other
	// tenants' schemas).
	ctx := context.Background()
	conn, err := sqlDB.Conn(ctx)
	if err != nil {
		log.Printf("[tenant] UseSchema: acquire conn: %v", err)
		return db
	}
	if _, err := conn.ExecContext(ctx, fmt.Sprintf("SET search_path TO %s,public", qi(schema))); err != nil {
		log.Printf("[tenant] UseSchema: SET search_path failed: %v", err)
	}
	connDB, err := gorm.Open(postgres.New(postgres.Config{Conn: conn}), &gorm.Config{
		SkipDefaultTransaction: true,
		PrepareStmt:            false,
	})
	if err != nil {
		log.Printf("[tenant] UseSchema: open conn db: %v", err)
		return db
	}
	RegisterSchemaCallbacks(connDB)
	connDB = connDB.Set("tenant_conn", conn)
	return connDB
}

// ReleaseConn restores the search_path of a connection acquired by UseSchema
// and returns it to the pool. Call via defer on the request path.
func ReleaseConn(db *gorm.DB) {
	if db == nil {
		return
	}
	if v, ok := db.Get("tenant_conn"); ok {
		if conn, ok := v.(*sql.Conn); ok {
			_, _ = conn.ExecContext(context.Background(), "RESET search_path")
			_ = conn.Close()
			return
		}
	}
	ResetSearchPath(db)
}

func SetEnterpriseContext(db *gorm.DB, enterpriseID string) error {
	if db == nil {
		return fmt.Errorf("db is nil")
	}
	if enterpriseID == "" {
		return fmt.Errorf("enterpriseID is empty")
	}
	return db.Exec("SELECT set_config('app.enterprise_id', ?, false)", enterpriseID).Error
}

func EnableRLS(db *gorm.DB, schema, tableName string) error {
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := validateIdentifier(tableName, "table"); err != nil {
		return err
	}
	qualifiedTable := fmt.Sprintf("%s.%s", qi(schema), qi(tableName))
	if err := db.Exec(fmt.Sprintf("ALTER TABLE %s ENABLE ROW LEVEL SECURITY", qualifiedTable)).Error; err != nil {
		return fmt.Errorf("failed to enable RLS on %s.%s: %w", schema, tableName, err)
	}
	return nil
}

func ForceRLS(db *gorm.DB, schema, tableName string) error {
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := validateIdentifier(tableName, "table"); err != nil {
		return err
	}
	qualifiedTable := fmt.Sprintf("%s.%s", qi(schema), qi(tableName))
	if err := db.Exec(fmt.Sprintf("ALTER TABLE %s FORCE ROW LEVEL SECURITY", qualifiedTable)).Error; err != nil {
		return fmt.Errorf("failed to force RLS on %s.%s: %w", schema, tableName, err)
	}
	return nil
}

func CreateRLSPolicy(db *gorm.DB, schema, tableName, enterpriseIDColumn string) error {
	if err := validateIdentifier(schema, "schema"); err != nil {
		return err
	}
	if err := validateIdentifier(tableName, "table"); err != nil {
		return err
	}
	if err := validateIdentifier(enterpriseIDColumn, "column"); err != nil {
		return err
	}
	policyName := fmt.Sprintf("tenant_isolation_%s", tableName)
	if err := validateIdentifier(policyName, "policy"); err != nil {
		return err
	}
	qualifiedTable := fmt.Sprintf("%s.%s", qi(schema), qi(tableName))
	sql := fmt.Sprintf(
		"CREATE POLICY %s ON %s USING (%s = current_setting('app.enterprise_id')::uuid)",
		qi(policyName), qualifiedTable, qi(enterpriseIDColumn),
	)
	if err := db.Exec(sql).Error; err != nil {
		if !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("failed to create RLS policy on %s.%s: %w", schema, tableName, err)
		}
	}
	return nil
}

type RLSTableSpec struct {
	TableName          string
	EnterpriseIDColumn string
}

var DefaultRLSTables = []RLSTableSpec{
	{TableName: "audit_logs", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "backup_configs", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "backup_records", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "api_quotas", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "feature_flags", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "rate_limit_configs", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "departments", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "employees", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "positions", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "cross_enterprise_permissions", EnterpriseIDColumn: "source_enterprise_id"},
	{TableName: "employee_permissions", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "customers", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "customer_levels", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "customer_tags", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "contacts", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "opportunities", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "materials", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "suppliers", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "warehouses", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "warehouse_inventories", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "stock_flows", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "material_prices", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "inventory_checks", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "purchase_orders", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "sales_orders", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "transfer_orders", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "requisitions", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "contracts", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "contract_attachments", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "contract_references", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "service_orders", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "payment_records", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "expense_records", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "invoices", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "file_records", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "messages", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "kb_categories", EnterpriseIDColumn: "enterprise_id"},
	{TableName: "knowledge_docs", EnterpriseIDColumn: "enterprise_id"},
}

func CreateRLSForSchema(db *gorm.DB, schema string, tables []RLSTableSpec) error {
	var firstErr error
	for _, t := range tables {
		if err := EnableRLS(db, schema, t.TableName); err != nil {
			log.Printf("[tenant] RLS enable error for %s.%s: %v", schema, t.TableName, err)
			if firstErr == nil {
				firstErr = fmt.Errorf("RLS enable failed for %s.%s: %w", schema, t.TableName, err)
			}
			continue
		}
		if err := ForceRLS(db, schema, t.TableName); err != nil {
			log.Printf("[tenant] RLS force error for %s.%s: %v", schema, t.TableName, err)
			if firstErr == nil {
				firstErr = fmt.Errorf("RLS force failed for %s.%s: %w", schema, t.TableName, err)
			}
			continue
		}
		if err := CreateRLSPolicy(db, schema, t.TableName, t.EnterpriseIDColumn); err != nil {
			log.Printf("[tenant] RLS policy error for %s.%s: %v", schema, t.TableName, err)
			if firstErr == nil {
				firstErr = fmt.Errorf("RLS policy failed for %s.%s: %w", schema, t.TableName, err)
			}
			continue
		}
		log.Printf("[tenant] RLS configured for %s.%s", schema, t.TableName)
	}
	return firstErr
}

func ListTablesWithColumn(db *gorm.DB, schema, columnName string) ([]string, error) {
	var tables []string
	err := db.Raw(
		"SELECT table_name FROM information_schema.columns WHERE table_schema = ? AND column_name = ?",
		schema, columnName,
	).Scan(&tables).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list tables with column %s in schema %s: %w", columnName, schema, err)
	}
	return tables, nil
}

var GlobalDB *gorm.DB

func InitGlobalDB(db *gorm.DB) {
	GlobalDB = db
}

func GetDB(enterpriseID string) *gorm.DB {
	if GlobalDB == nil {
		return nil
	}
	if enterpriseID == "" {
		return GlobalDB
	}
	return UseSchema(GlobalDB, enterpriseID)
}

func ResetSearchPath(db *gorm.DB) {
	if db != nil {
		db.Exec("SET search_path TO public")
	}
}
