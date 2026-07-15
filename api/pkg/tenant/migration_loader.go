package tenant

import (
	"embed"
	"fmt"
)

//go:embed migrations/tenant/*.sql
var migrationFS embed.FS

func LoadMigrationSQL(version string) (string, error) {
	data, err := migrationFS.ReadFile("migrations/tenant/" + version + ".sql")
	if err != nil {
		return "", fmt.Errorf("migration file %s not found: %w", version, err)
	}
	return string(data), nil
}
