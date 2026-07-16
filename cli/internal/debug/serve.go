//go:build debug

package debug

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/olog"
)

func StartServe(port int) error {
	mux := http.NewServeMux()

	mux.HandleFunc("/logs", handleLogs)
	mux.HandleFunc("/logs/files", handleLogFiles)

	addr := fmt.Sprintf("127.0.0.1:%d", port)
	fmt.Printf("CLI debug serve listening on %s\n", addr)
	return http.ListenAndServe(addr, mux)
}

func handleLogs(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	entries, err := olog.ReadByDate(date)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	skill := r.URL.Query().Get("skill")
	status := r.URL.Query().Get("status")
	q := r.URL.Query().Get("q")
	lastStr := r.URL.Query().Get("last")

	var filtered []olog.Entry
	for _, e := range entries {
		if skill != "" && !strings.Contains(strings.ToLower(e.Skill), strings.ToLower(skill)) {
			continue
		}
		if status != "" && !strings.EqualFold(e.Status, status) {
			continue
		}
		if q != "" {
			match := strings.Contains(strings.ToLower(e.Skill), strings.ToLower(q)) ||
				strings.Contains(strings.ToLower(e.Action), strings.ToLower(q)) ||
				strings.Contains(strings.ToLower(fmt.Sprintf("%v", e.Error)), strings.ToLower(q))
			if !match {
				continue
			}
		}
		filtered = append(filtered, e)
	}

	if lastStr != "" {
		if last, err := strconv.Atoi(lastStr); err == nil && last > 0 && last < len(filtered) {
			filtered = filtered[len(filtered)-last:]
		}
	}

	w.Header().Set("Content-Type", "application/json")
	data, _ := json.Marshal(filtered)
	w.Write(data)
}

func handleLogFiles(w http.ResponseWriter, r *http.Request) {
	files, err := olog.ListLogFiles()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	data, _ := json.Marshal(files)
	w.Write(data)
}
