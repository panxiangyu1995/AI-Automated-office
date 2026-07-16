package repository

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDebugLogRepo_Query_NoFiles(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	entries, total, err := repo.Query(context.Background(), LogFilter{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 0 {
		t.Errorf("expected total 0, got %d", total)
	}
	if len(entries) != 0 {
		t.Errorf("expected 0 entries, got %d", len(entries))
	}
}

func TestDebugLogRepo_SeedAndQuery(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Msg: "request", Method: "GET", Path: "/api/v1/employees", Status: 200, RequestID: "req-1"},
		{Level: "error", TS: now.Add(time.Second), Msg: "server error", Method: "POST", Path: "/api/v1/customers", Status: 500, RequestID: "req-2"},
	}

	if err := repo.Seed(context.Background(), seedEntries); err != nil {
		t.Fatalf("seed failed: %v", err)
	}

	entries, total, err := repo.Query(context.Background(), LogFilter{Page: 1, PageSize: 10, Sort: "asc"})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 2 {
		t.Errorf("expected total 2, got %d", total)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	if entries[0].RequestID != "req-1" {
		t.Errorf("expected req-1, got %s", entries[0].RequestID)
	}
	if entries[1].RequestID != "req-2" {
		t.Errorf("expected req-2, got %s", entries[1].RequestID)
	}
}

func TestDebugLogRepo_Query_FilterByLevel(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Msg: "ok", Status: 200},
		{Level: "error", TS: now.Add(time.Second), Msg: "fail", Status: 500},
		{Level: "warn", TS: now.Add(2 * time.Second), Msg: "warning", Status: 400},
	}
	repo.Seed(context.Background(), seedEntries)

	entries, total, err := repo.Query(context.Background(), LogFilter{Level: "error", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if len(entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(entries))
	}
	if entries[0].Level != "error" {
		t.Errorf("expected level error, got %s", entries[0].Level)
	}
}

func TestDebugLogRepo_Query_FilterByPath(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Path: "/api/v1/employees", Status: 200},
		{Level: "info", TS: now.Add(time.Second), Path: "/api/v1/customers", Status: 200},
	}
	repo.Seed(context.Background(), seedEntries)

	entries, total, err := repo.Query(context.Background(), LogFilter{Path: "/api/v1/emp", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if entries[0].Path != "/api/v1/employees" {
		t.Errorf("expected /api/v1/employees, got %s", entries[0].Path)
	}
}

func TestDebugLogRepo_Query_FilterByStatus(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Status: 200},
		{Level: "error", TS: now.Add(time.Second), Status: 500},
	}
	repo.Seed(context.Background(), seedEntries)

	status500 := 500
	entries, total, err := repo.Query(context.Background(), LogFilter{Status: &status500, Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if entries[0].Status != 500 {
		t.Errorf("expected status 500, got %d", entries[0].Status)
	}
}

func TestDebugLogRepo_Query_Pagination(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	var seedEntries []LogEntry
	for i := 0; i < 5; i++ {
		seedEntries = append(seedEntries, LogEntry{
			Level: "info", TS: now.Add(time.Duration(i) * time.Second), Msg: "entry", Status: 200,
		})
	}
	repo.Seed(context.Background(), seedEntries)

	entries, total, err := repo.Query(context.Background(), LogFilter{Page: 1, PageSize: 2, Sort: "asc"})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 5 {
		t.Errorf("expected total 5, got %d", total)
	}
	if len(entries) != 2 {
		t.Errorf("expected 2 entries on page 1, got %d", len(entries))
	}
}

func TestDebugLogRepo_Query_TimeRange(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	t1 := now
	t2 := now.Add(time.Hour)
	t3 := now.Add(2 * time.Hour)

	seedEntries := []LogEntry{
		{Level: "info", TS: t1, Msg: "first", Status: 200},
		{Level: "info", TS: t2, Msg: "second", Status: 200},
		{Level: "info", TS: t3, Msg: "third", Status: 200},
	}
	repo.Seed(context.Background(), seedEntries)

	start := now.Add(30 * time.Minute)
	end := now.Add(90 * time.Minute)
	entries, total, err := repo.Query(context.Background(), LogFilter{
		StartTime: &start,
		EndTime:   &end,
		Page:      1,
		PageSize:  10,
	})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if len(entries) != 1 || entries[0].Msg != "second" {
		t.Errorf("expected 'second', got %v", entries)
	}
}

func TestDebugLogRepo_Query_DescSort(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, RequestID: "first"},
		{Level: "info", TS: now.Add(time.Second), RequestID: "second"},
		{Level: "info", TS: now.Add(2 * time.Second), RequestID: "third"},
	}
	repo.Seed(context.Background(), seedEntries)

	entries, _, err := repo.Query(context.Background(), LogFilter{Page: 1, PageSize: 10, Sort: "desc"})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if entries[0].RequestID != "third" {
		t.Errorf("expected third first in desc, got %s", entries[0].RequestID)
	}
}

func TestDebugLogRepo_Seed_CreatesDir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "nested", "logs")
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	err := repo.Seed(context.Background(), []LogEntry{
		{Level: "info", TS: now, Msg: "test"},
	})
	if err != nil {
		t.Fatalf("seed failed: %v", err)
	}
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		t.Error("expected directory to be created")
	}
}

func TestDebugLogRepo_Query_FilterByMethod(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Method: "GET", Status: 200},
		{Level: "info", TS: now.Add(time.Second), Method: "POST", Status: 201},
	}
	repo.Seed(context.Background(), seedEntries)

	entries, total, err := repo.Query(context.Background(), LogFilter{Method: "POST", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if entries[0].Method != "POST" {
		t.Errorf("expected POST, got %s", entries[0].Method)
	}
}

func TestDebugLogRepo_Query_KeywordSearch(t *testing.T) {
	dir := t.TempDir()
	repo := NewDebugLogRepo(dir)

	now := time.Now().Truncate(time.Millisecond)
	seedEntries := []LogEntry{
		{Level: "info", TS: now, Msg: "employee created successfully"},
		{Level: "error", TS: now.Add(time.Second), Msg: "database connection failed"},
	}
	repo.Seed(context.Background(), seedEntries)

	entries, total, err := repo.Query(context.Background(), LogFilter{Query: "database", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if entries[0].Msg != "database connection failed" {
		t.Errorf("expected database connection failed, got %s", entries[0].Msg)
	}
}
