package router

import (
	"github.com/gin-gonic/gin"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func registerInfraRoutes(protected *gin.RouterGroup, enterprise *gin.RouterGroup, deps *RouterDeps) {
	enterprise.POST("/files", deps.KnowledgeHandler.UploadFile)
	enterprise.GET("/files", deps.KnowledgeHandler.ListFiles)
	enterprise.POST("/files/upload", deps.FileHandler.Upload)
	protected.GET("/files/:file_key/preview", deps.FileHandler.Preview)
	protected.GET("/files/:file_key/view", deps.FileHandler.View)
	protected.GET("/files/:file_key/download", deps.FileHandler.Download)

	enterprise.GET("/messages/:id", deps.MsgHandler.Get)
	enterprise.POST("/messages", deps.MsgHandler.Send)
	enterprise.GET("/messages", deps.MsgHandler.List)
	enterprise.GET("/messages/unread", deps.MsgHandler.Unread)
	enterprise.GET("/messages/poll", deps.MsgHandler.Poll)
	enterprise.POST("/messages/:id/read", deps.MsgHandler.MarkRead)
	enterprise.POST("/announcements", deps.MsgHandler.CreateAnnouncement)
	enterprise.GET("/announcements", deps.MsgHandler.ListAnnouncements)

	enterprise.POST("/kb/docs", deps.KnowledgeHandler.CreateDoc)
	enterprise.GET("/kb/docs", deps.KnowledgeHandler.ListDocs)
	enterprise.POST("/kb/categories", deps.KnowledgeHandler.CreateCategory)
	enterprise.GET("/kb/categories", deps.KnowledgeHandler.ListCategories)
	enterprise.GET("/kb/semantic-search", deps.KnowledgeHandler.SemanticSearch)
	protected.POST("/kb/docs/:id/chunk", deps.KnowledgeHandler.ChunkDocument)
	protected.GET("/kb/docs/:id/chunks", deps.KnowledgeHandler.GetChunks)
	enterprise.GET("/kb/docs/:id/versions", deps.KnowledgeHandler.ListVersions)
	enterprise.GET("/kb/docs/:id/versions/:version", deps.KnowledgeHandler.GetVersion)
	enterprise.GET("/kb/docs/:id/compare", deps.KnowledgeHandler.CompareVersions)

	workflowAccess := middleware.RequirePermission(rbac.PermWorkflowRead)
	pw := protected.Group("")
	pw.Use(workflowAccess)
	{
		pw.POST("/workflow-definitions", deps.WfHandler.CreateDefinition)
		pw.GET("/workflow-definitions", deps.WfHandler.ListDefinitions)
		pw.GET("/workflow-definitions/:id", deps.WfHandler.GetDefinition)
		pw.GET("/workflows/:id", deps.WfHandler.GetInstance)
		pw.POST("/workflows", deps.WfHandler.SubmitWorkflow)
		pw.GET("/workflows/pending", deps.WfHandler.ListPending)
		pw.POST("/workflows/:id/approve", deps.WfHandler.Approve)
		pw.POST("/workflows/:id/reject", deps.WfHandler.Reject)
		pw.GET("/workflows/:id/history", deps.WfHandler.History)
		pw.POST("/workflows/:id/transfer", deps.WfHandler.Transfer)
		pw.POST("/workflows/:id/return", deps.WfHandler.Return)
		pw.POST("/workflows/:id/resubmit", deps.WfHandler.Resubmit)
		pw.GET("/workflows/:id/parallel-status", deps.WfHandler.GetParallelStatus)
	}

	protected.GET("/skills", deps.SkillHandler.List)
	protected.POST("/skills", deps.SkillHandler.Create)
	protected.GET("/skills/:name", deps.SkillHandler.GetDetail)

	protected.GET("/assist/todo-aggregation", deps.AssistHandler.TodoAggregation)
	protected.GET("/assist/process-guide", deps.AssistHandler.ProcessGuide)
	protected.GET("/assist/work-report", deps.AssistHandler.WorkReport)

	protected.GET("/meta/entities/:type/fields", deps.CustomFieldHandler.ListFields)
	protected.POST("/meta/fields", deps.CustomFieldHandler.CreateField)
	protected.PATCH("/:type/:id/custom-fields", deps.CustomFieldHandler.SetCustomFields)
	protected.GET("/:type/:id/relations/:name", deps.CustomFieldHandler.GetRelations)

	protected.POST("/notifications/sms/send", deps.NotificationHandler.SendSMS)
	protected.POST("/notifications/email/send", deps.NotificationHandler.SendEmail)

	backup := protected.Group("/backup")
	backup.Use(deps.FeatureFlagMiddleware.Require("backup"))
	{
		backup.POST("/configs", deps.BackupHandler.CreateConfig)
		backup.PUT("/configs/:id", deps.BackupHandler.UpdateConfig)
		backup.DELETE("/configs/:id", deps.BackupHandler.DeleteConfig)
		backup.GET("/configs", deps.BackupHandler.ListConfigs)
		backup.GET("/configs/:id", deps.BackupHandler.GetConfig)
		backup.GET("/records", deps.BackupHandler.ListRecords)
		backup.POST("/trigger", deps.BackupHandler.TriggerBackup)
		backup.POST("/restore/:record_id", deps.BackupHandler.Restore)
	}

	protected.POST("/ai/sessions", deps.AIHandler.CreateSession)
	protected.GET("/ai/sessions", deps.AIHandler.ListSessions)
	protected.POST("/ai/sessions/:session_id/messages", deps.AIHandler.SendMessage)
	protected.GET("/ai/sessions/:session_id/messages", deps.AIHandler.GetMessages)
	protected.PUT("/ai/preferences", deps.AIHandler.UpdatePreference)
}
