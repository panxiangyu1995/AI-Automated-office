package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerServiceRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	orderRead := middleware.RequirePermission(rbac.PermOrderRead)
	orderCreate := middleware.RequirePermission(rbac.PermOrderCreate)
	orderUpdate := middleware.RequirePermission(rbac.PermOrderUpdate)
	orderDelete := middleware.RequirePermission(rbac.PermOrderDelete)

	s := enterprise.Group("")
	s.Use(orderRead)
	{
		s.GET("/service-orders", deps.ServiceOrderHandler.List)
	}
	sCreate := enterprise.Group("")
	sCreate.Use(orderCreate)
	{
		sCreate.POST("/service-orders", deps.ServiceOrderHandler.Create)
		sCreate.POST("/service-orders/:service_order_id/repair-order", deps.RepairOrderHandler.Create)
		sCreate.POST("/service-orders/:service_order_id/attachments", deps.ServiceOrderHandler.UploadAttachment)
	}

	ps := protected.Group("")
	ps.Use(orderRead)
	{
		ps.GET("/service-orders/:service_order_id", deps.ServiceOrderHandler.Get)
		ps.GET("/service-orders/:service_order_id/repair-order", deps.RepairOrderHandler.Get)
		ps.GET("/service-orders/:service_order_id/attachments", deps.ServiceOrderHandler.ListAttachments)
	}
	psWrite := protected.Group("")
	psWrite.Use(orderUpdate)
	{
		psWrite.PUT("/service-orders/:service_order_id", deps.ServiceOrderHandler.Quote)
		psWrite.PATCH("/service-orders/:service_order_id/status", deps.ServiceOrderHandler.ChangeStatus)
		psWrite.POST("/service-orders/:service_order_id/sign", deps.ServiceOrderHandler.Sign)
		psWrite.PUT("/repair-orders/:id", deps.RepairOrderHandler.Update)
	}
	psDelete := protected.Group("")
	psDelete.Use(orderDelete)
	{
		psDelete.DELETE("/service-orders/:service_order_id", deps.ServiceOrderHandler.Delete)
	}
}
