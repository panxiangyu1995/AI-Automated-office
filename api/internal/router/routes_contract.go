package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerContractRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	contractAccess := middleware.RequirePermission(rbac.PermContractRead)

	c := enterprise.Group("")
	c.Use(contractAccess)
	{
		c.POST("/contracts", deps.ContractHandler.Create)
		c.GET("/contracts", deps.ContractHandler.List)
	}

	pc := protected.Group("")
	pc.Use(contractAccess)
	{
		pc.GET("/contracts/:id", deps.ContractHandler.Get)
		pc.PUT("/contracts/:id", deps.ContractHandler.Update)
		pc.DELETE("/contracts/:id", deps.ContractHandler.Delete)
		pc.PATCH("/contracts/:id", deps.ContractHandler.PatchFields)
		pc.PATCH("/contracts/:id/status", deps.ContractHandler.ChangeStatus)
		pc.POST("/contracts/:id/submit-approval", deps.ContractHandler.SubmitApproval)
		pc.POST("/contracts/:id/approve", deps.ContractHandler.Approve)
		pc.POST("/contracts/:id/attachments", deps.ContractHandler.UploadAttachment)
		pc.POST("/contracts/:id/documents", deps.ContractHandler.LinkDocument)
		pc.GET("/contracts/:id/documents", deps.ContractHandler.ListDocuments)
	}
}
