package config

import "os"

type AppConfig struct {
	ServerURL string
	Format    string
}

func LoadAppConfig() *AppConfig {
	cfg := &AppConfig{
		ServerURL: "http://localhost:8080",
		Format:    "text",
	}

	if v := os.Getenv("AO_CLI_SERVER"); v != "" {
		cfg.ServerURL = v
	}
	if v := os.Getenv("AO_CLI_FORMAT"); v != "" {
		cfg.Format = v
	}

	return cfg
}
