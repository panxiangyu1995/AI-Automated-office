package router

import (
	"github.com/gin-gonic/gin"
)

func registerSecurityRoutes(protected *gin.RouterGroup, deps *RouterDeps) {
	mfa := protected.Group("/mfa")
	{
		mfa.POST("/enable", deps.MFAHandler.Enable)
		mfa.POST("/verify", deps.MFAHandler.Verify)
		mfa.POST("/disable", deps.MFAHandler.Disable)
		mfa.GET("/status", deps.MFAHandler.Status)
	}

	maskingGroup := protected.Group("/masking")
	{
		maskingGroup.GET("/rules", deps.MaskingHandler.GetRules)
		maskingGroup.POST("/rules", deps.MaskingHandler.SetRules)
	}

	protected.POST("/undo/:operation_id", deps.UndoHandler.Undo)

	batch := protected.Group("/batch")
	{
		batch.POST("/approve", deps.BatchHandler.BatchApprove)
		batch.POST("/delete", deps.BatchHandler.BatchDelete)
		batch.POST("/status-change", deps.BatchHandler.BatchStatusChange)
	}
}
