package main

import (
	"context"
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"cloud-server/internal/config"
	"cloud-server/pkg/database"
)

type Migration struct {
	Version   int
	Name      string
	Direction string
	Path      string
}

// main runs the migration CLI.
func main() {
	direction := flag.String("direction", "up", "migration direction: up or down")
	steps := flag.Int("steps", 0, "number of steps to apply or rollback")
	flag.Parse()

	if *direction != "up" && *direction != "down" {
		fmt.Fprintln(os.Stderr, "direction must be up or down")
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "load config error:", err)
		os.Exit(1)
	}

	_, sqlDB, err := database.Connect(cfg.Database)
	if err != nil {
		fmt.Fprintln(os.Stderr, "database connection error:", err)
		os.Exit(1)
	}
	defer func() {
		_ = sqlDB.Close()
	}()

	workDir, err := os.Getwd()
	if err != nil {
		fmt.Fprintln(os.Stderr, "get working dir error:", err)
		os.Exit(1)
	}

	migrationsDir := filepath.Join(workDir, "migrations")
	ctx := context.Background()
	if err := RunMigrations(ctx, sqlDB, migrationsDir, *direction, *steps); err != nil {
		fmt.Fprintln(os.Stderr, "migration error:", err)
		os.Exit(1)
	}
}

// RunMigrations applies or rolls back migrations from the given directory.
func RunMigrations(ctx context.Context, sqlDB *sql.DB, migrationsDir string, direction string, steps int) error {
	if err := ensureSchemaMigrationsTable(ctx, sqlDB); err != nil {
		return err
	}

	migrations, err := listMigrations(migrationsDir, direction)
	if err != nil {
		return err
	}

	applied, err := getAppliedVersions(ctx, sqlDB)
	if err != nil {
		return err
	}

	if direction == "up" {
		return applyUpMigrations(ctx, sqlDB, migrations, applied, steps)
	}

	return applyDownMigrations(ctx, sqlDB, migrations, applied, steps)
}

// applyUpMigrations executes pending migrations in ascending order.
func applyUpMigrations(ctx context.Context, sqlDB *sql.DB, migrations []Migration, applied map[int]time.Time, steps int) error {
	appliedCount := 0
	for _, migration := range migrations {
		if _, exists := applied[migration.Version]; exists {
			continue
		}
		if steps > 0 && appliedCount >= steps {
			break
		}
		if err := applyMigration(ctx, sqlDB, migration); err != nil {
			return err
		}
		appliedCount++
	}
	return nil
}

// applyDownMigrations rolls back applied migrations in descending order.
func applyDownMigrations(ctx context.Context, sqlDB *sql.DB, migrations []Migration, applied map[int]time.Time, steps int) error {
	targetVersions := make([]int, 0, len(applied))
	for version := range applied {
		targetVersions = append(targetVersions, version)
	}
	sort.Sort(sort.Reverse(sort.IntSlice(targetVersions)))

	rollbackCount := 0
	for _, version := range targetVersions {
		if steps > 0 && rollbackCount >= steps {
			break
		}
		migration, ok := findMigration(migrations, version)
		if !ok {
			return fmt.Errorf("missing down migration for version %d", version)
		}
		if err := rollbackMigration(ctx, sqlDB, migration); err != nil {
			return err
		}
		rollbackCount++
	}
	return nil
}

// applyMigration runs a single migration within a transaction.
func applyMigration(ctx context.Context, sqlDB *sql.DB, migration Migration) error {
	content, err := os.ReadFile(migration.Path)
	if err != nil {
		return err
	}

	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := prepareSeedSettings(ctx, tx, migration.Name, migration.Direction); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(ctx, string(content)); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(
		ctx,
		"INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
		migration.Version,
		migration.Name,
	); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

// rollbackMigration rolls back a single migration within a transaction.
func rollbackMigration(ctx context.Context, sqlDB *sql.DB, migration Migration) error {
	content, err := os.ReadFile(migration.Path)
	if err != nil {
		return err
	}

	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := prepareSeedSettings(ctx, tx, migration.Name, migration.Direction); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(ctx, string(content)); err != nil {
		_ = tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM schema_migrations WHERE version = $1", migration.Version); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

// ensureSchemaMigrationsTable creates the schema_migrations table if needed.
func ensureSchemaMigrationsTable(ctx context.Context, sqlDB *sql.DB) error {
	_, err := sqlDB.ExecContext(
		ctx,
		"CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
	)
	return err
}

// getAppliedVersions returns the applied migration versions.
func getAppliedVersions(ctx context.Context, sqlDB *sql.DB) (map[int]time.Time, error) {
	rows, err := sqlDB.QueryContext(ctx, "SELECT version, applied_at FROM schema_migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := map[int]time.Time{}
	for rows.Next() {
		var version int
		var appliedAt time.Time
		if err := rows.Scan(&version, &appliedAt); err != nil {
			return nil, err
		}
		applied[version] = appliedAt
	}
	return applied, rows.Err()
}

// listMigrations scans the migrations directory and returns matching files.
func listMigrations(dir string, direction string) ([]Migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	pattern := regexp.MustCompile(`^(\d+)_([a-zA-Z0-9_]+)\.` + regexp.QuoteMeta(direction) + `\.sql$`)
	migrations := make([]Migration, 0)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		matches := pattern.FindStringSubmatch(entry.Name())
		if len(matches) != 3 {
			continue
		}
		version, err := strconv.Atoi(matches[1])
		if err != nil {
			return nil, fmt.Errorf("invalid migration version in %s", entry.Name())
		}
		migrations = append(migrations, Migration{
			Version:   version,
			Name:      matches[2],
			Direction: direction,
			Path:      filepath.Join(dir, entry.Name()),
		})
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})
	return migrations, nil
}

// findMigration finds a migration by version.
func findMigration(migrations []Migration, version int) (Migration, bool) {
	for _, migration := range migrations {
		if migration.Version == version {
			return migration, true
		}
	}
	return Migration{}, false
}

// prepareSeedSettings injects seed settings into the current transaction when required.
func prepareSeedSettings(ctx context.Context, tx *sql.Tx, migrationName string, direction string) error {
	if !strings.Contains(migrationName, "seed_default_roles") {
		return nil
	}

	adminPasswordHash := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD_HASH"))
	if adminPasswordHash == "" && direction == "up" {
		return errors.New("ADMIN_PASSWORD_HASH is required for admin seed")
	}

	adminEmail := strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	if adminEmail == "" {
		adminEmail = "admin@ai-office.local"
	}

	adminName := strings.TrimSpace(os.Getenv("ADMIN_NAME"))
	if adminName == "" {
		adminName = "超级管理员"
	}

	defaultTenantName := strings.TrimSpace(os.Getenv("DEFAULT_TENANT_NAME"))
	if defaultTenantName == "" {
		defaultTenantName = "Default Tenant"
	}

	if _, err := tx.ExecContext(ctx, "SELECT set_config('app.admin_email', $1, true)", adminEmail); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "SELECT set_config('app.admin_password_hash', $1, true)", adminPasswordHash); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "SELECT set_config('app.admin_name', $1, true)", adminName); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "SELECT set_config('app.default_tenant_name', $1, true)", defaultTenantName); err != nil {
		return err
	}

	return nil
}
