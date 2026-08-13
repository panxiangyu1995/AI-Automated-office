package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/router"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/config"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/crypto"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/database"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
	"gopkg.in/natefinch/lumberjack.v2"
)

func main() {
	cfgPath := config.DefaultConfigPath()
	if envPath := os.Getenv("AO_CONFIG_PATH"); envPath != "" {
		cfgPath = envPath
	}

	cfg, err := config.Load(cfgPath)
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if cfg.JWT.Secret == "" || cfg.JWT.Secret == "change-me-in-production" {
		if cfg.Server.Mode == "release" {
			log.Fatal("JWT secret must be set via AO_JWT_SECRET in production mode")
		}
		log.Println("==========================================================")
		log.Println("  ⚠️  SECURITY WARNING: JWT secret is using default value!")
		log.Println("  This is INSECURE and must NOT be used in production.")
		log.Println("  Set the AO_JWT_SECRET environment variable to a strong random")
		log.Println("  string (at least 32 characters) before deploying.")
		log.Println("==========================================================")
	}

	logger, err := buildLogger(cfg)
	if err != nil {
		log.Fatalf("failed to create logger: %v", err)
	}
	defer logger.Sync()

	var db *gorm.DB
	if cfg.Database.Host != "" {
		initDB, err := database.Init(&cfg.Database)
		if err != nil {
			logger.Warn("database init failed, running without database", zap.Error(err))
		} else {
			tenant.InitGlobalDB(initDB)
			tenant.RegisterSchemaCallbacks(initDB)
			db = initDB
			defer database.Close()

			if cfg.Crypto.MasterKey != "" {
				if err := crypto.Init(cfg.Crypto.MasterKey); err != nil {
					logger.Warn("crypto init failed, encryption disabled", zap.Error(err))
				} else {
					logger.Info("crypto initialized successfully")
				}
			} else {
				logger.Warn("crypto master key not configured, encryption disabled")
			}
			sqlDB, _ := initDB.DB()
			if sqlDB != nil {
				defer sqlDB.Close()
			}
			if os.Getenv("AO_SKIP_MIGRATE") == "1" {
				logger.Info("auto-migrate skipped (AO_SKIP_MIGRATE=1)")
			} else if err := database.AutoMigrateSystem(initDB); err != nil {
				logger.Warn("auto-migrate system tables failed", zap.Error(err))
			}
		}
	} else {
		logger.Info("no database configuration, running without database")
	}

	var redisClient *redis.Client
	if cfg.Redis.Host != "" {
		rc, err := redis.NewClient(cfg.Redis)
		if err != nil {
			logger.Warn("redis init failed, running without redis", zap.Error(err))
		} else {
			redisClient = rc
			defer rc.Close()
		}
	}

	r := router.Setup(cfg, logger, db, redisClient)

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	go func() {
		logger.Info("server starting", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.Server.ShutdownTimeout)*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("server forced to shutdown", zap.Error(err))
	}

	logger.Info("server exited")
}

func buildLogger(cfg *config.Config) (*zap.Logger, error) {
	stdoutEncoder := zapcore.NewConsoleEncoder(zap.NewProductionEncoderConfig())
	stdoutLevel := zapcore.InfoLevel
	stdoutCore := zapcore.NewCore(stdoutEncoder, zapcore.AddSync(os.Stdout), stdoutLevel)

	logDir := cfg.Log.Dir
	if logDir == "" {
		logDir = "./logs"
	}
	logFilename := cfg.Log.Filename
	if logFilename == "" {
		logFilename = "api.jsonl"
	}

	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("cannot create log directory: %w", err)
	}

	logPath := filepath.Join(logDir, logFilename)
	maxSize := cfg.Log.MaxSize
	if maxSize == 0 {
		maxSize = 100
	}
	maxBackups := cfg.Log.MaxBackups
	if maxBackups == 0 {
		maxBackups = 10
	}
	maxAge := cfg.Log.MaxAge
	if maxAge == 0 {
		maxAge = 30
	}

	writer := &lumberjack.Logger{
		Filename:   logPath,
		MaxSize:    maxSize,
		MaxBackups: maxBackups,
		MaxAge:     maxAge,
		Compress:   cfg.Log.Compress,
	}

	fileEncoderConfig := zap.NewProductionEncoderConfig()
	fileEncoderConfig.TimeKey = "ts"
	fileEncoderConfig.LevelKey = "level"
	fileEncoderConfig.NameKey = "logger"
	fileEncoderConfig.CallerKey = "caller"
	fileEncoderConfig.MessageKey = "msg"
	fileEncoder := zapcore.NewJSONEncoder(fileEncoderConfig)
	fileCore := zapcore.NewCore(fileEncoder, zapcore.AddSync(writer), zapcore.DebugLevel)

	core := zapcore.NewTee(stdoutCore, fileCore)
	return zap.New(core), nil
}
