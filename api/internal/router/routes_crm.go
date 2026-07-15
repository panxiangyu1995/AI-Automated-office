package router

import (
	"github.com/gin-gonic/gin"
)

func registerCRMRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/customers", deps.CustomerHandler.Create)
	enterprise.GET("/customers", deps.CustomerHandler.List)
	enterprise.GET("/customers/:customer_id/panorama", deps.CustomerHandler.Panorama)
	enterprise.POST("/customer-levels", deps.CustomerLevelHandler.Create)
	enterprise.GET("/customer-levels", deps.CustomerLevelHandler.List)
	enterprise.POST("/customers/:customer_id/tags", deps.CustomerTagHandler.AddTag)
	enterprise.POST("/customers/:customer_id/contacts", deps.ContactHandler.Create)
	enterprise.GET("/customers/:customer_id/contacts", deps.ContactHandler.ListByCustomer)
	enterprise.GET("/customers/:customer_id/opportunities", deps.OppHandler.ListByCustomer)
	enterprise.POST("/opportunities", deps.OppHandler.Create)
	enterprise.GET("/customers/:customer_id/tags", deps.CustomerTagHandler.ListByCustomer)
	enterprise.GET("/customer-tags", deps.CustomerTagHandler.ListByEnterprise)

	protected.GET("/customers/:id", deps.CustomerHandler.Get)
	protected.PUT("/customers/:id", deps.CustomerHandler.Update)
	protected.DELETE("/customers/:id", deps.CustomerHandler.Delete)
	protected.DELETE("/customers/:id/tags", deps.CustomerTagHandler.RemoveTag)
	protected.GET("/contacts/:id", deps.ContactHandler.Get)
	protected.PUT("/contacts/:id", deps.ContactHandler.Update)
	protected.DELETE("/contacts/:id", deps.ContactHandler.Delete)
	protected.GET("/opportunities/:id", deps.OppHandler.Get)
	protected.PUT("/opportunities/:id", deps.OppHandler.Update)
	protected.DELETE("/opportunities/:id", deps.OppHandler.Delete)
	protected.PUT("/customer-levels/:id", deps.CustomerLevelHandler.Update)
	protected.DELETE("/customer-levels/:id", deps.CustomerLevelHandler.Delete)
}
