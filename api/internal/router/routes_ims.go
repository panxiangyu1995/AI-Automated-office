package router

import (
	"github.com/gin-gonic/gin"
)

func registerIMSRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/materials", deps.MatHandler.Create)
	enterprise.GET("/materials", deps.MatHandler.List)
	enterprise.POST("/suppliers", deps.SupHandler.Create)
	enterprise.GET("/suppliers", deps.SupHandler.List)
	enterprise.POST("/warehouses", deps.WhHandler.Create)
	enterprise.GET("/warehouses", deps.WhHandler.List)
	enterprise.GET("/inventory/low-stock", deps.InvHandler.LowStock)
	enterprise.POST("/inventory", deps.InvHandler.Set)
	enterprise.GET("/inventory/warehouses/:warehouse_id", deps.InvHandler.ByWarehouse)
	enterprise.GET("/inventory/materials/:material_id", deps.InvHandler.ByMaterial)
	enterprise.POST("/purchase-orders", deps.OrderHandler.CreatePurchaseOrder)
	enterprise.POST("/sales-orders", deps.OrderHandler.CreateSalesOrder)
	enterprise.POST("/transfers", deps.OrderHandler.CreateTransfer)
	enterprise.POST("/requisitions", deps.OrderHandler.CreateRequisition)
	enterprise.GET("/orders", deps.OrderHandler.ListOrders)
	enterprise.GET("/stock-flows", deps.OrderHandler.ListStockFlows)

	protected.GET("/materials/:id", deps.MatHandler.Get)
	protected.PUT("/materials/:id", deps.MatHandler.Update)
	protected.DELETE("/materials/:id", deps.MatHandler.Delete)
	protected.GET("/suppliers/:id", deps.SupHandler.Get)
	protected.PUT("/suppliers/:id", deps.SupHandler.Update)
	protected.DELETE("/suppliers/:id", deps.SupHandler.Delete)
	protected.GET("/warehouses/:id", deps.WhHandler.Get)
	protected.PUT("/warehouses/:id", deps.WhHandler.Update)
	protected.DELETE("/warehouses/:id", deps.WhHandler.Delete)
	protected.POST("/purchase-orders/:id/receive", deps.OrderHandler.ReceivePurchase)
	protected.POST("/sales-orders/:id/ship", deps.OrderHandler.ShipSalesOrder)
	protected.POST("/sales-orders/:id/contract", deps.OrderHandler.BindContract)
	protected.POST("/sales-orders/:id/delivery", deps.OrderHandler.Delivery)
	protected.PATCH("/sales-orders/:id/status", deps.OrderHandler.ChangeSalesOrderStatus)
	protected.POST("/transfers/:id/execute", deps.OrderHandler.ExecuteTransfer)
	protected.POST("/requisitions/:id/issue", deps.OrderHandler.IssueRequisition)

	enterprise.POST("/purchase-orders/:po_id/inspections", deps.QualityInspectionHandler.Create)
	enterprise.GET("/purchase-orders/:po_id/inspections", deps.QualityInspectionHandler.ListByPurchaseOrder)
	protected.POST("/inspections/:id/items", deps.QualityInspectionHandler.AddItem)
	protected.POST("/inspections/:id/complete", deps.QualityInspectionHandler.Complete)
	protected.GET("/inspections/:id", deps.QualityInspectionHandler.Get)
}
