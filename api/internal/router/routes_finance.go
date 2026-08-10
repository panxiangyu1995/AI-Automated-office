package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerFinanceRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	financeAccess := middleware.RequirePermission(rbac.PermFinanceRead)

	f := enterprise.Group("")
	f.Use(financeAccess)
	{
		f.POST("/payments", deps.FinanceHandler.CreatePayment)
		f.GET("/payments", deps.FinanceHandler.ListPayments)
		f.POST("/expenses", deps.FinanceHandler.CreateExpense)
		f.GET("/expenses", deps.FinanceHandler.ListExpenses)
		f.POST("/invoices", deps.FinanceHandler.CreateInvoice)
		f.GET("/invoices", deps.FinanceHandler.ListInvoices)
		f.POST("/payment-requests", deps.PaymentRequestHandler.Create)
		f.GET("/payment-requests", deps.PaymentRequestHandler.List)
		f.POST("/payment-requests/:id/submit", deps.PaymentRequestHandler.SubmitForApproval)
		f.POST("/payment-requests/:id/approve", deps.PaymentRequestHandler.Approve)
		f.POST("/payment-requests/:id/reject", deps.PaymentRequestHandler.Reject)
		f.POST("/collections", deps.CollectionHandler.Create)
		f.GET("/collections", deps.CollectionHandler.List)
		f.POST("/receivables", deps.FinanceHandler.CreateReceivable)
		f.GET("/receivables", deps.FinanceHandler.ListReceivables)
		f.POST("/payables", deps.FinanceHandler.CreatePayable)
		f.GET("/payables", deps.FinanceHandler.ListPayables)
		f.POST("/contracts/:contract_id/payment-plans", deps.PaymentPlanHandler.CreateBatch)
		f.GET("/contracts/:contract_id/payment-plans", deps.PaymentPlanHandler.List)
		f.GET("/payment-plans/overdue", deps.PaymentPlanHandler.ListOverdue)
		f.GET("/cash-flow-forecast", deps.CashFlowHandler.Forecast)
		f.GET("/reconciliation", deps.ReconciliationHandler.GetReconciliation)
		f.GET("/owner/signals", deps.OwnerHandler.Signals)
		f.GET("/owner/kpi", deps.OwnerHandler.KPI)
		f.POST("/owner/alert-rules", deps.OwnerHandler.CreateAlertRule)
		f.GET("/owner/alert-rules", deps.OwnerHandler.ListAlertRules)
	}

	protected.POST("/expenses/:id/approve", deps.FinanceHandler.ApproveExpense)
	protected.GET("/payment-requests/:id", deps.PaymentRequestHandler.Get)
	protected.PUT("/payment-requests/:id", deps.PaymentRequestHandler.Update)
	protected.DELETE("/payment-requests/:id", deps.PaymentRequestHandler.Delete)
	protected.GET("/collections/:id", deps.CollectionHandler.Get)
	protected.PUT("/payment-plans/:id", deps.PaymentPlanHandler.Update)
	protected.DELETE("/payment-plans/:id", deps.PaymentPlanHandler.Delete)
	protected.PUT("/alert-rules/:id", deps.OwnerHandler.UpdateAlertRule)
}
