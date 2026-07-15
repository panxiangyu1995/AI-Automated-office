package router

import (
	"github.com/gin-gonic/gin"
)

func registerTemplateRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	protected.POST("/templates", deps.TemplateHandler.Create)
	protected.GET("/templates", deps.TemplateHandler.List)
	protected.GET("/templates/:id", deps.TemplateHandler.Get)
	protected.POST("/templates/:id/apply", deps.TemplateHandler.Apply)
	protected.POST("/templates/from-enterprise", deps.TemplateHandler.CreateFromEnterprise)
	protected.POST("/templates/claude-md", deps.TemplateRenderHandler.CreateTemplate)
	protected.GET("/templates/claude-md", deps.TemplateRenderHandler.ListTemplates)
}
