package tenant

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

// ContextKeySchemaName is the request context key carrying the tenant schema
// name to apply to every query within the request.
const ContextKeySchemaName = "tenant_schema_name"

// publicTables are global (platform-level) tables that live in the public
// schema and must NOT be prefixed with the tenant schema. Their data is
// shared across all enterprises (billing plans/subscriptions, webhooks,
// service tickets, industry templates, ClaudeMD templates, skill matrix),
// so queries against them always resolve to public.
var publicTables = map[string]bool{
	"industry_templates":      true,
	"claude_md_templates":     true,
	"enterprise_skill_matrix": true,
	"subscription_plans":      true,
	"enterprise_subscriptions": true,
	"billing_records":         true,
	"usage_bills":             true,
	"webhooks":                true,
	"service_tickets":         true,
	"service_configs":         true,
	"audit_log_entries":       true,
}

// RegisterSchemaCallbacks installs GORM callbacks that rewrite the table name
// of every query to include the tenant schema prefix read from the request
// context. This guarantees tenant isolation regardless of which pooled
// connection serves the query, avoiding the connection-pool + SET search_path
// race that caused queries to randomly hit the wrong (or public) schema.
// Platform-level tables listed in publicTables are pinned to the public
// schema instead.
func RegisterSchemaCallbacks(db *gorm.DB) {
	prefix := func(db *gorm.DB) {
		t := db.Statement.Table
		if t == "" || strings.Contains(t, ".") {
			return
		}
		// Skip complex table expressions (subqueries, joins, functions...)
		if strings.ContainsAny(t, " ()<>") {
			return
		}
		// Platform-level tables always resolve to public regardless of the
		// request context (repo queries carry no schema context).
		if publicTables[t] {
			db.Statement.Table = "public." + t
			return
		}
		schema, ok := db.Statement.Context.Value(ContextKeySchemaName).(string)
		if !ok || schema == "" {
			return
		}
		db.Statement.Table = schema + "." + t
	}

	db.Callback().Query().Before("gorm:query").Register("tenant:schema_prefix", prefix)
	db.Callback().Create().Before("gorm:create").Register("tenant:schema_prefix", prefix)
	db.Callback().Update().Before("gorm:update").Register("tenant:schema_prefix", prefix)
	db.Callback().Delete().Before("gorm:delete").Register("tenant:schema_prefix", prefix)
}

// WithSchemaContext returns a copy of ctx carrying the tenant schema name.
func WithSchemaContext(ctx context.Context, schema string) context.Context {
	if schema == "" {
		return ctx
	}
	return context.WithValue(ctx, ContextKeySchemaName, schema)
}

// SchemaFromContext returns the tenant schema name stored in ctx.
func SchemaFromContext(ctx context.Context) string {
	s, _ := ctx.Value(ContextKeySchemaName).(string)
	return s
}
