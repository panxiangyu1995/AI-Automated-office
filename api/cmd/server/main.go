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
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
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
			if err := initDB.AutoMigrate(
				&model.Group{},
				&model.Enterprise{},
				&model.User{},
				&model.DeviceCode{},
				&model.Role{},
				&model.Permission{},
				&model.RolePermission{},
				&model.EmployeePermissionABAC{},
				&model.PermissionAttr{},
				&model.CustomRule{},
				&model.EmployeePermission{},
				&model.CrossEnterprisePermission{},
				&model.Department{},
				&model.Employee{},
				&model.Position{},
				&model.Customer{},
				&model.CustomerLevel{},
				&model.CustomerTag{},
				&model.Contact{},
				&model.Opportunity{},
				&model.Supplier{},
				&model.Material{},
				&model.Warehouse{},
				&model.WarehouseInventory{},
				&model.StockFlow{},
				&model.MaterialPrice{},
				&model.InventoryCheck{},
				&model.InventoryCheckItem{},
				&model.PurchaseOrder{},
				&model.PurchaseOrderItem{},
				&model.SalesOrder{},
				&model.SalesOrderItem{},
				&model.TransferOrder{},
				&model.Requisition{},
				&model.Contract{},
				&model.ContractReference{},
				&model.ContractAttachment{},
				&model.ServiceOrder{},
				&model.PaymentRecord{},
				&model.ExpenseRecord{},
				&model.Invoice{},
				&model.WfDefinition{},
				&model.WfInstance{},
				&model.WfApproval{},
				&model.FileMetadata{},
				&model.FileRecord{},
				&model.Message{},
				&model.Announcement{},
				&model.AnnouncementReadStatus{},
				&model.KnowledgeDoc{},
				&model.VectorRecord{},
				&model.DocChunk{},
				&model.ChatSession{},
				&model.ChatMessage{},
				&model.KBCategory{},
				&model.Skill{},
				&model.SkillRoleOpening{},
				&model.SkillParameter{},
				&model.FieldDefinition{},
				&model.RelationDefinition{},
				&model.AuditLog{},
				&model.AuditLogEntry{},
				&model.SubscriptionPlan{},
				&model.EnterpriseSubscription{},
				&model.Webhook{},
				&model.ServiceTicket{},
				&model.UsageBill{},
				&model.ServiceConfig{},
				&model.ApiQuota{},
				&model.FeatureFlag{},
				&model.RateLimitConfig{},
				&model.BackupConfig{},
				&model.BackupRecord{},
				&model.ExportTask{},
				&model.ExportHistory{},
				&model.PaymentRequest{},
				&model.CollectionRecord{},
				&model.PaymentPlan{},
				&model.RepairOrder{},
				&model.AlertRule{},
				&model.Receivable{},
				&model.Payable{},
				&model.QualityInspection{},
				&model.QualityInspectionItem{},
				&model.BillingRecord{},
				&model.PaymentGatewayConfig{},
			&model.MFAConfig{},
			&model.UndoOperation{},
			&model.IndustryTemplate{},
			&model.EnterpriseSkillMatrix{},
			&model.ClaudeMDTemplate{},
			); err != nil {
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
