package router

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerOpsRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	protected.GET("/dashboard", deps.OperationsHandler.Dashboard)
	protected.GET("/enterprise-subscriptions", deps.OperationsHandler.ListSubscriptions)
	protected.POST("/enterprise-subscriptions", deps.OperationsHandler.CreateSubscription)
	protected.GET("/webhooks", deps.OperationsHandler.ListWebhooks)
	protected.POST("/webhooks", deps.OperationsHandler.CreateWebhook)
	protected.GET("/audit-log-entries", deps.OperationsHandler.ListAuditLogs)
	protected.GET("/reports/:type", deps.OperationsHandler.GetReport)
	protected.POST("/service-tickets", deps.OperationsHandler.CreateServiceTicket)
	protected.GET("/service-tickets", deps.OperationsHandler.ListServiceTickets)
	protected.GET("/sla-metrics", deps.OperationsHandler.GetSLAMetrics)
	protected.POST("/service-config", deps.OperationsHandler.CreateServiceConfig)
	protected.GET("/service-config/:key", deps.OperationsHandler.GetServiceConfig)
	protected.GET("/operator/enterprises/:id/health", deps.HealthDashboardHandler.GetEnterpriseHealth)
	protected.GET("/operator/health-dashboard", deps.HealthDashboardHandler.GetDashboard)
	protected.GET("/operator/audit-logs", deps.OperatorAuditHandler.ListOperatorActions)
	protected.GET("/operator/logs", middleware.RequireExactPermission(rbac.PermSystemDebug), deps.OperatorLogHandler.QueryLogs)
	protected.POST("/:type/:id/restore", deps.RestoreHandler.Restore)
}
