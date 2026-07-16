package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

func parseLogFilter(c *gin.Context) repository.LogFilter {
	filter := repository.LogFilter{
		Page:     1,
		PageSize: 50,
		Sort:     "desc",
	}

	if v := c.Query("start_time"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			filter.StartTime = &t
		}
	}
	if v := c.Query("end_time"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			filter.EndTime = &t
		}
	}
	filter.Level = c.Query("level")
	filter.Path = c.Query("path")
	if v := c.Query("status"); v != "" {
		if s, err := strconv.Atoi(v); err == nil {
			filter.Status = &s
		}
	}
	filter.RequestID = c.Query("request_id")
	filter.Method = c.Query("method")
	filter.Query = c.Query("q")
	filter.Source = c.Query("source")
	if v := c.Query("page"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			filter.Page = p
		}
	}
	if v := c.Query("page_size"); v != "" {
		if ps, err := strconv.Atoi(v); err == nil && ps > 0 {
			filter.PageSize = ps
		}
	}
	filter.Sort = c.Query("sort")
	if filter.Sort == "" {
		filter.Sort = "desc"
	}

	return filter
}
