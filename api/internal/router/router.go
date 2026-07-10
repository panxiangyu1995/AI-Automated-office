package router

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/handler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/scheduler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/config"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/observability"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/ratelimit"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/notification"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(cfg *config.Config, logger *zap.Logger, db *gorm.DB, redisClient *rc.Client) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	observability.InitTracing("ai-office-api", "")

	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Metrics())
	r.Use(middleware.Tracing())
	r.Use(middleware.CORS(cfg.Server.CORSOrigins))
	r.Use(middleware.Tenant())

	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/v1")
	{
		healthHandler := handler.NewHealthHandler()
		api.GET("/health", healthHandler.Health)
		api.GET("/ready", healthHandler.Ready)
	}

	var backupService *service.BackupService
	var reminderScheduler *scheduler.ReminderScheduler
	var quotaService *service.QuotaService
	var exportWorker *service.ExportWorker

	var tokenBlacklist *rc.TokenBlacklist
	if redisClient != nil {
		tokenBlacklist = rc.NewTokenBlacklist(redisClient)
	}

	if db != nil {
		userRepo := repository.NewUserRepository(db)

		groupRepo := repository.NewGroupRepository(db)
		groupService := service.NewGroupService(groupRepo, userRepo, jwtManager)
		groupHandler := handler.NewGroupHandler(groupService)

		enterpriseRepo := repository.NewEnterpriseRepository(db)
		enterpriseService := service.NewEnterpriseService(enterpriseRepo, db)
		enterpriseHandler := handler.NewEnterpriseHandler(enterpriseService)
		deptRepo := repository.NewDepartmentRepository(db)

		deptService := service.NewDepartmentService(deptRepo)
		deptHandler := handler.NewDepartmentHandler(deptService)

		empRepo := repository.NewEmployeeRepository(db)
		empService := service.NewEmployeeServiceWithUser(empRepo, deptRepo, userRepo)
		empHandler := handler.NewEmployeeHandler(empService)

		positionRepo := repository.NewPositionRepository(db)
		positionService := service.NewPositionService(positionRepo)
		positionHandler := handler.NewPositionHandler(positionService)

		crossEnterpriseRepo := repository.NewCrossEnterpriseRepository(db)
		crossEnterpriseService := service.NewCrossEnterpriseService(crossEnterpriseRepo)
		crossEnterpriseHandler := handler.NewCrossEnterpriseHandler(crossEnterpriseService)

		empPermRepo := repository.NewEmployeePermissionRepository(db)
		empPermService := service.NewEmployeePermissionService(empPermRepo)
		empPermHandler := handler.NewEmployeePermissionHandler(empPermService)

		permRepo := repository.NewPermissionRepository(db)
		roleRepo := repository.NewRoleRepository(db)
		empPermABACRepo := repository.NewEmployeePermissionABACRepository(db)
		customRuleRepo := repository.NewCustomRuleRepository(db)

		permFacade := rbac.NewPermissionFacade()
		permFacade.RegisterEvaluator(rbac.NewRBACEvaluator())
		permFacade.RegisterEvaluator(rbac.NewABACEvaluator())
		permFacade.RegisterEvaluator(rbac.NewAttributeEvaluator())
		permFacade.RegisterEvaluator(rbac.NewCustomRuleEvaluator())

		permService := service.NewPermissionService(permRepo, roleRepo, empPermABACRepo, customRuleRepo, permFacade)
		permHandler := handler.NewPermissionHandler(permService)
		roleHandler := handler.NewRoleHandler(permService)

		summaryService := service.NewSummaryService(enterpriseRepo, empRepo, deptRepo)
		summaryHandler := handler.NewSummaryHandler(summaryService)

		authService := service.NewAuthServiceFull(userRepo, enterpriseRepo, crossEnterpriseRepo, jwtManager, tokenBlacklist)
		authHandler := handler.NewAuthHandlerFull(authService, empService, tokenBlacklist, jwtManager)

		customerRepo := repository.NewCustomerRepository(db)
		customerService := service.NewCustomerService(customerRepo)
		customerHandler := handler.NewCustomerHandler(customerService)

		customerLevelRepo := repository.NewCustomerLevelRepository(db)
		customerLevelService := service.NewCustomerLevelService(customerLevelRepo)
		customerLevelHandler := handler.NewCustomerLevelHandler(customerLevelService)

		customerTagRepo := repository.NewCustomerTagRepository(db)
		customerTagService := service.NewCustomerTagService(customerTagRepo, customerRepo)
		customerTagHandler := handler.NewCustomerTagHandler(customerTagService)

		contactRepo := repository.NewContactRepository(db)
		contactService := service.NewContactService(contactRepo, customerRepo)
		contactHandler := handler.NewContactHandler(contactService)

		oppRepo := repository.NewOpportunityRepository(db)
		oppService := service.NewOpportunityService(oppRepo, customerRepo)
		oppHandler := handler.NewOpportunityHandler(oppService)

		matRepo := repository.NewMaterialRepository(db)
		matService := service.NewMaterialService(matRepo)
		matHandler := handler.NewMaterialHandler(matService)

		supRepo := repository.NewSupplierRepository(db)
		supService := service.NewSupplierService(supRepo)
		supHandler := handler.NewSupplierHandler(supService)

		whRepo := repository.NewWarehouseRepository(db)
		whService := service.NewWarehouseService(whRepo)
		whHandler := handler.NewWarehouseHandler(whService)

		invRepo := repository.NewInventoryRepository(db)
		invService := service.NewInventoryService(invRepo, matRepo, whRepo)
		invHandler := handler.NewInventoryHandler(invService)

		contractSvc := service.NewContractService(db)
		contractHandler := handler.NewContractHandler(contractSvc)

		orderSvc := service.NewOrderService(db, invRepo, matRepo, whRepo, supRepo, customerRepo)
		orderHandler := handler.NewOrderHandler(orderSvc, contractSvc)

		financeSvc := service.NewFinanceService(db)
		financeHandler := handler.NewFinanceHandler(financeSvc)

		prSvc := service.NewPaymentRequestService(db)
		prHandler := handler.NewPaymentRequestHandler(prSvc)

		colSvc := service.NewCollectionService(db)
		colHandler := handler.NewCollectionHandler(colSvc)

		ppSvc := service.NewPaymentPlanService(db)
		ppHandler := handler.NewPaymentPlanHandler(ppSvc)

		cashflowSvc := service.NewCashFlowService(db)
		cashflowHandler := handler.NewCashFlowHandler(cashflowSvc)

		recSvc := service.NewReconciliationService(db)
		recHandler := handler.NewReconciliationHandler(recSvc)

		roSvc := service.NewRepairOrderService(db)
		roHandler := handler.NewRepairOrderHandler(roSvc)

		ownerSvc := service.NewOwnerService(db)
		ownerHandler := handler.NewOwnerHandler(ownerSvc)

		entHealthSvc := service.NewHealthService(db)
		healthDashboardHandler := handler.NewHealthDashboardHandler(entHealthSvc)

		restoreSvc := service.NewRestoreService(db)
		restoreHandler := handler.NewRestoreHandler(restoreSvc)

		knowledgeSvc := service.NewKnowledgeService(db)
		knowledgeHandler := handler.NewKnowledgeHandler(knowledgeSvc)

		msgRepo := repository.NewMessageRepository(db)
		annRepo := repository.NewAnnouncementRepository(db)
		var unreadCounter *rc.UnreadCounter
		if redisClient != nil {
			unreadCounter = rc.NewUnreadCounter(redisClient)
		}
		msgService := service.NewMessageService(msgRepo, annRepo, unreadCounter)
		msgHandler := handler.NewMessageHandler(msgService)

		wfRepo := repository.NewWorkflowRepository(db)
		wfService := service.NewWorkflowService(wfRepo)
		wfHandler := handler.NewWorkflowHandler(wfService)

		fileRepo := repository.NewFileMetadataRepository(db)
		fileService := service.NewFileService(fileRepo, cfg.Server.BackupDir)
		fileHandler := handler.NewFileHandler(fileService)

		skillRepo := repository.NewSkillRepository(db)
		skillService := service.NewSkillService(skillRepo)
		skillHandler := handler.NewSkillHandler(skillService)

		cfFieldRepo := repository.NewCustomFieldRepository(db)
		cfRelRepo := repository.NewRelationRepository(db)
		cfService := service.NewCustomFieldService(cfFieldRepo, cfRelRepo)
		cfHandler := handler.NewCustomFieldHandler(cfService)

		var smsClient *notification.AliyunSMSClient
		if cfg.Notification.SMS.AccessKeyID != "" {
			smsClient = notification.NewAliyunSMSClient(notification.AliyunSMSConfig{
				AccessKeyID:     cfg.Notification.SMS.AccessKeyID,
				AccessKeySecret: cfg.Notification.SMS.AccessKeySecret,
				SignName:        cfg.Notification.SMS.SignName,
				TemplateCode:    cfg.Notification.SMS.TemplateCode,
				RegionID:        cfg.Notification.SMS.RegionID,
			})
		}
		var emailClient *notification.EmailClient
		if cfg.Notification.Email.Host != "" {
			emailClient = notification.NewEmailClient(notification.EmailConfig{
				Host:     cfg.Notification.Email.Host,
				Port:     cfg.Notification.Email.Port,
				Username: cfg.Notification.Email.Username,
				Password: cfg.Notification.Email.Password,
				From:     cfg.Notification.Email.From,
				UseTLS:   cfg.Notification.Email.UseTLS,
			})
		}
		notifService := notification.NewNotificationService(smsClient, emailClient)
		notifHandler := handler.NewNotificationHandler(notifService)
		platformSvc := service.NewPlatformService(db)
		opsSvc := service.NewOperationsService(db)
		opsHandler := handler.NewOperationsHandler(opsSvc, platformSvc)
		svcOrderSvc := service.NewServiceOrderService(db)
		svcOrderHandler := handler.NewServiceOrderHandler(svcOrderSvc)

		aiSvc := service.NewAIService(db)
		aiHandler := handler.NewAIHandler(aiSvc)

		auditLogRepo := repository.NewAuditLogRepository(db)
		auditLogService := service.NewAuditLogService(auditLogRepo)
		auditLogHandler := handler.NewAuditLogHandler(auditLogService)

		exportRepo := repository.NewExportRepository(db)
		exportService := service.NewExportService(db, exportRepo, cfg.Server.BackupDir)
		exportWorker = service.NewExportWorker(exportService, exportRepo, logger)
		exportHandler := handler.NewExportHandler(exportService, exportWorker)

		auditMiddleware := middleware.NewAuditMiddleware(auditLogService)

		backupConfigRepo := repository.NewBackupConfigRepository(db)
		backupRecordRepo := repository.NewBackupRecordRepository(db)
		backupService = service.NewBackupService(
			backupConfigRepo, backupRecordRepo,
			cfg.Database.Host, fmt.Sprintf("%d", cfg.Database.Port), cfg.Database.User, cfg.Database.Password, cfg.Database.DBName,
			cfg.Server.BackupDir,
		)
		backupHandler := handler.NewBackupHandler(backupService)

		apiQuotaRepo := repository.NewApiQuotaRepository(db)
		featureFlagRepo := repository.NewFeatureFlagRepository(db)
		quotaService = service.NewQuotaService(apiQuotaRepo, featureFlagRepo)
		quotaHandler := handler.NewQuotaHandler(quotaService)
		quotaMiddleware := middleware.NewQuotaMiddleware(quotaService)
		featureFlagMiddleware := middleware.NewFeatureFlagMiddleware(quotaService)

		rateLimiter := ratelimit.NewRateLimiter()
		rateLimitMiddleware := middleware.NewRateLimitMiddleware(rateLimiter)

		auth := api.Group("/auth")
		{
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)

		if db != nil {
			deviceAuthRepo := repository.NewDeviceAuthRepository(db)
			deviceAuthService := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)
			deviceAuthHandler := handler.NewDeviceAuthHandler(deviceAuthService)
			auth.POST("/device/code", deviceAuthHandler.GenerateDeviceCode)
			auth.POST("/device/token", deviceAuthHandler.ExchangeToken)
		}
		}

		operatorOnly := middleware.RequirePermission(rbac.PermSystemConfig)
		financeAccess := middleware.RequirePermission(rbac.PermFinanceRead)
		contractAccess := middleware.RequirePermission(rbac.PermContractRead)
		workflowAccess := middleware.RequirePermission(rbac.PermWorkflowRead)

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtManager, tokenBlacklist), middleware.ResolveEnterpriseContext(), middleware.CLISourceOnly(cfg, logger), auditMiddleware.Record(), quotaMiddleware.Check(), rateLimitMiddleware.Check())
		{
			protected.POST("/auth/switch-enterprise", authHandler.SwitchEnterprise)
			protected.POST("/auth/logout", authHandler.Logout)
			protected.GET("/me", authHandler.Me)
			protected.GET("/me/profile", authHandler.MeProfile)
			protected.GET("/audit-logs", auditLogHandler.List)
			protected.POST("/cross-enterprise/permissions", crossEnterpriseHandler.Grant)
			protected.DELETE("/cross-enterprise/permissions/:id", crossEnterpriseHandler.Revoke)
			protected.GET("/cross-enterprise/permissions", crossEnterpriseHandler.ListByUser)
			protected.GET("/groups/summary/:id", summaryHandler.GroupSummary)

			groups := protected.Group("/groups")
			groups.Use(operatorOnly)
			{
				groups.POST("", groupHandler.Create)
				groups.PUT("/:id", groupHandler.Update)
				groups.DELETE("/:id", groupHandler.Delete)
				groups.GET("", groupHandler.List)
				groups.GET("/:id", groupHandler.Get)
			}

			enterprises := protected.Group("/enterprises")
			enterprises.Use(operatorOnly)
			{
				enterprises.POST("", enterpriseHandler.Create)
				enterprises.PUT("/:enterprise_id", enterpriseHandler.Update)
				enterprises.GET("", enterpriseHandler.List)
				enterprises.GET("/:enterprise_id", enterpriseHandler.Get)
			}
			protected.GET("/quota", quotaHandler.GetQuota)
			protected.PUT("/quota", quotaHandler.UpdateQuota)
			protected.GET("/features", quotaHandler.ListFeatures)
			protected.PUT("/features/:key", quotaHandler.UpdateFeature)

			enterprise := protected.Group("/enterprises/:enterprise_id")
			enterprise.Use(middleware.EnterpriseOwnership(func(userID, targetEnterpriseID uuid.UUID) (bool, error) {
				perm, err := crossEnterpriseRepo.FindByUserAndTarget(userID, targetEnterpriseID)
				if err != nil || perm == nil {
					return false, err
				}
				return true, nil
			}))
			{
				enterprise.GET("/departments/tree", deptHandler.GetTree)
				enterprise.POST("/departments", deptHandler.Create)
			}
			enterprise.POST("/employees", empHandler.Create)
			enterprise.POST("/employees/batch-import", empHandler.BatchImport)
			enterprise.GET("/employees", empHandler.List)
			enterprise.GET("/employees/sales-performance", empHandler.SalesPerformance)
			enterprise.POST("/customers", customerHandler.Create)
			enterprise.GET("/customers", customerHandler.List)
			enterprise.POST("/customer-levels", customerLevelHandler.Create)
			enterprise.GET("/customer-levels", customerLevelHandler.List)
			enterprise.POST("/customers/:customer_id/tags", customerTagHandler.AddTag)
			enterprise.POST("/customers/:customer_id/contacts", contactHandler.Create)
			enterprise.GET("/customers/:customer_id/contacts", contactHandler.ListByCustomer)
			enterprise.GET("/customers/:customer_id/opportunities", oppHandler.ListByCustomer)
			enterprise.POST("/opportunities", oppHandler.Create)
			enterprise.POST("/materials", matHandler.Create)
			enterprise.GET("/materials", matHandler.List)
			enterprise.POST("/suppliers", supHandler.Create)
			enterprise.GET("/suppliers", supHandler.List)
			enterprise.POST("/warehouses", whHandler.Create)
			enterprise.GET("/warehouses", whHandler.List)
			enterprise.GET("/inventory/low-stock", invHandler.LowStock)
			enterprise.POST("/inventory", invHandler.Set)
			enterprise.GET("/inventory/warehouses/:warehouse_id", invHandler.ByWarehouse)
			enterprise.GET("/inventory/materials/:material_id", invHandler.ByMaterial)
			enterprise.POST("/purchase-orders", orderHandler.CreatePurchaseOrder)
			enterprise.POST("/sales-orders", orderHandler.CreateSalesOrder)
			enterprise.POST("/transfers", orderHandler.CreateTransfer)
			enterprise.POST("/requisitions", orderHandler.CreateRequisition)
			enterprise.GET("/orders", orderHandler.ListOrders)
			enterprise.GET("/stock-flows", orderHandler.ListStockFlows)
			enterprise.POST("/service-orders", svcOrderHandler.Create)
			enterprise.GET("/service-orders", svcOrderHandler.List)
			enterprise.POST("/service-orders/:service_order_id/repair-order", roHandler.Create)
			enterprise.POST("/service-orders/:service_order_id/attachments", svcOrderHandler.UploadAttachment)
			c := enterprise.Group("")
			c.Use(contractAccess)
			{
				c.POST("/contracts", contractHandler.Create)
				c.GET("/contracts", contractHandler.List)
			}
			f := enterprise.Group("")
			f.Use(financeAccess)
			{
				f.POST("/payments", financeHandler.CreatePayment)
				f.GET("/payments", financeHandler.ListPayments)
				f.POST("/expenses", financeHandler.CreateExpense)
				f.GET("/expenses", financeHandler.ListExpenses)
				f.POST("/invoices", financeHandler.CreateInvoice)
				f.GET("/invoices", financeHandler.ListInvoices)
				f.POST("/payment-requests", prHandler.Create)
				f.GET("/payment-requests", prHandler.List)
				f.POST("/collections", colHandler.Create)
				f.GET("/collections", colHandler.List)
				f.POST("/contracts/:contract_id/payment-plans", ppHandler.CreateBatch)
				f.GET("/contracts/:contract_id/payment-plans", ppHandler.List)
				f.GET("/payment-plans/overdue", ppHandler.ListOverdue)
				f.GET("/cash-flow-forecast", cashflowHandler.Forecast)
				f.GET("/reconciliation", recHandler.GetReconciliation)
				f.GET("/owner/signals", ownerHandler.Signals)
				f.GET("/owner/kpi", ownerHandler.KPI)
				f.POST("/owner/alert-rules", ownerHandler.CreateAlertRule)
				f.GET("/owner/alert-rules", ownerHandler.ListAlertRules)
			}
			enterprise.POST("/files", knowledgeHandler.UploadFile)
			enterprise.GET("/files", knowledgeHandler.ListFiles)
			enterprise.POST("/files/upload", fileHandler.Upload)
			protected.GET("/files/:file_key/preview", fileHandler.Preview)
			protected.GET("/files/:file_key/view", fileHandler.View)
			protected.GET("/files/:file_key/download", fileHandler.Download)
			enterprise.POST("/messages", msgHandler.Send)
			enterprise.GET("/messages", msgHandler.List)
			enterprise.GET("/messages/unread", msgHandler.Unread)
			enterprise.GET("/messages/poll", msgHandler.Poll)
			enterprise.POST("/messages/:id/read", msgHandler.MarkRead)
			enterprise.POST("/announcements", msgHandler.CreateAnnouncement)
			enterprise.GET("/announcements", msgHandler.ListAnnouncements)
			enterprise.POST("/kb/docs", knowledgeHandler.CreateDoc)
			enterprise.GET("/kb/docs", knowledgeHandler.ListDocs)
			protected.GET("/dashboard", opsHandler.Dashboard)
			protected.GET("/subscription-plans", opsHandler.ListPlans)
			protected.POST("/subscription-plans", opsHandler.CreatePlan)
			protected.GET("/enterprise-subscriptions", opsHandler.ListSubscriptions)
			protected.POST("/enterprise-subscriptions", opsHandler.CreateSubscription)
			protected.GET("/webhooks", opsHandler.ListWebhooks)
			protected.POST("/webhooks", opsHandler.CreateWebhook)
			protected.POST("/expenses/:id/approve", financeHandler.ApproveExpense)
			protected.GET("/payment-requests/:id", prHandler.Get)
			protected.PUT("/payment-requests/:id", prHandler.Update)
			protected.DELETE("/payment-requests/:id", prHandler.Delete)
			protected.POST("/payment-requests/:id/submit", prHandler.SubmitForApproval)
			protected.POST("/payment-requests/:id/approve", prHandler.Approve)
			protected.POST("/payment-requests/:id/reject", prHandler.Reject)
			protected.GET("/collections/:id", colHandler.Get)
			protected.PUT("/payment-plans/:id", ppHandler.Update)
			protected.DELETE("/payment-plans/:id", ppHandler.Delete)
			protected.PUT("/alert-rules/:id", ownerHandler.UpdateAlertRule)
			protected.GET("/audit-log-entries", opsHandler.ListAuditLogs)
			protected.GET("/skills", skillHandler.List)
			protected.POST("/skills", skillHandler.Create)
			protected.GET("/skills/:name", skillHandler.GetDetail)

			protected.GET("/meta/entities/:type/fields", cfHandler.ListFields)
			protected.POST("/meta/fields", cfHandler.CreateField)
			protected.PATCH("/:type/:id/custom-fields", cfHandler.SetCustomFields)
			protected.GET("/:type/:id/relations/:name", cfHandler.GetRelations)

			protected.POST("/notifications/sms/send", notifHandler.SendSMS)
			protected.POST("/notifications/email/send", notifHandler.SendEmail)
			protected.GET("/reports/:type", opsHandler.GetReport)
			protected.POST("/service-tickets", opsHandler.CreateServiceTicket)
			protected.GET("/service-tickets", opsHandler.ListServiceTickets)
			protected.POST("/announcements", opsHandler.CreateAnnouncement)
			protected.GET("/announcements", opsHandler.ListAnnouncements)
			protected.POST("/bills", opsHandler.CreateBill)
			protected.GET("/bills", opsHandler.ListBills)
			protected.GET("/sla-metrics", opsHandler.GetSLAMetrics)
			protected.POST("/service-config", opsHandler.CreateServiceConfig)
			protected.GET("/service-config/:key", opsHandler.GetServiceConfig)
		exportAccess := middleware.RequireAnyPermission(rbac.PermEmployeeRead, rbac.PermCustomerRead, rbac.PermContractRead, rbac.PermFinanceRead, rbac.PermOrderRead, rbac.PermProductRead)

			protected.GET("/data-export", exportAccess, exportHandler.ListTasks)
			protected.POST("/data-export", exportAccess, exportHandler.CreateTask)
			protected.GET("/data-export/:id", exportAccess, exportHandler.GetTask)
			protected.GET("/data-export/:id/download", exportAccess, exportHandler.DownloadTask)
			protected.POST("/data-import", opsHandler.ImportData)
			protected.GET("/operator/enterprises/:id/health", healthDashboardHandler.GetEnterpriseHealth)
			protected.GET("/operator/health-dashboard", healthDashboardHandler.GetDashboard)
			protected.POST("/:type/:id/restore", restoreHandler.Restore)
			protected.POST("/ai/sessions", aiHandler.CreateSession)
			protected.GET("/ai/sessions", aiHandler.ListSessions)
			protected.POST("/ai/sessions/:session_id/messages", aiHandler.SendMessage)
			protected.GET("/ai/sessions/:session_id/messages", aiHandler.GetMessages)
			protected.PUT("/ai/preferences", aiHandler.UpdatePreference)
			protected.GET("/service-orders/:service_order_id", svcOrderHandler.Get)
			protected.PUT("/service-orders/:service_order_id", svcOrderHandler.Quote)
			protected.DELETE("/service-orders/:service_order_id", svcOrderHandler.Delete)
			protected.PATCH("/service-orders/:service_order_id/status", svcOrderHandler.ChangeStatus)
			protected.POST("/service-orders/:service_order_id/sign", svcOrderHandler.Sign)
			protected.GET("/service-orders/:service_order_id/repair-order", roHandler.Get)
			protected.GET("/service-orders/:service_order_id/attachments", svcOrderHandler.ListAttachments)
			protected.PUT("/repair-orders/:id", roHandler.Update)
			enterprise.POST("/kb/categories", knowledgeHandler.CreateCategory)
			enterprise.GET("/kb/categories", knowledgeHandler.ListCategories)
			enterprise.GET("/kb/semantic-search", knowledgeHandler.SemanticSearch)
			protected.POST("/kb/docs/:id/chunk", knowledgeHandler.ChunkDocument)
			protected.GET("/kb/docs/:id/chunks", knowledgeHandler.GetChunks)
			enterprise.GET("/customers/:customer_id/tags", customerTagHandler.ListByCustomer)
			enterprise.GET("/customer-tags", customerTagHandler.ListByEnterprise)
			enterprise.POST("/positions", positionHandler.Create)
			enterprise.GET("/positions", positionHandler.List)
			protected.GET("/customers/:id", customerHandler.Get)
			protected.PUT("/customers/:id", customerHandler.Update)
			protected.DELETE("/customers/:id", customerHandler.Delete)
			protected.DELETE("/customers/:id/tags", customerTagHandler.RemoveTag)
			protected.PUT("/contacts/:id", contactHandler.Update)
			protected.DELETE("/contacts/:id", contactHandler.Delete)
			protected.PUT("/opportunities/:id", oppHandler.Update)
			protected.DELETE("/opportunities/:id", oppHandler.Delete)
			protected.GET("/materials/:id", matHandler.Get)
			protected.PUT("/materials/:id", matHandler.Update)
			protected.DELETE("/materials/:id", matHandler.Delete)
			protected.GET("/suppliers/:id", supHandler.Get)
			protected.PUT("/suppliers/:id", supHandler.Update)
			protected.DELETE("/suppliers/:id", supHandler.Delete)
			protected.GET("/warehouses/:id", whHandler.Get)
			protected.PUT("/warehouses/:id", whHandler.Update)
			protected.DELETE("/warehouses/:id", whHandler.Delete)
			protected.POST("/purchase-orders/:id/receive", orderHandler.ReceivePurchase)
			protected.POST("/sales-orders/:id/ship", orderHandler.ShipSalesOrder)
			protected.POST("/sales-orders/:id/contract", orderHandler.BindContract)
			protected.POST("/sales-orders/:id/delivery", orderHandler.Delivery)
			protected.PATCH("/sales-orders/:id/status", orderHandler.ChangeSalesOrderStatus)
			protected.POST("/transfers/:id/execute", orderHandler.ExecuteTransfer)
			protected.POST("/requisitions/:id/issue", orderHandler.IssueRequisition)
			pc := protected.Group("")
			pc.Use(contractAccess)
			{
				pc.GET("/contracts/:id", contractHandler.Get)
				pc.PUT("/contracts/:id", contractHandler.Update)
				pc.DELETE("/contracts/:id", contractHandler.Delete)
				pc.PATCH("/contracts/:id", contractHandler.PatchFields)
				pc.PATCH("/contracts/:id/status", contractHandler.ChangeStatus)
				pc.POST("/contracts/:id/submit-approval", contractHandler.SubmitApproval)
				pc.POST("/contracts/:id/approve", contractHandler.Approve)
				pc.POST("/contracts/:id/attachments", contractHandler.UploadAttachment)
				pc.POST("/contracts/:id/documents", contractHandler.LinkDocument)
				pc.GET("/contracts/:id/documents", contractHandler.ListDocuments)
			}
			protected.PUT("/customer-levels/:id", customerLevelHandler.Update)
			protected.DELETE("/customer-levels/:id", customerLevelHandler.Delete)
			protected.PUT("/positions/:id", positionHandler.Update)
			protected.PUT("/employees/:id", empHandler.Update)
			protected.DELETE("/employees/:id", empHandler.Delete)
			protected.GET("/employees/:id", empHandler.Get)
			protected.PUT("/employees/:id/transfer", empHandler.Transfer)
			protected.POST("/employees/:id/permissions", empPermHandler.Set)
			protected.DELETE("/employees/:id/permissions", empPermHandler.Revoke)
			protected.GET("/employees/:id/permissions", empPermHandler.List)

			protected.GET("/permissions", permHandler.List)
			protected.POST("/permissions/check", permHandler.Check)
			protected.GET("/roles", roleHandler.List)
			protected.POST("/roles", roleHandler.Create)
			protected.GET("/roles/:id/permissions", roleHandler.GetPermissions)
			protected.PUT("/roles/:id/permissions", roleHandler.SetPermissions)

			pw := protected.Group("")
			pw.Use(workflowAccess)
			{
				pw.POST("/workflow-definitions", wfHandler.CreateDefinition)
				pw.GET("/workflow-definitions", wfHandler.ListDefinitions)
				pw.GET("/workflow-definitions/:id", wfHandler.GetDefinition)
				pw.POST("/workflows", wfHandler.SubmitWorkflow)
				pw.GET("/workflows/pending", wfHandler.ListPending)
				pw.POST("/workflows/:id/approve", wfHandler.Approve)
				pw.POST("/workflows/:id/reject", wfHandler.Reject)
				pw.GET("/workflows/:id/history", wfHandler.History)
				pw.POST("/workflows/:id/transfer", wfHandler.Transfer)
				pw.POST("/workflows/:id/return", wfHandler.Return)
				pw.POST("/workflows/:id/resubmit", wfHandler.Resubmit)
			}

			protected.PUT("/departments/:id", deptHandler.Update)
			protected.PUT("/departments/:id/manager", deptHandler.SetManager)
			protected.DELETE("/departments/:id", deptHandler.Delete)

			backup := protected.Group("/backup")
			backup.Use(featureFlagMiddleware.Require("backup"))
			{
				backup.POST("/configs", backupHandler.CreateConfig)
				backup.PUT("/configs/:id", backupHandler.UpdateConfig)
				backup.DELETE("/configs/:id", backupHandler.DeleteConfig)
				backup.GET("/configs", backupHandler.ListConfigs)
				backup.GET("/configs/:id", backupHandler.GetConfig)
				backup.GET("/records", backupHandler.ListRecords)
				backup.POST("/trigger", backupHandler.TriggerBackup)
				backup.POST("/restore/:record_id", backupHandler.Restore)
			}
		}

		go func() {
			reminderScheduler = scheduler.NewReminderScheduler(ppSvc, logger)
			reminderScheduler.Start()
		}()
	}

	if backupService != nil {
		go func() {
			ticker := time.NewTicker(1 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				backupService.CheckAndRunScheduled()
			}
		}()
	}

	if exportWorker != nil {
		exportWorker.Start(context.Background())
	}

	return r
}
