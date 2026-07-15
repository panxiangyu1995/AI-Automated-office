package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerExportRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	exportAccess := middleware.RequireAnyPermission(
		rbac.PermEmployeeRead, rbac.PermCustomerRead, rbac.PermContractRead,
		rbac.PermFinanceRead, rbac.PermOrderRead, rbac.PermProductRead,
	)

	protected.GET("/data-export", exportAccess, deps.ExportHandler.ListTasks)
	protected.POST("/data-export", exportAccess, deps.ExportHandler.CreateTask)
	protected.GET("/data-export/:id", exportAccess, deps.ExportHandler.GetTask)
	protected.GET("/data-export/:id/download", exportAccess, deps.ExportHandler.DownloadTask)
	protected.POST("/data-import", deps.OperationsHandler.ImportData)
}
