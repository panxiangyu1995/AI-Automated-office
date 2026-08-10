package router

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerOpsRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	operatorOnly := middleware.RequireExactPermission(rbac.PermSystemConfig)

	protected.GET("/dashboard", operatorOnly, deps.OperationsHandler.Dashboard)
	protected.GET("/enterprise-subscriptions", operatorOnly, deps.OperationsHandler.ListSubscriptions)
	protected.POST("/enterprise-subscriptions", operatorOnly, deps.OperationsHandler.CreateSubscription)
	protected.GET("/webhooks", deps.OperationsHandler.ListWebhooks)
	protected.POST("/webhooks", deps.OperationsHandler.CreateWebhook)
	protected.GET("/audit-log-entries", operatorOnly, deps.OperationsHandler.ListAuditLogs)
	protected.GET("/reports/:type", deps.OperationsHandler.GetReport)
	protected.POST("/service-tickets", operatorOnly, deps.OperationsHandler.CreateServiceTicket)
	protected.GET("/service-tickets", operatorOnly, deps.OperationsHandler.ListServiceTickets)
	protected.GET("/sla-metrics", operatorOnly, deps.OperationsHandler.GetSLAMetrics)
	protected.POST("/service-config", operatorOnly, deps.OperationsHandler.CreateServiceConfig)
	protected.GET("/service-config/:key", operatorOnly, deps.OperationsHandler.GetServiceConfig)
	protected.GET("/operator/enterprises/:id/health", operatorOnly, deps.HealthDashboardHandler.GetEnterpriseHealth)
	protected.GET("/operator/health-dashboard", operatorOnly, deps.HealthDashboardHandler.GetDashboard)
	protected.GET("/operator/audit-logs", operatorOnly, deps.OperatorAuditHandler.ListOperatorActions)
	protected.GET("/operator/logs", operatorOnly, middleware.RequireExactPermission(rbac.PermSystemDebug), deps.OperatorLogHandler.QueryLogs)
	protected.POST("/:type/:id/restore", deps.RestoreHandler.Restore)
}
