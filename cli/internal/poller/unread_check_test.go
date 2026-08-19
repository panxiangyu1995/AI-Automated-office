package poller

import (
	"fmt"
	"net/http"
	"net/http/httptest"
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

func testPollConfig(serverURL string) *config.Config {
	return &config.Config{
		ServerURL:    serverURL,
		Token:        "test-token",
		RefreshToken: "test-refresh",
		ExpiresAt:    time.Now().Add(time.Hour),
		EnterpriseID: "ent-1",
	}
}

func TestFetchNewUnread_NoSince(t *testing.T) {
	var gotSince, gotSource string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotSince = r.URL.Query().Get("since")
		gotSource = r.Header.Get("X-Request-Source")
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"data":[{"id":"1","title":"t1","created_at":"2026-08-18T10:00:00.123456Z"}]}`)
	}))
	defer server.Close()

	msgs, latest, err := FetchNewUnread(testPollConfig(server.URL), time.Time{})
	if err != nil {
		t.Fatalf("FetchNewUnread: %v", err)
	}
	if gotSince != "" {
		t.Fatalf("expected no since param, got %s", gotSince)
	}
	if gotSource != "ao-cli" {
		t.Fatalf("expected X-Request-Source ao-cli, got %s", gotSource)
	}
	if len(msgs) != 1 || msgs[0].ID != "1" {
		t.Fatalf("unexpected messages: %+v", msgs)
	}
	want := time.Date(2026, 8, 18, 10, 0, 0, 123456000, time.UTC)
	if !latest.Equal(want) {
		t.Fatalf("latest mismatch: want %v, got %v", want, latest)
	}
}

func TestFetchNewUnread_WithSince(t *testing.T) {
	since := time.Date(2026, 8, 18, 9, 0, 0, 0, time.UTC)
	var gotSince string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotSince = r.URL.Query().Get("since")
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"data":[]}`)
	}))
	defer server.Close()

	_, _, err := FetchNewUnread(testPollConfig(server.URL), since)
	if err != nil {
		t.Fatalf("FetchNewUnread: %v", err)
	}
	if gotSince != "2026-08-18T09:00:00Z" {
		t.Fatalf("expected RFC3339Nano UTC since param, got %s", gotSince)
	}
}

func TestFetchNewUnread_EmptyData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"data":[]}`)
	}))
	defer server.Close()

	msgs, latest, err := FetchNewUnread(testPollConfig(server.URL), time.Time{})
	if err != nil {
		t.Fatalf("FetchNewUnread: %v", err)
	}
	if len(msgs) != 0 || !latest.IsZero() {
		t.Fatalf("expected empty result, got msgs=%v latest=%v", msgs, latest)
	}
}

func TestFetchNewUnread_InvalidCreatedAtFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"data":[{"id":"1","title":"t1","created_at":"not-a-time"}]}`)
	}))
	defer server.Close()

	_, _, err := FetchNewUnread(testPollConfig(server.URL), time.Time{})
	if err == nil {
		t.Fatal("expected error for invalid created_at")
	}
	if !strings.Contains(err.Error(), "created_at") {
		t.Fatalf("expected error mentioning created_at, got: %v", err)
	}
}