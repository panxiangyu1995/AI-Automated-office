package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerIMSRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/materials", middleware.RequirePermission(rbac.PermProductCreate), deps.MatHandler.Create)
	enterprise.GET("/materials", middleware.RequirePermission(rbac.PermProductList), deps.MatHandler.List)
	enterprise.POST("/suppliers", middleware.RequirePermission(rbac.PermProductCreate), deps.SupHandler.Create)
	enterprise.GET("/suppliers", middleware.RequirePermission(rbac.PermProductList), deps.SupHandler.List)
	enterprise.POST("/warehouses", middleware.RequirePermission(rbac.PermProductCreate), deps.WhHandler.Create)
	enterprise.GET("/warehouses", middleware.RequirePermission(rbac.PermProductList), deps.WhHandler.List)
	enterprise.GET("/inventory/low-stock", middleware.RequirePermission(rbac.PermProductList), deps.InvHandler.LowStock)
	enterprise.POST("/inventory", middleware.RequirePermission(rbac.PermProductUpdate), deps.InvHandler.Set)
	enterprise.GET("/inventory/warehouses/:warehouse_id", middleware.RequirePermission(rbac.PermProductRead), deps.InvHandler.ByWarehouse)
	enterprise.GET("/inventory/materials/:material_id", middleware.RequirePermission(rbac.PermProductRead), deps.InvHandler.ByMaterial)
	enterprise.POST("/purchase-orders", middleware.RequirePermission(rbac.PermOrderCreate), deps.OrderHandler.CreatePurchaseOrder)
	enterprise.POST("/sales-orders", middleware.RequirePermission(rbac.PermOrderCreate), deps.OrderHandler.CreateSalesOrder)
	enterprise.POST("/transfers", middleware.RequirePermission(rbac.PermOrderCreate), deps.OrderHandler.CreateTransfer)
	enterprise.POST("/requisitions", middleware.RequirePermission(rbac.PermOrderCreate), deps.OrderHandler.CreateRequisition)
	enterprise.GET("/orders", middleware.RequirePermission(rbac.PermOrderList), deps.OrderHandler.ListOrders)
	enterprise.GET("/stock-flows", middleware.RequirePermission(rbac.PermOrderList), deps.OrderHandler.ListStockFlows)

	protected.GET("/materials/:id", middleware.RequirePermission(rbac.PermProductRead), deps.MatHandler.Get)
	protected.PUT("/materials/:id", middleware.RequirePermission(rbac.PermProductUpdate), deps.MatHandler.Update)
	protected.DELETE("/materials/:id", middleware.RequirePermission(rbac.PermProductDelete), deps.MatHandler.Delete)
	protected.GET("/suppliers/:id", middleware.RequirePermission(rbac.PermProductRead), deps.SupHandler.Get)
	protected.PUT("/suppliers/:id", middleware.RequirePermission(rbac.PermProductUpdate), deps.SupHandler.Update)
	protected.DELETE("/suppliers/:id", middleware.RequirePermission(rbac.PermProductDelete), deps.SupHandler.Delete)
	protected.GET("/warehouses/:id", middleware.RequirePermission(rbac.PermProductRead), deps.WhHandler.Get)
	protected.PUT("/warehouses/:id", middleware.RequirePermission(rbac.PermProductUpdate), deps.WhHandler.Update)
	protected.DELETE("/warehouses/:id", middleware.RequirePermission(rbac.PermProductDelete), deps.WhHandler.Delete)
	protected.POST("/purchase-orders/:id/receive", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.ReceivePurchase)
	protected.POST("/sales-orders/:id/ship", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.ShipSalesOrder)
	protected.POST("/sales-orders/:id/contract", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.BindContract)
	protected.POST("/sales-orders/:id/delivery", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.Delivery)
	protected.PATCH("/sales-orders/:id/status", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.ChangeSalesOrderStatus)
	protected.POST("/transfers/:id/execute", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.ExecuteTransfer)
	protected.POST("/requisitions/:id/issue", middleware.RequirePermission(rbac.PermOrderUpdate), deps.OrderHandler.IssueRequisition)

	enterprise.POST("/purchase-orders/:po_id/inspections", middleware.RequirePermission(rbac.PermOrderCreate), deps.QualityInspectionHandler.Create)
	enterprise.GET("/purchase-orders/:po_id/inspections", middleware.RequirePermission(rbac.PermOrderRead), deps.QualityInspectionHandler.ListByPurchaseOrder)
	protected.POST("/inspections/:id/items", middleware.RequirePermission(rbac.PermOrderUpdate), deps.QualityInspectionHandler.AddItem)
	protected.POST("/inspections/:id/complete", middleware.RequirePermission(rbac.PermOrderUpdate), deps.QualityInspectionHandler.Complete)
	protected.GET("/inspections/:id", middleware.RequirePermission(rbac.PermOrderRead), deps.QualityInspectionHandler.Get)
}
