package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CORS(origins []string) gin.HandlerFunc {
	allowedOrigins := make(map[string]bool, len(origins))
	for _, o := range origins {
		allowedOrigins[o] = true
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if len(allowedOrigins) == 0 {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Enterprise-ID, X-Request-Source")
			c.Header("Access-Control-Max-Age", "86400")

			if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusNoContent)
				return
			}
			c.Next()
			return
		}

		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Enterprise-ID, X-Request-Source")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
