package handler

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
)

type DebugHandler struct {
	logSvc  *service.DebugLogService
	stubSvc *service.DebugStubService
}
