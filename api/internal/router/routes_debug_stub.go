//go:build !debug

package router

import (
	"github.com/gin-gonic/gin"
)

func registerDebugRoutes(api *gin.RouterGroup, deps *RouterDeps) {
}

func stubMiddleware(deps *RouterDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
