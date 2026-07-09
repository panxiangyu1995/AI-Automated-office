package olog

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"
)

type Entry struct {
	TS            string      `json:"ts"`
	Skill         string      `json:"skill"`
	Action        string      `json:"action"`
	ParamsSummary interface{} `json:"params_summary,omitempty"`
	Status        string      `json:"status"`
	ResultSummary interface{} `json:"result_summary,omitempty"`
	Error         interface{} `json:"error,omitempty"`
	DurationMs    int64       `json:"duration_ms"`
}

func LogDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return filepath.Join(home, ".ai-office-cli", "logs")
}

func Record(entry Entry) error {
	dir := LogDir()
	if dir == "" {
		return fmt.Errorf("cannot determine log directory")
	}
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("cannot create log directory: %w", err)
	}

	filename := time.Now().Format("2006-01-02") + ".jsonl"
	path := filepath.Join(dir, filename)

	line, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("cannot marshal log entry: %w", err)
	}

	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return fmt.Errorf("cannot open log file: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(append(line, '\n')); err != nil {
		return fmt.Errorf("cannot write log entry: %w", err)
	}

	return nil
}

func ReadByDate(dateStr string) ([]Entry, error) {
	dir := LogDir()
	path := filepath.Join(dir, dateStr+".jsonl")

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("cannot read log file: %w", err)
	}

	var entries []Entry
	lines := splitLines(string(data))
	for _, line := range lines {
		if line == "" {
			continue
		}
		var entry Entry
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

func ListLogFiles() ([]string, error) {
	dir := LogDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("cannot read log directory: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".jsonl" {
			name := e.Name()
			files = append(files, name[:len(name)-6])
		}
	}

	sort.Sort(sort.Reverse(sort.StringSlice(files)))
	return files, nil
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			line := s[start:i]
			if line != "" {
				lines = append(lines, line)
			}
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}
