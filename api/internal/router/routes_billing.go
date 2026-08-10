package router

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerBillingRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	operatorOnly := middleware.RequireExactPermission(rbac.PermSystemConfig)

	billing := protected.Group("/billing")
	{
		billing.POST("/plans", operatorOnly, deps.BillingHandler.CreatePlan)
		billing.GET("/plans", deps.BillingHandler.ListPlans)
		billing.POST("/subscriptions", operatorOnly, deps.BillingHandler.Subscribe)
		billing.PUT("/subscriptions/:id/upgrade", operatorOnly, deps.BillingHandler.UpgradePlan)
		billing.PUT("/subscriptions/:id/downgrade", operatorOnly, deps.BillingHandler.DowngradePlan)
		billing.POST("/subscriptions/:id/renew", operatorOnly, deps.BillingHandler.RenewSubscription)
		billing.GET("/bills", operatorOnly, deps.BillingHandler.ListBills)
		billing.GET("/bills/:id", operatorOnly, deps.BillingHandler.GetBill)
		billing.POST("/bills/:id/refund", operatorOnly, deps.BillingHandler.Refund)
		billing.GET("/revenue-summary", operatorOnly, deps.BillingHandler.GetRevenueSummary)
	}
}
