package main

import (
	"database/sql"
	"fmt"
	"net/http"

	"cloud-server/internal/config"
	"cloud-server/internal/router"
	"cloud-server/pkg/database"
	"cloud-server/pkg/logger"

	"go.uber.org/zap"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	log, err := logger.New(cfg.Log)
	if err != nil {
		panic(err)
	}
	defer func() {
		_ = log.Sync()
	}()

	var rawSQLDB *sql.DB

	db, sqlConn, err := database.Connect(cfg.Database)
	if err != nil {
		log.Warn("database connection failed", zap.Error(err))
	} else {
		_ = db
		rawSQLDB = sqlConn
	}

	r := router.NewRouter(cfg, log, rawSQLDB)
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	log.Info("server starting", zap.String("addr", addr), zap.String("mode", cfg.Server.Mode))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("server stopped", zap.Error(err))
	}
}
