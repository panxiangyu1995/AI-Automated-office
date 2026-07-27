package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerContractRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	contractRead := middleware.RequirePermission(rbac.PermContractRead)
	contractWrite := middleware.RequirePermission(rbac.PermContractUpdate)
	contractCreate := middleware.RequirePermission(rbac.PermContractCreate)
	contractDelete := middleware.RequirePermission(rbac.PermContractDelete)

	c := enterprise.Group("")
	c.Use(contractRead)
	{
		c.GET("/contracts", deps.ContractHandler.List)
	}
	cWrite := enterprise.Group("")
	cWrite.Use(contractCreate)
	{
		cWrite.POST("/contracts", deps.ContractHandler.Create)
	}

	pc := protected.Group("")
	pc.Use(contractRead)
	{
		pc.GET("/contracts/:id", deps.ContractHandler.Get)
		pc.GET("/contracts/:id/documents", deps.ContractHandler.ListDocuments)
	}
	pcWrite := protected.Group("")
	pcWrite.Use(contractWrite)
	{
		pcWrite.PUT("/contracts/:id", deps.ContractHandler.Update)
		pcWrite.PATCH("/contracts/:id", deps.ContractHandler.PatchFields)
		pcWrite.PATCH("/contracts/:id/status", deps.ContractHandler.ChangeStatus)
		pcWrite.POST("/contracts/:id/submit-approval", deps.ContractHandler.SubmitApproval)
		pcWrite.POST("/contracts/:id/approve", deps.ContractHandler.Approve)
		pcWrite.POST("/contracts/:id/attachments", deps.ContractHandler.UploadAttachment)
		pcWrite.POST("/contracts/:id/documents", deps.ContractHandler.LinkDocument)
	}
	pcDelete := protected.Group("")
	pcDelete.Use(contractDelete)
	{
		pcDelete.DELETE("/contracts/:id", deps.ContractHandler.Delete)
	}
}
