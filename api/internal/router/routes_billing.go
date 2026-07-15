package router

import (
	"github.com/gin-gonic/gin"
)

func registerBillingRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	billing := protected.Group("/billing")
	{
		billing.POST("/plans", deps.BillingHandler.CreatePlan)
		billing.GET("/plans", deps.BillingHandler.ListPlans)
		billing.POST("/subscriptions", deps.BillingHandler.Subscribe)
		billing.PUT("/subscriptions/:id/upgrade", deps.BillingHandler.UpgradePlan)
		billing.PUT("/subscriptions/:id/downgrade", deps.BillingHandler.DowngradePlan)
		billing.POST("/subscriptions/:id/renew", deps.BillingHandler.RenewSubscription)
		billing.GET("/bills", deps.BillingHandler.ListBills)
		billing.GET("/bills/:id", deps.BillingHandler.GetBill)
		billing.POST("/bills/:id/refund", deps.BillingHandler.Refund)
		billing.GET("/revenue-summary", deps.BillingHandler.GetRevenueSummary)
	}
}
