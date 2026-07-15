package router

import (
	"github.com/gin-gonic/gin"
)

func registerAuthRoutes(api *gin.RouterGroup, deps *RouterDeps) {
	auth := api.Group("/auth")
	{
		auth.POST("/login", deps.AuthHandler.Login)
		auth.POST("/refresh", deps.AuthHandler.Refresh)

		if deps.DeviceAuthHandler != nil {
			auth.POST("/device/code", deps.DeviceAuthHandler.GenerateDeviceCode)
			auth.POST("/device/token", deps.DeviceAuthHandler.ExchangeToken)
		}
	}
}
