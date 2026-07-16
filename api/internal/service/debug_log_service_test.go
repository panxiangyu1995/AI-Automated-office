package service

import (
	"context"
	"testing"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

func TestDebugLogService_QueryLogs(t *testing.T) {
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	svc := NewDebugLogService(repo)

	now := time.Now().Truncate(time.Millisecond)
	repo.Seed(context.Background(), []repository.LogEntry{
		{Level: "info", TS: now, Msg: "test", Method: "GET", Path: "/api/v1/health", Status: 200},
	})

	entries, total, appErr := svc.QueryLogs(context.Background(), repository.LogFilter{Page: 1, PageSize: 10})
	if appErr != nil {
		t.Fatalf("unexpected error: %v", appErr)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if len(entries) != 1 {
		t.Errorf("expected 1 entry, got %d", len(entries))
	}
}

func TestDebugLogService_SeedLogs(t *testing.T) {
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	svc := NewDebugLogService(repo)

	now := time.Now().Truncate(time.Millisecond)
	appErr := svc.SeedLogs(context.Background(), []repository.LogEntry{
		{Level: "info", TS: now, Msg: "seeded"},
	})
	if appErr != nil {
		t.Fatalf("unexpected error: %v", appErr)
	}

	entries, _, _ := svc.QueryLogs(context.Background(), repository.LogFilter{Page: 1, PageSize: 10})
	if len(entries) != 1 {
		t.Errorf("expected 1 entry after seed, got %d", len(entries))
	}
}

func TestDebugLogService_QueryLogs_WithFilter(t *testing.T) {
	dir := t.TempDir()
	repo := repository.NewDebugLogRepo(dir)
	svc := NewDebugLogService(repo)

	now := time.Now().Truncate(time.Millisecond)
	repo.Seed(context.Background(), []repository.LogEntry{
		{Level: "info", TS: now, Status: 200},
		{Level: "error", TS: now.Add(time.Second), Status: 500},
	})

	entries, total, _ := svc.QueryLogs(context.Background(), repository.LogFilter{Level: "error", Page: 1, PageSize: 10})
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if entries[0].Level != "error" {
		t.Errorf("expected error level, got %s", entries[0].Level)
	}
}
