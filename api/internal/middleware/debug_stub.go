//go:build debug

package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
)

func StubInterceptor(stubSvc *service.DebugStubService) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		path := c.Request.URL.Path

		stub, ok := stubSvc.Match(method, path)
		if !ok {
			c.Next()
			return
		}

		for k, v := range stub.Headers {
			c.Header(k, v)
		}
		c.JSON(stub.Status, stub.Body)
		c.Abort()
	}
}
