package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoad(t *testing.T) {
	for _, key := range []string{
		"AO_SERVER_HOST", "AO_SERVER_PORT", "AO_SERVER_MODE",
		"AO_DATABASE_HOST", "AO_DATABASE_PORT", "AO_DATABASE_USER",
		"AO_DATABASE_PASSWORD", "AO_DATABASE_DBNAME", "AO_DATABASE_SSLMODE",
		"AO_REDIS_HOST", "AO_REDIS_PORT",
		"AO_JWT_SECRET", "AO_JWT_ACCESS_TOKEN_TTL", "AO_JWT_REFRESH_TOKEN_TTL",
		"AO_LOG_LEVEL",
	} {
		t.Setenv(key, "")
	}

	tmpDir := t.TempDir()
	cfgPath := filepath.Join(tmpDir, "config.yaml")

	content := []byte(`
server:
  host: "127.0.0.1"
  port: 9090
  mode: "test"

database:
  host: "localhost"
  port: 5432
  user: "test_user"
  password: "test_pass"
  dbname: "test_db"
  sslmode: "disable"
  max_idle_conns: 5
  max_open_conns: 25
  conn_max_lifetime: 1800

redis:
  host: "localhost"
  port: 6379

jwt:
  secret: "test-secret"
  access_token_ttl: 3600
  refresh_token_ttl: 2592000
  issuer: "test"

log:
  level: "debug"
  filename: "logs/test.log"
  max_size: 10
  max_backups: 1
  max_age: 7
  compress: false
`)

	if err := os.WriteFile(cfgPath, content, 0644); err != nil {
		t.Fatalf("failed to write config: %v", err)
	}

	cfg, err := Load(cfgPath)
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	if cfg.Server.Port != 9090 {
		t.Errorf("expected port 9090, got %d", cfg.Server.Port)
	}
	if cfg.Database.User != "test_user" {
		t.Errorf("expected user test_user, got %s", cfg.Database.User)
	}
	if cfg.JWT.Secret != "test-secret" {
		t.Errorf("expected jwt secret test-secret, got %s", cfg.JWT.Secret)
	}
}

func TestDSN(t *testing.T) {
	cfg := &Config{
		Database: DatabaseConfig{
			Host:     "localhost",
			Port:     5432,
			User:     "u",
			Password: "p",
			DBName:   "d",
			SSLMode:  "disable",
		},
	}

	dsn := cfg.DSN()
	expected := "host=localhost port=5432 user=u password=p dbname=d sslmode=disable"
	if dsn != expected {
		t.Errorf("expected %s, got %s", expected, dsn)
	}
}

func TestDefaultConfigPath(t *testing.T) {
	path := DefaultConfigPath()
	if path != "config/config.yaml" {
		t.Errorf("expected config/config.yaml, got %s", path)
	}
}
