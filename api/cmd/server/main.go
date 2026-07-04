package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"gorm.io/gorm"

	"github.com/ai-office/api/internal/router"
	"github.com/ai-office/api/pkg/config"
	"github.com/ai-office/api/pkg/database"
	"github.com/ai-office/api/pkg/tenant"
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

	logger, err := zap.NewProduction()
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
			sqlDB, _ := initDB.DB()
			if sqlDB != nil {
				defer sqlDB.Close()
			}
		}
	} else {
		logger.Info("no database configuration, running without database")
	}

	r := router.Setup(cfg, logger, db)

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
