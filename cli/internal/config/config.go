package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	ServerURL    string      `yaml:"server_url"`
	Token        string      `yaml:"-"`
	RefreshToken string      `yaml:"-"`
	Email        string      `yaml:"email"`
	Host         string      `yaml:"host"`
	EnterpriseID string      `yaml:"enterprise_id"`
	ExpiresAt    time.Time   `yaml:"expires_at"`
	HMACSecret   string      `yaml:"hmac_secret"`
	CLIPath      string      `yaml:"cli_path"`
	Poll         PollConfig  `yaml:"poll"`
	Notify       NotifyConfig `yaml:"notify"`
}

type PollConfig struct {
	Interval int    `yaml:"interval"`
	MarkFile string `yaml:"mark_file"`
}

type NotifyConfig struct {
	Enable      bool   `yaml:"enable"`
	OpenclawURL string `yaml:"openclaw_url"`
	MarkFile    string `yaml:"mark_file"`
}

func (c *Config) IsTokenExpired() bool {
	if c.Token == "" {
		return true
	}
	return time.Now().After(c.ExpiresAt)
}

func configDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot find home directory: %w", err)
	}
	dir := filepath.Join(home, ".ai-office-cli")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("cannot create config directory: %w", err)
	}
	return dir, nil
}

func configPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.yaml"), nil
}

func Load() (*Config, error) {
	path, err := configPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	accessToken, refreshToken, err := loadTokensSecure()
	if err != nil {
		return nil, fmt.Errorf("failed to load tokens: %w", err)
	}
	cfg.Token = accessToken
	cfg.RefreshToken = refreshToken

	return &cfg, nil
}

func Save(cfg *Config) error {
	path, err := configPath()
	if err != nil {
		return err
	}

	existing, err := os.ReadFile(path)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to read existing config: %w", err)
	}

	var existingCfg Config
	if err == nil {
		_ = yaml.Unmarshal(existing, &existingCfg)
	}

	if cfg.CLIPath == "" {
		cfg.CLIPath = existingCfg.CLIPath
	}
	if cfg.HMACSecret == "" {
		cfg.HMACSecret = existingCfg.HMACSecret
	}
	if cfg.ServerURL == "" {
		cfg.ServerURL = existingCfg.ServerURL
	}

	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	if err := saveTokensSecure(cfg.Token, cfg.RefreshToken); err != nil {
		return fmt.Errorf("failed to save tokens: %w", err)
	}

	return nil
}

func Clear() error {
	cfg, err := Load()
	if err != nil {
		if os.IsNotExist(err) {
			return clearTokensSecure()
		}
		return err
	}

	cfg.Token = ""
	cfg.RefreshToken = ""
	cfg.Email = ""
	cfg.Host = ""
	cfg.EnterpriseID = ""
	cfg.ExpiresAt = time.Time{}

	if err := Save(cfg); err != nil {
		return err
	}

	if err := clearTokensSecure(); err != nil {
		return err
	}

	return nil
}
