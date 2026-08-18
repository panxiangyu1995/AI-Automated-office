package poller

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
)

func TestCursorPath_DefaultUsesHomeDir(t *testing.T) {
	cfg := &config.Config{}
	got := CursorPath(cfg)
	if !strings.HasSuffix(got, filepath.Join(".ai-office-cli", "messages.cursor")) {
		t.Fatalf("unexpected default cursor path: %s", got)
	}
}

func TestCursorPath_HonorsConfigOverride(t *testing.T) {
	cfg := &config.Config{}
	cfg.Poll.CursorFile = "/tmp/custom.cursor"
	if got := CursorPath(cfg); got != "/tmp/custom.cursor" {
		t.Fatalf("expected override path, got %s", got)
	}
}

func TestCursor_RoundTrip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "messages.cursor")
	want := time.Date(2026, 8, 18, 10, 30, 0, 0, time.UTC)

	if err := saveCursor(path, want); err != nil {
		t.Fatalf("saveCursor: %v", err)
	}
	got, err := loadCursor(path)
	if err != nil {
		t.Fatalf("loadCursor: %v", err)
	}
	if !got.Equal(want) {
		t.Fatalf("cursor mismatch: want %v, got %v", want, got)
	}
}

func TestLoadCursor_MissingFileReturnsZeroTime(t *testing.T) {
	got, err := loadCursor(filepath.Join(t.TempDir(), "nonexistent.cursor"))
	if err != nil {
		t.Fatalf("loadCursor missing file: %v", err)
	}
	if !got.IsZero() {
		t.Fatalf("expected zero time, got %v", got)
	}
}

func TestLoadCursor_CorruptFileReturnsError(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "messages.cursor")
	if err := os.WriteFile(path, []byte("garbage"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadCursor(path); err == nil {
		t.Fatal("expected error for corrupt cursor file")
	}
}

func TestSaveCursor_SkipsZeroTime(t *testing.T) {
	path := filepath.Join(t.TempDir(), "messages.cursor")
	if err := saveCursor(path, time.Time{}); err != nil {
		t.Fatalf("saveCursor zero: %v", err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatal("expected no file to be written for zero time")
	}
}

func TestMessageSummary_LessThanThree(t *testing.T) {
	msgs := []UnreadMessage{{Title: "审批待办"}, {Title: "库存预警"}}
	got := messageSummary(msgs)
	if got != "审批待办, 库存预警" {
		t.Fatalf("unexpected summary: %s", got)
	}
}

func TestMessageSummary_MoreThanThreeTruncates(t *testing.T) {
	msgs := []UnreadMessage{
		{Title: "审批待办"}, {Title: "库存预警"}, {Title: "合同待签"}, {Title: "新任务"},
	}
	got := messageSummary(msgs)
	if !strings.HasSuffix(got, " 等4条") {
		t.Fatalf("expected truncation suffix, got: %s", got)
	}
}