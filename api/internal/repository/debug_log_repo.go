package repository

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type LogEntry struct {
	Level     string    `json:"level"`
	TS        time.Time `json:"ts"`
	Caller    string    `json:"caller"`
	Msg       string    `json:"msg"`
	Method    string    `json:"method"`
	Path      string    `json:"path"`
	Query     string    `json:"query"`
	Status    int       `json:"status"`
	Latency   string    `json:"latency"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	RequestID string    `json:"request_id"`
	TraceID   string    `json:"trace_id"`
	Error     string    `json:"error,omitempty"`
	Source    string    `json:"source,omitempty"`
}

type LogFilter struct {
	StartTime *time.Time
	EndTime   *time.Time
	Level     string
	Path      string
	Status    *int
	RequestID string
	Method    string
	Query     string
	Source    string
	Page      int
	PageSize  int
	Sort      string
}

type DebugLogRepo struct {
	logDir string
}

func NewDebugLogRepo(logDir string) *DebugLogRepo {
	return &DebugLogRepo{logDir: logDir}
}

func (r *DebugLogRepo) Query(ctx context.Context, filter LogFilter) ([]LogEntry, int64, error) {
	files := r.resolveFiles(filter)
	if len(files) == 0 {
		return nil, 0, nil
	}

	var all []LogEntry
	for _, f := range files {
		entries, err := r.readFile(f)
		if err != nil {
			continue
		}
		all = append(all, entries...)
	}

	filtered := r.applyFilter(all, filter)

	total := int64(len(filtered))
	sortOrder := filter.Sort
	if sortOrder == "" {
		sortOrder = "desc"
	}
	if sortOrder == "desc" {
		sort.Slice(filtered, func(i, j int) bool {
			return filtered[i].TS.After(filtered[j].TS)
		})
	} else {
		sort.Slice(filtered, func(i, j int) bool {
			return filtered[i].TS.Before(filtered[j].TS)
		})
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 50
	}

	start := (page - 1) * pageSize
	if start >= len(filtered) {
		return nil, total, nil
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}

	return filtered[start:end], total, nil
}

func (r *DebugLogRepo) Seed(ctx context.Context, entries []LogEntry) error {
	if err := os.MkdirAll(r.logDir, 0755); err != nil {
		return fmt.Errorf("cannot create log directory: %w", err)
	}

	byDate := make(map[string][]LogEntry)
	for _, e := range entries {
		dateKey := e.TS.Format("2006-01-02")
		byDate[dateKey] = append(byDate[dateKey], e)
	}

	for dateKey, dayEntries := range byDate {
		filename := dateKey + ".jsonl"
		path := filepath.Join(r.logDir, filename)

		f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
		if err != nil {
			return fmt.Errorf("cannot open log file %s: %w", filename, err)
		}

		for _, e := range dayEntries {
			line, err := json.Marshal(e)
			if err != nil {
				f.Close()
				return fmt.Errorf("cannot marshal log entry: %w", err)
			}
			if _, err := f.Write(append(line, '\n')); err != nil {
				f.Close()
				return fmt.Errorf("cannot write log entry: %w", err)
			}
		}
		f.Close()
	}

	return nil
}

func (r *DebugLogRepo) resolveFiles(filter LogFilter) []string {
	if r.logDir == "" {
		return nil
	}

	entries, err := os.ReadDir(r.logDir)
	if err != nil {
		return nil
	}

	var allFiles []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !strings.HasSuffix(name, ".jsonl") {
			continue
		}
		allFiles = append(allFiles, filepath.Join(r.logDir, name))
	}

	if filter.StartTime == nil && filter.EndTime == nil {
		return allFiles
	}

	var matched []string
	for _, f := range allFiles {
		base := filepath.Base(f)
		dateStr := strings.TrimSuffix(base, ".jsonl")
		fileDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		dayStart := time.Date(fileDate.Year(), fileDate.Month(), fileDate.Day(), 0, 0, 0, 0, fileDate.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		if filter.StartTime != nil && dayEnd.Before(*filter.StartTime) {
			continue
		}
		if filter.EndTime != nil && dayStart.After(*filter.EndTime) {
			continue
		}
		matched = append(matched, f)
	}

	return matched
}

func (r *DebugLogRepo) readFile(path string) ([]LogEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var entries []LogEntry
	decoder := json.NewDecoder(bufio.NewReader(f))
	for {
		var entry LogEntry
		if err := decoder.Decode(&entry); err != nil {
			if err == io.EOF {
				break
			}
			continue
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

func (r *DebugLogRepo) applyFilter(entries []LogEntry, filter LogFilter) []LogEntry {
	var result []LogEntry
	for _, e := range entries {
		if !r.matchFilter(e, filter) {
			continue
		}
		result = append(result, e)
	}
	return result
}

func (r *DebugLogRepo) matchFilter(e LogEntry, filter LogFilter) bool {
	if filter.StartTime != nil && e.TS.Before(*filter.StartTime) {
		return false
	}
	if filter.EndTime != nil && e.TS.After(*filter.EndTime) {
		return false
	}
	if filter.Level != "" && !strings.EqualFold(e.Level, filter.Level) {
		return false
	}
	if filter.Path != "" && !strings.HasPrefix(e.Path, filter.Path) {
		return false
	}
	if filter.Status != nil && e.Status != *filter.Status {
		return false
	}
	if filter.RequestID != "" && e.RequestID != filter.RequestID {
		return false
	}
	if filter.Method != "" && !strings.EqualFold(e.Method, filter.Method) {
		return false
	}
	if filter.Query != "" && !strings.Contains(strings.ToLower(e.Msg), strings.ToLower(filter.Query)) {
		return false
	}
	if filter.Source != "" && e.Source != filter.Source {
		return false
	}
	return true
}
