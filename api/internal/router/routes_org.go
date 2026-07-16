package router

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerOrgRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	operatorOnly := middleware.RequirePermission(rbac.PermSystemConfig)

	protected.POST("/auth/switch-enterprise", deps.AuthHandler.SwitchEnterprise)
	protected.POST("/auth/logout", deps.AuthHandler.Logout)
	protected.GET("/me", deps.AuthHandler.Me)
	protected.GET("/me/profile", deps.AuthHandler.MeProfile)
	protected.GET("/audit-logs", deps.AuditLogHandler.List)
	protected.POST("/cross-enterprise/permissions", deps.CrossEnterpriseHandler.Grant)
	protected.DELETE("/cross-enterprise/permissions/:id", deps.CrossEnterpriseHandler.Revoke)
	protected.GET("/cross-enterprise/permissions", deps.CrossEnterpriseHandler.ListByUser)
	protected.GET("/groups/summary/:id", deps.SummaryHandler.GroupSummary)

	groups := protected.Group("/groups")
	groups.Use(operatorOnly)
	{
		groups.POST("", deps.GroupHandler.Create)
		groups.PUT("/:id", deps.GroupHandler.Update)
		groups.DELETE("/:id", deps.GroupHandler.Delete)
		groups.GET("", deps.GroupHandler.List)
		groups.GET("/:id", deps.GroupHandler.Get)
	}

	enterprises := protected.Group("/enterprises")
	enterprises.Use(operatorOnly)
	{
		enterprises.POST("", deps.EnterpriseHandler.Create)
		enterprises.PUT("/:enterprise_id", deps.EnterpriseHandler.Update)
		enterprises.GET("", deps.EnterpriseHandler.List)
		enterprises.GET("/:enterprise_id", deps.EnterpriseHandler.Get)
		enterprises.POST("/:enterprise_id/status", deps.EnterpriseHandler.ChangeStatus)
		enterprises.GET("/:enterprise_id/status-log", deps.EnterpriseHandler.GetStatusLog)
	}

	protected.GET("/quota", deps.QuotaHandler.GetQuota)
	protected.PUT("/quota", deps.QuotaHandler.UpdateQuota)
	protected.GET("/features", deps.QuotaHandler.ListFeatures)
	protected.PUT("/features/:key", deps.QuotaHandler.UpdateFeature)

	enterprise.Use(middleware.EnterpriseOwnership(func(userID, targetEnterpriseID uuid.UUID) (bool, error) {
		perm, err := deps.CrossEnterpriseRepo.FindByUserAndTarget(userID, targetEnterpriseID)
		if err != nil || perm == nil {
			return false, err
		}
		return true, nil
	}))
	{
		enterprise.GET("/departments/tree", deps.DeptHandler.GetTree)
		enterprise.POST("/departments", deps.DeptHandler.Create)
	}

	enterprise.POST("/employees", deps.EmpHandler.Create)
	enterprise.POST("/employees/batch-import", deps.EmpHandler.BatchImport)
	enterprise.GET("/employees", deps.EmpHandler.List)
	enterprise.GET("/employees/sales-performance", deps.EmpHandler.SalesPerformance)
	enterprise.POST("/positions", deps.PositionHandler.Create)
	enterprise.GET("/positions", deps.PositionHandler.List)

	protected.PUT("/positions/:id", deps.PositionHandler.Update)
	protected.PUT("/employees/:id", deps.EmpHandler.Update)
	protected.DELETE("/employees/:id", deps.EmpHandler.Delete)
	protected.GET("/employees/:id", deps.EmpHandler.Get)
	protected.PUT("/employees/:id/transfer", deps.EmpHandler.Transfer)
	protected.POST("/employees/:id/permissions", deps.EmpPermHandler.Set)
	protected.DELETE("/employees/:id/permissions", deps.EmpPermHandler.Revoke)
	protected.GET("/employees/:id/permissions", deps.EmpPermHandler.List)

	protected.GET("/permissions", deps.PermHandler.List)
	protected.POST("/permissions/check", deps.PermHandler.Check)
	protected.GET("/roles", deps.RoleHandler.List)
	protected.POST("/roles", deps.RoleHandler.Create)
	protected.GET("/roles/:id/permissions", deps.RoleHandler.GetPermissions)
	protected.PUT("/roles/:id/permissions", deps.RoleHandler.SetPermissions)

	protected.GET("/departments/:id", deps.DeptHandler.Get)
	protected.PUT("/departments/:id", deps.DeptHandler.Update)
	protected.PUT("/departments/:id/manager", deps.DeptHandler.SetManager)
	protected.DELETE("/departments/:id", deps.DeptHandler.Delete)

	enterprise.POST("/skill-matrix", deps.EnterpriseSkillHandler.ConfigureSkill)
	enterprise.GET("/skill-matrix", deps.EnterpriseSkillHandler.ListSkillMatrix)
	enterprise.PUT("/skill-matrix/:skill_name", deps.EnterpriseSkillHandler.UpdateSkill)
}
