package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerCRMRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/customers", middleware.RequirePermission(rbac.PermCustomerCreate), deps.CustomerHandler.Create)
	enterprise.GET("/customers", middleware.RequirePermission(rbac.PermCustomerList), deps.CustomerHandler.List)
	enterprise.GET("/customers/:customer_id/panorama", middleware.RequirePermission(rbac.PermCustomerRead), deps.CustomerHandler.Panorama)
	enterprise.POST("/customer-levels", middleware.RequirePermission(rbac.PermCustomerCreate), deps.CustomerLevelHandler.Create)
	enterprise.GET("/customer-levels", deps.CustomerLevelHandler.List)
	enterprise.POST("/customers/:customer_id/tags", middleware.RequirePermission(rbac.PermCustomerCreate), deps.CustomerTagHandler.AddTag)
	enterprise.POST("/customers/:customer_id/contacts", middleware.RequirePermission(rbac.PermCustomerCreate), deps.ContactHandler.Create)
	enterprise.GET("/customers/:customer_id/contacts", middleware.RequirePermission(rbac.PermCustomerRead), deps.ContactHandler.ListByCustomer)
	enterprise.GET("/customers/:customer_id/opportunities", middleware.RequirePermission(rbac.PermCustomerRead), deps.OppHandler.ListByCustomer)
	enterprise.POST("/opportunities", middleware.RequirePermission(rbac.PermCustomerCreate), deps.OppHandler.Create)
	enterprise.GET("/customers/:customer_id/tags", middleware.RequirePermission(rbac.PermCustomerRead), deps.CustomerTagHandler.ListByCustomer)
	enterprise.GET("/customer-tags", deps.CustomerTagHandler.ListByEnterprise)

	protected.GET("/customers/:id", middleware.RequirePermission(rbac.PermCustomerRead), deps.CustomerHandler.Get)
	protected.PUT("/customers/:id", middleware.RequirePermission(rbac.PermCustomerUpdate), deps.CustomerHandler.Update)
	protected.DELETE("/customers/:id", middleware.RequirePermission(rbac.PermCustomerDelete), deps.CustomerHandler.Delete)
	protected.DELETE("/customers/:id/tags", middleware.RequirePermission(rbac.PermCustomerUpdate), deps.CustomerTagHandler.RemoveTag)
	protected.GET("/contacts/:id", middleware.RequirePermission(rbac.PermCustomerRead), deps.ContactHandler.Get)
	protected.PUT("/contacts/:id", middleware.RequirePermission(rbac.PermCustomerUpdate), deps.ContactHandler.Update)
	protected.DELETE("/contacts/:id", middleware.RequirePermission(rbac.PermCustomerDelete), deps.ContactHandler.Delete)
	protected.GET("/opportunities/:id", middleware.RequirePermission(rbac.PermCustomerRead), deps.OppHandler.Get)
	protected.PUT("/opportunities/:id", middleware.RequirePermission(rbac.PermCustomerUpdate), deps.OppHandler.Update)
	protected.DELETE("/opportunities/:id", middleware.RequirePermission(rbac.PermCustomerDelete), deps.OppHandler.Delete)
	protected.PUT("/customer-levels/:id", middleware.RequirePermission(rbac.PermCustomerUpdate), deps.CustomerLevelHandler.Update)
	protected.DELETE("/customer-levels/:id", middleware.RequirePermission(rbac.PermCustomerDelete), deps.CustomerLevelHandler.Delete)
}
