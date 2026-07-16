//go:build debug

package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

func NewDebugHandler(logSvc *service.DebugLogService, stubSvc *service.DebugStubService) *DebugHandler {
	return &DebugHandler{logSvc: logSvc, stubSvc: stubSvc}
}

func (h *DebugHandler) QueryLogs(c *gin.Context) {
	filter := parseLogFilter(c)
	entries, total, appErr := h.logSvc.QueryLogs(c.Request.Context(), filter)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, entries, &response.MetaInfo{
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalCount: total,
	})
}

func (h *DebugHandler) SeedLogs(c *gin.Context) {
	var entries []repository.LogEntry
	if err := c.ShouldBindJSON(&entries); err != nil {
		response.ValidationError(c, "entries", "invalid JSON body")
		return
	}

	for i := range entries {
		if entries[i].TS.IsZero() {
			entries[i].TS = time.Now()
		}
		if entries[i].Source == "" {
			entries[i].Source = "seed"
		}
	}

	appErr := h.logSvc.SeedLogs(c.Request.Context(), entries)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, gin.H{"seeded": len(entries)})
}

func (h *DebugHandler) ListStubs(c *gin.Context) {
	list := h.stubSvc.List()
	response.Success(c, list)
}

func (h *DebugHandler) AddStub(c *gin.Context) {
	var entry service.StubEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		response.ValidationError(c, "body", "invalid JSON body")
		return
	}
	if entry.Method == "" {
		entry.Method = "GET"
	}
	if entry.Status == 0 {
		entry.Status = http.StatusOK
	}
	result := h.stubSvc.Add(entry)
	response.Created(c, result)
}

func (h *DebugHandler) RemoveStub(c *gin.Context) {
	id := c.Param("id")
	removed := h.stubSvc.Remove(id)
	if !removed {
		c.JSON(http.StatusNotFound, gin.H{"error": "stub not found"})
		return
	}
	response.Success(c, gin.H{"removed": id})
}

func (h *DebugHandler) ClearStubs(c *gin.Context) {
	h.stubSvc.Clear()
	response.Success(c, gin.H{"cleared": true})
}
