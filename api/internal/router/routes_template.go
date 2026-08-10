package router

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerTemplateRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	operatorOnly := middleware.RequireExactPermission(rbac.PermSystemConfig)

	protected.POST("/templates", operatorOnly, deps.TemplateHandler.Create)
	protected.GET("/templates", operatorOnly, deps.TemplateHandler.List)
	protected.GET("/templates/:id", operatorOnly, deps.TemplateHandler.Get)
	protected.POST("/templates/:id/apply", operatorOnly, deps.TemplateHandler.Apply)
	protected.POST("/templates/from-enterprise", operatorOnly, deps.TemplateHandler.CreateFromEnterprise)
	protected.POST("/templates/claude-md", operatorOnly, deps.TemplateRenderHandler.CreateTemplate)
	protected.GET("/templates/claude-md", operatorOnly, deps.TemplateRenderHandler.ListTemplates)
}
