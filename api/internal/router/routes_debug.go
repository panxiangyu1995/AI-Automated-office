//go:build debug

package router

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/handler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
)

func registerDebugRoutes(api *gin.RouterGroup, deps *RouterDeps) {
	deps.DebugHandler = handler.NewDebugHandler(deps.DebugLogService, deps.DebugStubService)

	debug := api.Group("/debug")
	debug.GET("/logs", deps.DebugHandler.QueryLogs)
	debug.POST("/logs/seed", deps.DebugHandler.SeedLogs)
	debug.GET("/stubs", deps.DebugHandler.ListStubs)
	debug.POST("/stubs", deps.DebugHandler.AddStub)
	debug.DELETE("/stubs/:id", deps.DebugHandler.RemoveStub)
	debug.DELETE("/stubs", deps.DebugHandler.ClearStubs)
}

func stubMiddleware(deps *RouterDeps) gin.HandlerFunc {
	return middleware.StubInterceptor(deps.DebugStubService)
}
