package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server       ServerConfig       `mapstructure:"server"`
	Database     DatabaseConfig     `mapstructure:"database"`
	Redis        RedisConfig        `mapstructure:"redis"`
	JWT          JWTConfig          `mapstructure:"jwt"`
	Log          LogConfig          `mapstructure:"log"`
	Notification NotificationConfig `mapstructure:"notification"`
	Crypto       CryptoConfig       `mapstructure:"crypto"`
}

type ServerConfig struct {
	Host            string   `mapstructure:"host"`
	Port            int      `mapstructure:"port"`
	Mode            string   `mapstructure:"mode"`
	CORSOrigins     []string `mapstructure:"cors_origins"`
	ReadTimeout     int      `mapstructure:"read_timeout"`
	WriteTimeout    int      `mapstructure:"write_timeout"`
	ShutdownTimeout int      `mapstructure:"shutdown_timeout"`
	BackupDir       string   `mapstructure:"backup_dir"`
}

type DatabaseConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	User            string `mapstructure:"user"`
	Password        string `mapstructure:"password"`
	DBName          string `mapstructure:"dbname"`
	SSLMode         string `mapstructure:"sslmode"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type JWTConfig struct {
	Secret          string `mapstructure:"secret"`
	AccessTokenTTL  int    `mapstructure:"access_token_ttl"`
	RefreshTokenTTL int    `mapstructure:"refresh_token_ttl"`
	Issuer          string `mapstructure:"issuer"`
	CLIHMACSecret   string `mapstructure:"cli_hmac_secret"`
}

func (j *JWTConfig) GetCLIHMACSecret() string {
	if j.CLIHMACSecret != "" {
		return j.CLIHMACSecret
	}
	return j.Secret
}

type LogConfig struct {
	Dir        string `mapstructure:"dir"`
	Level      string `mapstructure:"level"`
	Filename   string `mapstructure:"filename"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
	Compress   bool   `mapstructure:"compress"`
}

type NotificationConfig struct {
	SMS   SMSConfig    `mapstructure:"sms"`
	Email EmailConfigN `mapstructure:"email"`
}

type SMSConfig struct {
	AccessKeyID     string `mapstructure:"access_key_id"`
	AccessKeySecret string `mapstructure:"access_key_secret"`
	SignName        string `mapstructure:"sign_name"`
	TemplateCode    string `mapstructure:"template_code"`
	RegionID        string `mapstructure:"region_id"`
}

type EmailConfigN struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	From     string `mapstructure:"from"`
	UseTLS   bool   `mapstructure:"use_tls"`
}

type CryptoConfig struct {
	MasterKey string `mapstructure:"master_key"`
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host, c.Database.Port, c.Database.User,
		c.Database.Password, c.Database.DBName, c.Database.SSLMode,
	)
}

func Load(configPath string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(configPath)
	v.SetConfigType("yaml")
	v.AutomaticEnv()
	v.SetEnvPrefix("AO")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}

func DefaultConfigPath() string {
	return "config/config.yaml"
}
