package router

import (
	"github.com/gin-gonic/gin"
)

func registerServiceRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/service-orders", deps.ServiceOrderHandler.Create)
	enterprise.GET("/service-orders", deps.ServiceOrderHandler.List)
	enterprise.POST("/service-orders/:service_order_id/repair-order", deps.RepairOrderHandler.Create)
	enterprise.POST("/service-orders/:service_order_id/attachments", deps.ServiceOrderHandler.UploadAttachment)

	protected.GET("/service-orders/:service_order_id", deps.ServiceOrderHandler.Get)
	protected.PUT("/service-orders/:service_order_id", deps.ServiceOrderHandler.Quote)
	protected.DELETE("/service-orders/:service_order_id", deps.ServiceOrderHandler.Delete)
	protected.PATCH("/service-orders/:service_order_id/status", deps.ServiceOrderHandler.ChangeStatus)
	protected.POST("/service-orders/:service_order_id/sign", deps.ServiceOrderHandler.Sign)
	protected.GET("/service-orders/:service_order_id/repair-order", deps.RepairOrderHandler.Get)
	protected.GET("/service-orders/:service_order_id/attachments", deps.ServiceOrderHandler.ListAttachments)
	protected.PUT("/repair-orders/:id", deps.RepairOrderHandler.Update)
}
